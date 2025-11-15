import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
} from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { StoreConfig } from '../entities/store-config.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import {
  CreateStoreConfigDto,
  UpdateStoreConfigDto,
} from './dto/store-config.dto';
import { SolanaContractService } from './solana-contract.service';
import { NftService } from './nft.service';
import axios from 'axios';

const PROGRAM_ID = new PublicKey(
  '6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm',
);

@Injectable()
export class NftAdminService {
  private connection: Connection;

  constructor(
    @InjectRepository(NftCollection)
    private nftCollectionRepo: Repository<NftCollection>,
    @InjectRepository(NftType)
    private nftTypeRepo: Repository<NftType>,
    @InjectRepository(StoreConfig)
    private storeConfigRepo: Repository<StoreConfig>,
    public solanaContractService: SolanaContractService,
    private nftService: NftService,
  ) {
    this.connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
  }

  /**
   * Upload JSON metadata to IPFS via QuickNode S3 API
   * Documentation: https://www.quicknode.com/docs/ipfs
   */
  async uploadToIPFS(metadata: any): Promise<string> {
    try {
      console.log(
        'Uploading metadata to QuickNode IPFS:',
        JSON.stringify(metadata, null, 2),
      );

      const apiKey = process.env.QUICKNODE_IPFS_API_KEY;
      if (!apiKey) {
        throw new Error('QUICKNODE_IPFS_API_KEY is not configured');
      }

      // Convert metadata to Buffer
      const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf-8');
      const fileName = `metadata_${Date.now()}.json`;

      // Create FormData with Body, Key, and ContentType
      const FormData = require('form-data');
      const form = new FormData();
      form.append('Body', metadataBuffer, {
        filename: fileName,
      });
      form.append('Key', fileName);
      form.append('ContentType', 'application/json');

      // Use QuickNode IPFS S3 put-object endpoint with axios
      const response = await axios.post(
        'https://api.quicknode.com/ipfs/rest/v1/s3/put-object',
        form,
        {
          headers: {
            'x-api-key': apiKey,
            ...form.getHeaders(),
          },
        },
      );

      const result = response.data;

      // Extract CID from response
      const cid = this.extractCIDFromResponse(result);

      // Use custom QuickNode gateway URL from environment variable
      const gatewayBaseUrl =
        process.env.QUICKNODE_IPFS_GATEWAY_URL ||
        'https://husband-toy-slight.quicknode-ipfs.com/ipfs';
      const gatewayUrl = `${gatewayBaseUrl}/${cid}`;

      console.log('✅ Uploaded metadata to IPFS');
      console.log('   CID:', cid);
      console.log('   Gateway URL:', gatewayUrl);

      return gatewayUrl;
    } catch (error) {
      console.error('Error uploading metadata to IPFS:', error);
      const errorMessage = error.response?.data?.message || error.message;
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload metadata to IPFS',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Upload file buffer to IPFS via QuickNode S3 API
   * Documentation: https://www.quicknode.com/docs/ipfs
   */
  async uploadFileToIPFS(
    fileBuffer: Buffer,
    filename: string,
    customName?: string,
  ): Promise<string> {
    try {
      console.log('Uploading file to QuickNode IPFS:', filename);

      const apiKey = process.env.QUICKNODE_IPFS_API_KEY;
      if (!apiKey) {
        throw new Error('QUICKNODE_IPFS_API_KEY is not configured');
      }

      // Use custom name if provided, otherwise use original filename
      const finalFilename = customName || filename;
      const fileKey = `${finalFilename}_${Date.now()}`;
      const contentType = this.getMimeType(filename);

      // Create FormData with Body, Key, and ContentType
      const FormData = require('form-data');
      const form = new FormData();
      form.append('Body', fileBuffer, {
        filename: filename,
        contentType: contentType,
      });
      form.append('Key', fileKey);
      form.append('ContentType', contentType);

      // Use QuickNode IPFS S3 put-object endpoint with axios
      const response = await axios.post(
        'https://api.quicknode.com/ipfs/rest/v1/s3/put-object',
        form,
        {
          headers: {
            'x-api-key': apiKey,
            ...form.getHeaders(),
          },
        },
      );

      const result = response.data;

      // Extract CID from response
      const cid = this.extractCIDFromResponse(result);

      // Use custom QuickNode gateway URL from environment variable
      const gatewayBaseUrl =
        process.env.QUICKNODE_IPFS_GATEWAY_URL ||
        'https://husband-toy-slight.quicknode-ipfs.com/ipfs';
      const gatewayUrl = `${gatewayBaseUrl}/${cid}`;

      console.log('✅ File uploaded to IPFS');
      console.log('   CID:', cid);
      console.log('   Gateway URL:', gatewayUrl);

      return gatewayUrl;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      const errorMessage = error.response?.data?.message || error.message;
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload file to IPFS',
          error: errorMessage,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Extract CID from QuickNode IPFS response
   * QuickNode S3 API may return CID in different fields
   */
  private extractCIDFromResponse(result: any): string {
    console.log(
      'QuickNode IPFS response (full):',
      JSON.stringify(result, null, 2),
    );

    // QuickNode S3 put-object returns the CID in different fields
    // Common fields: pin.cid, cid, ipfsHash, IpfsHash, hash
    let cid =
      result.pin?.cid ||
      result.cid ||
      result.ipfsHash ||
      result.IpfsHash ||
      result.hash;

    // If requestid looks like a CID (starts with Qm or b), use it
    if (!cid && result.requestid) {
      const reqId = result.requestid;
      if (reqId.startsWith('Qm') || reqId.startsWith('b')) {
        cid = reqId;
      } else {
        console.warn('⚠️  requestid does not look like a valid CID:', reqId);
        console.warn('   Expected CID to start with "Qm" or "b"');
      }
    }

    if (!cid) {
      console.error('❌ No valid CID found in response');
      console.error('   Available fields:', Object.keys(result));
      console.error('   Full response:', result);
      throw new Error(
        'Failed to get CID from IPFS upload response. Check QuickNode API response format.',
      );
    }

    return cid;
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      json: 'application/json',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  }

  /**
   * Upload image to IPFS if it's base64 or a URL that needs to be stored
   */
  async uploadImageToIPFS(imageData: string): Promise<string> {
    try {
      // If already an IPFS URI, return as-is
      if (imageData.startsWith('ipfs://')) {
        return imageData;
      }

      // If it's a regular HTTP URL, return as-is (already hosted)
      if (imageData.startsWith('http://') || imageData.startsWith('https://')) {
        return imageData;
      }

      // If it's base64 data, upload to IPFS
      if (imageData.startsWith('data:image')) {
        console.log('Uploading base64 image to IPFS...');

        // Extract base64 data
        const base64Data = imageData.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        return await this.uploadFileToIPFS(buffer, 'image.png');
      }

      // Default: return as-is
      return imageData;
    } catch (error) {
      console.error('Error uploading image to IPFS:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload image to IPFS',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create NFT collection with IPFS metadata
   */
  async createCollection(dto: CreateCollectionDto): Promise<any> {
    try {
      // Validate admin public key if provided
      if (dto.adminPublicKey) {
        try {
          new PublicKey(dto.adminPublicKey);
        } catch (error) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid admin public key',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Upload image to IPFS
      const imageUri = await this.uploadImageToIPFS(dto.image);

      // Create metadata JSON
      const metadata = {
        name: dto.name,
        symbol: dto.symbol,
        description: dto.description,
        image: imageUri,
        external_url: 'https://vybe.game',
        attributes: [],
        properties: {
          category: 'image',
          files: [
            {
              uri: imageUri,
              type: 'image/png',
            },
          ],
        },
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Save to database
      const collection = this.nftCollectionRepo.create({
        id: `${dto.name}_${Date.now()}`, // Temporary ID until we get the mint address
        admin: dto.adminPublicKey || 'pending',
        name: dto.name,
        symbol: dto.symbol,
        uri: metadataUri,
        royalty: dto.royalty,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.nftCollectionRepo.save(collection);

      console.log('✅ Collection created in database:', collection);

      return {
        success: true,
        data: {
          collection,
          metadata,
          metadataUri,
          message:
            'Collection created successfully. Please create the collection on-chain using the provided metadata URI.',
        },
      };
    } catch (error) {
      console.error('Error creating collection:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create collection',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create NFT type with IPFS metadata (DEPRECATED - use prepareCreateType instead)
   */
  async createType(dto: CreateTypeDto): Promise<any> {
    try {
      // Find collection in database
      const collection = await this.nftCollectionRepo.findOne({
        where: { name: dto.collectionName },
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found: ${dto.collectionName}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Upload main image to IPFS
      const mainImageUri = await this.uploadImageToIPFS(dto.image);

      // Upload additional images if provided
      let additionalImageUris: string[] = [];
      if (dto.additionalImages && dto.additionalImages.length > 0) {
        console.log('Uploading additional images...');
        additionalImageUris = await Promise.all(
          dto.additionalImages.map((img) => this.uploadImageToIPFS(img)),
        );
      }

      // Create metadata JSON
      const metadata = {
        name: dto.name,
        symbol: collection.symbol,
        description: dto.description,
        image: mainImageUri,
        external_url: 'https://vybe.game',
        attributes: dto.attributes || [],
        properties: {
          category: 'image',
          files: [
            {
              uri: mainImageUri,
              type: 'image/png',
            },
            ...additionalImageUris.map((uri) => ({
              uri,
              type: 'image/png',
            })),
          ],
        },
        additionalImages: additionalImageUris,
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Convert price to lamports (SOL * LAMPORTS_PER_SOL)
      const priceLamports = Math.floor(dto.price * 1_000_000_000);
      const stakingLamports = dto.stakingAmount
        ? Math.floor(dto.stakingAmount * 1_000_000_000)
        : 0;

      // Save to database
      const nftType = this.nftTypeRepo.create({
        id: `${dto.collectionName}_${dto.name}_${Date.now()}`, // Temporary ID until we get the PDA
        collectionId: collection.id,
        name: dto.name,
        uri: metadataUri,
        price: priceLamports.toString(),
        maxSupply: dto.maxSupply.toString(),
        currentSupply: '0',
        stakingAmount: stakingLamports.toString(),
        mainImage: mainImageUri,
        additionalImages: JSON.stringify(additionalImageUris),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.nftTypeRepo.save(nftType);

      console.log('✅ NFT Type created in database:', nftType);

      return {
        success: true,
        data: {
          nftType,
          metadata,
          metadataUri,
          priceLamports,
          stakingLamports,
          message:
            'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.',
        },
      };
    } catch (error) {
      console.error('Error creating NFT type:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create NFT type',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all collections from database
   */
  async getAllCollections(): Promise<NftCollection[]> {
    return this.nftCollectionRepo.find({
      relations: ['nftTypes'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all types for a collection
   */
  async getTypesByCollection(collectionName: string): Promise<NftType[]> {
    const collection = await this.nftCollectionRepo.findOne({
      where: { name: collectionName },
    });

    if (!collection) {
      throw new HttpException(
        {
          success: false,
          message: `Collection not found: ${collectionName}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return this.nftTypeRepo.find({
      where: { collectionId: collection.id },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Sync collections from Solana blockchain to database
   */
  async syncCollectionsFromBlockchain(): Promise<{
    synced: number;
    updated: number;
    created: number;
    collections: any[];
  }> {
    try {
      console.log('🔄 Syncing collections from blockchain...');

      // Fetch collections from blockchain
      const blockchainCollections =
        await this.solanaContractService.syncCollectionsFromBlockchain();

      let created = 0;
      let updated = 0;
      const syncedCollections: any[] = [];

      for (const bcCollection of blockchainCollections) {
        const collectionId = bcCollection.mint || bcCollection.pubkey;

        // Check if collection exists in DB
        let dbCollection = await this.nftCollectionRepo.findOne({
          where: { id: collectionId },
        });

        if (!dbCollection) {
          dbCollection = await this.nftCollectionRepo.findOne({
            where: { name: bcCollection.name },
          });
        }

        if (dbCollection) {
          // Update existing collection
          dbCollection.id = collectionId;
          dbCollection.symbol = bcCollection.symbol;
          dbCollection.uri = bcCollection.uri;
          dbCollection.royalty = Number(bcCollection.royalty);
          dbCollection.admin = bcCollection.admin;
          dbCollection.isActive = bcCollection.isActive;
          dbCollection.updatedAt = new Date();

          await this.nftCollectionRepo.save(dbCollection);
          updated++;

          console.log(`✅ Updated collection: ${bcCollection.name}`);
        } else {
          // Create new collection
          dbCollection = this.nftCollectionRepo.create({
            id: collectionId,
            name: bcCollection.name,
            symbol: bcCollection.symbol,
            uri: bcCollection.uri,
            royalty: Number(bcCollection.royalty),
            admin: bcCollection.admin,
            isActive: bcCollection.isActive,
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          await this.nftCollectionRepo.save(dbCollection);
          created++;

          console.log(`✅ Created collection: ${bcCollection.name}`);
        }

        syncedCollections.push({
          ...bcCollection,
          dbId: dbCollection.id,
        });
      }

      console.log(`✅ Sync complete: ${created} created, ${updated} updated`);

      return {
        synced: blockchainCollections.length,
        created,
        updated,
        collections: syncedCollections,
      };
    } catch (error) {
      console.error('Error syncing collections:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync collections from blockchain',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sync NFT types from Solana blockchain to database
   */
  async syncTypesFromBlockchain(): Promise<{
    synced: number;
    updated: number;
    created: number;
    skipped: number;
    types: any[];
  }> {
    try {
      console.log('🔄 Syncing NFT types from blockchain...');

      // Fetch blockchain data once
      const [blockchainTypes, blockchainCollections] = await Promise.all([
        this.solanaContractService.syncTypesFromBlockchain(),
        this.solanaContractService.syncCollectionsFromBlockchain(),
      ]);

      const collectionMap = new Map(
        blockchainCollections.map((c) => [c.pubkey, c]),
      );

      let created = 0;
      let updated = 0;
      let skipped = 0;
      const syncedTypes: any[] = [];

      for (const bcType of blockchainTypes) {
        console.log(
          `\n🔍 Processing type: ${bcType.name}, collection PDA: ${bcType.collection}`,
        );

        // Find the collection in DB - we need to get all collections and match by PDA
        const allCollections = await this.nftCollectionRepo.find();

        // Get collection PDA from blockchain data
        const collectionPDA = bcType.collection;

        // Try to find matching collection by checking blockchain collection names
        // Since we just synced, we can fetch collection data from blockchain
        let collection: NftCollection | null = null;

        try {
          // Fetch the collection account from blockchain to get its name
          const matchingBcCollection = collectionMap.get(collectionPDA);

          console.log(
            `  Matching blockchain collection:`,
            matchingBcCollection ? matchingBcCollection.name : 'NOT FOUND',
          );

          if (matchingBcCollection) {
            collection = await this.nftCollectionRepo.findOne({
              where: { name: matchingBcCollection.name },
            });
            console.log(
              `  DB collection found:`,
              collection ? collection.name : 'NOT FOUND',
            );
          }
        } catch (err) {
          console.error(
            `  ❌ Error fetching collection for type ${bcType.name}:`,
            err.message,
          );
        }

        if (!collection) {
          console.warn(
            `  ⚠️ Collection not found for type: ${bcType.name} (collection PDA: ${bcType.collection})`,
          );
          skipped++;
          continue;
        }

        // Check if type exists in DB by name and collection
        let dbType = await this.nftTypeRepo.findOne({
          where: {
            name: bcType.name,
            collectionId: collection.id,
          },
        });

        if (dbType) {
          // Update existing type
          dbType.uri = bcType.uri;
          dbType.price = bcType.price;
          dbType.maxSupply = bcType.maxSupply;
          dbType.currentSupply = bcType.currentSupply;
          dbType.stakingAmount = bcType.stakingAmount;
          dbType.updatedAt = new Date();

          await this.nftTypeRepo.save(dbType);
          updated++;

          console.log(`✅ Updated NFT type: ${bcType.name}`);
        } else {
          // Create new type (need to fetch metadata from URI)
          try {
            const metadataResponse = await fetch(bcType.uri);
            const metadata = await metadataResponse.json();

            dbType = this.nftTypeRepo.create({
              id: bcType.pubkey,
              collectionId: collection.id,
              name: bcType.name,
              uri: bcType.uri,
              price: bcType.price,
              maxSupply: bcType.maxSupply,
              currentSupply: bcType.currentSupply,
              stakingAmount: bcType.stakingAmount,
              mainImage:
                metadata.image || metadata.properties?.files?.[0]?.uri || '',
              additionalImages: JSON.stringify(metadata.additionalImages || []),
            });

            await this.nftTypeRepo.save(dbType);
            created++;

            console.log(`✅ Created NFT type: ${bcType.name}`);
          } catch (fetchError) {
            console.error(
              `❌ Failed to fetch metadata for ${bcType.name}:`,
              fetchError.message,
            );
            skipped++;
            continue;
          }
        }

        syncedTypes.push({
          ...bcType,
          dbId: dbType.id,
          collectionName: collection.name,
        });
      }

      console.log(
        `✅ Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`,
      );

      return {
        synced: blockchainTypes.length,
        created,
        updated,
        skipped,
        types: syncedTypes,
      };
    } catch (error) {
      console.error('Error syncing NFT types:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync NFT types from blockchain',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all NFT types from all collections
   */
  async getAllTypes(): Promise<NftType[]> {
    return this.nftTypeRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Create or update store configuration for a tab
   */
  async setStoreConfig(dto: CreateStoreConfigDto): Promise<StoreConfig> {
    // Check if collection exists
    const collection = await this.nftCollectionRepo.findOne({
      where: { name: dto.collectionName },
    });

    if (!collection) {
      throw new HttpException(
        {
          success: false,
          message: `Collection not found: ${dto.collectionName}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Check if config already exists for this tab
    let config = await this.storeConfigRepo.findOne({
      where: { tabName: dto.tabName },
    });

    if (config) {
      // Update existing config
      config.collectionName = dto.collectionName;
      config.displayName = dto.displayName;
      config.collectionId = dto.collectionId || collection.id;
      config.sortOrder =
        dto.sortOrder !== undefined ? dto.sortOrder : config.sortOrder;
      config.updatedAt = new Date();
    } else {
      // Create new config
      config = this.storeConfigRepo.create({
        tabName: dto.tabName,
        collectionName: dto.collectionName,
        displayName: dto.displayName,
        collectionId: dto.collectionId || collection.id,
        isActive: true,
        sortOrder: dto.sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return this.storeConfigRepo.save(config);
  }

  /**
   * Update store configuration
   */
  async updateStoreConfig(
    tabName: string,
    dto: UpdateStoreConfigDto,
  ): Promise<StoreConfig> {
    const config = await this.storeConfigRepo.findOne({
      where: { tabName },
    });

    if (!config) {
      throw new HttpException(
        {
          success: false,
          message: `Store config not found for tab: ${tabName}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate collection if provided (check blockchain)
    if (dto.collectionName) {
      const { collections } = await this.nftService.fetchCollections();
      const collection = collections.find((c) => c.name === dto.collectionName);

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found on blockchain: ${dto.collectionName}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      config.collectionName = dto.collectionName;
      config.collectionId = `${dto.collectionName}_${Date.now()}`;
    }

    if (dto.displayName !== undefined) config.displayName = dto.displayName;
    if (dto.collectionId !== undefined) config.collectionId = dto.collectionId;
    if (dto.isActive !== undefined) config.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) config.sortOrder = dto.sortOrder;
    config.updatedAt = new Date();

    return this.storeConfigRepo.save(config);
  }

  /**
   * Get all store configurations
   */
  async getAllStoreConfigs(): Promise<StoreConfig[]> {
    return this.storeConfigRepo.find({
      order: { sortOrder: 'ASC' },
    });
  }

  /**
   * Get store configuration for a specific tab
   */
  async getStoreConfig(tabName: string): Promise<StoreConfig> {
    const config = await this.storeConfigRepo.findOne({
      where: { tabName },
    });

    if (!config) {
      throw new HttpException(
        {
          success: false,
          message: `Store config not found for tab: ${tabName}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return config;
  }

  /**
   * Delete store configuration
   */
  async deleteStoreConfig(tabName: string): Promise<void> {
    const result = await this.storeConfigRepo.delete({ tabName });

    if (result.affected === 0) {
      throw new HttpException(
        {
          success: false,
          message: `Store config not found for tab: ${tabName}`,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * Create NFT collection with uploaded file - Returns unsigned transaction
   */
  async createCollectionWithFile(
    dto: CreateCollectionDto,
    imageFile: Express.Multer.File,
  ): Promise<any> {
    try {
      // Validate admin public key if provided
      if (dto.adminPublicKey) {
        try {
          new PublicKey(dto.adminPublicKey);
        } catch (error) {
          throw new HttpException(
            {
              success: false,
              message: 'Invalid admin public key',
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (!imageFile) {
        throw new HttpException(
          {
            success: false,
            message: 'Image file is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Upload image to IPFS with collection name
      const imageFilename = `${dto.name}_collection_image`;
      const imageUri = await this.uploadFileToIPFS(
        imageFile.buffer,
        imageFile.originalname,
        imageFilename,
      );

      // Create metadata JSON
      const metadata = {
        name: dto.name,
        symbol: dto.symbol,
        description: dto.description,
        image: imageUri,
        external_url: 'https://vybe.game',
        attributes: [],
        properties: {
          category: 'image',
          files: [
            {
              uri: imageUri,
              type: imageFile.mimetype,
            },
          ],
        },
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      console.log('✅ Metadata uploaded to IPFS:', metadataUri);

      return {
        success: true,
        data: {
          metadata,
          metadataUri,
          imageUri,
          message:
            'Metadata uploaded to IPFS successfully! Now create a new Keypair for collection mint and call /nft-admin/collection/create-transaction endpoint with the mint public key.',
        },
      };
    } catch (error) {
      console.error('Error creating collection metadata:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create collection metadata',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create NFT type with uploaded files (DEPRECATED - use prepareCreateType instead)
   */
  async createTypeWithFiles(
    dto: CreateTypeDto,
    files: {
      mainImage?: Express.Multer.File[];
      additionalImages?: Express.Multer.File[];
    },
  ): Promise<any> {
    try {
      // Find collection in database
      const collection = await this.nftCollectionRepo.findOne({
        where: { name: dto.collectionName },
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found: ${dto.collectionName}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (!files.mainImage || files.mainImage.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Main image file is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Upload main image to IPFS
      const mainImageFile = files.mainImage[0];
      const mainImageUri = await this.uploadFileToIPFS(
        mainImageFile.buffer,
        mainImageFile.originalname,
      );

      // Upload additional images if provided
      let additionalImageUris: string[] = [];
      if (files.additionalImages && files.additionalImages.length > 0) {
        console.log('Uploading additional images...');
        additionalImageUris = await Promise.all(
          files.additionalImages.map((file) =>
            this.uploadFileToIPFS(file.buffer, file.originalname),
          ),
        );
      }

      // Parse attributes if provided as JSON string
      let attributes = [];
      if (dto.attributes) {
        try {
          attributes =
            typeof dto.attributes === 'string'
              ? JSON.parse(dto.attributes)
              : dto.attributes;
        } catch (e) {
          console.warn('Failed to parse attributes:', e);
        }
      }

      // Create metadata JSON
      const allFiles = [
        {
          uri: mainImageUri,
          type: mainImageFile.mimetype,
        },
        ...additionalImageUris.map((uri, idx) => ({
          uri,
          type: files.additionalImages
            ? files.additionalImages[idx].mimetype
            : 'image/png',
        })),
      ];

      const metadata = {
        name: dto.name,
        symbol: collection.symbol,
        description: dto.description,
        image: mainImageUri,
        external_url: 'https://vybe.game',
        attributes,
        properties: {
          category: 'image',
          files: allFiles,
        },
        additionalImages: additionalImageUris,
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Convert price to lamports (SOL * LAMPORTS_PER_SOL)
      const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
      const stakingLamports = dto.stakingAmount
        ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000)
        : 0;

      // Save to database
      const nftType = this.nftTypeRepo.create({
        id: `${dto.collectionName}_${dto.name}_${Date.now()}`,
        collectionId: collection.id,
        name: dto.name,
        uri: metadataUri,
        price: priceLamports.toString(),
        maxSupply: dto.maxSupply.toString(),
        currentSupply: '0',
        stakingAmount: stakingLamports.toString(),
        mainImage: mainImageUri,
        additionalImages: JSON.stringify(additionalImageUris),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.nftTypeRepo.save(nftType);

      console.log('✅ NFT Type created with file uploads:', nftType);

      return {
        success: true,
        data: {
          nftType,
          metadata,
          metadataUri,
          priceLamports,
          stakingLamports,
          message:
            'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.',
        },
      };
    } catch (error) {
      console.error('Error creating NFT type with files:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create NFT type',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create collection with authentication - full workflow
   */
  async prepareCreateCollection(
    adminPublicKey: string,
    dto: CreateCollectionDto,
    imageFile: Express.Multer.File,
  ): Promise<any> {
    try {
      console.log('Preparing create collection tx:', dto.name);

      if (!adminPublicKey) {
        throw new HttpException(
          {
            success: false,
            message: 'adminPublicKey is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const admin = new PublicKey(adminPublicKey);

      const isInitialized =
        await this.solanaContractService.isMarketplaceInitialized();
      if (!isInitialized) {
        throw new HttpException(
          {
            success: false,
            message:
              'Marketplace is not initialized. Please initialize it first.',
            error: 'MARKETPLACE_NOT_INITIALIZED',
          },
          HttpStatus.PRECONDITION_FAILED,
        );
      }

      // Upload image to IPFS
      const imageFilename = `${dto.name}_collection_image`;
      const imageUri = await this.uploadFileToIPFS(
        imageFile.buffer,
        imageFile.originalname,
        imageFilename,
      );

      // Create metadata JSON
      const metadata = {
        name: dto.name,
        symbol: dto.symbol,
        description: dto.description,
        image: imageUri,
        external_url: 'https://vybe.game',
        attributes: [],
        properties: {
          category: 'image',
          files: [
            {
              uri: imageUri,
              type: this.getMimeType(imageFile.originalname),
            },
          ],
        },
        seller_fee_basis_points: dto.royalty * 100, // Convert percentage to basis points
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      const {
        transaction,
        collectionMintKeypair,
        collectionPda,
        collectionMint,
      } = await this.solanaContractService.prepareCreateCollectionTransaction(
        admin,
        dto.name,
        dto.symbol,
        metadataUri,
        dto.royalty,
      );

      // Persist (or update) the collection record locally so UI can list it immediately
      const now = new Date();
      let dbCollection = await this.nftCollectionRepo.findOne({
        where: { id: collectionMint },
      });

      if (!dbCollection) {
        dbCollection = this.nftCollectionRepo.create({
          id: collectionMint,
          createdAt: now,
        });
      }

      dbCollection.admin = admin.toString();
      dbCollection.name = dto.name;
      dbCollection.symbol = dto.symbol;
      dbCollection.uri = metadataUri;
      dbCollection.royalty = dto.royalty;
      dbCollection.isActive = true;
      dbCollection.updatedAt = now;

      await this.nftCollectionRepo.save(dbCollection);

      // Sign with mint keypair before returning to client
      transaction.partialSign(collectionMintKeypair);

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        data: {
          transaction: serialized.toString('base64'),
          collectionPda,
          collectionMint,
          metadataUri,
          imageUri,
          collectionRecord: dbCollection,
          requiredSigners: [admin.toString()],
          message:
            'Transaction prepared. Please sign and send using your wallet.',
        },
      };
    } catch (error) {
      console.error('Error preparing createCollection:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare collection transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Initialize marketplace with JWT authentication
   */
  async prepareInitializeMarketplace(
    adminPublicKey: string,
    feeBps: number = 500,
  ): Promise<any> {
    try {
      console.log('Preparing initialize marketplace tx, fee:', feeBps, 'bps');

      if (!adminPublicKey) {
        throw new HttpException(
          {
            success: false,
            message: 'adminPublicKey is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const admin = new PublicKey(adminPublicKey);

      // Ensure marketplace not already initialized
      const isInitialized =
        await this.solanaContractService.isMarketplaceInitialized();
      if (isInitialized) {
        throw new HttpException(
          {
            success: false,
            message: 'Marketplace is already initialized',
          },
          HttpStatus.CONFLICT,
        );
      }

      const { transaction, marketplacePda } =
        await this.solanaContractService.prepareInitializeMarketplaceTransaction(
          admin,
          feeBps,
        );

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        data: {
            transaction: serialized.toString('base64'),
            marketplacePda,
            feeBps,
            requiredSigners: [admin.toString()],
            message:
              'Transaction prepared. Please sign and send using your wallet.',
        },
      };
    } catch (error) {
      console.error('Error preparing initializeMarketplace:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare initialize marketplace transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Check marketplace initialization status
   */
  async checkMarketplaceStatus(): Promise<any> {
    try {
      const isInitialized =
        await this.solanaContractService.isMarketplaceInitialized();
      const marketplacePda = this.solanaContractService.getMarketplacePda();

      return {
        success: true,
        data: {
          isInitialized,
          marketplacePda: marketplacePda.toString(),
          message: isInitialized
            ? 'Marketplace is initialized and ready!'
            : 'Marketplace is not initialized. Please initialize it first.',
        },
      };
    } catch (error) {
      console.error('Error checking marketplace status:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to check marketplace status',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create NFT type with authentication - full workflow
   */
  async prepareCreateType(
    adminPublicKey: string,
    dto: CreateTypeDto,
    files: {
      mainImage?: Express.Multer.File[];
      additionalImages?: Express.Multer.File[];
    },
  ): Promise<any> {
    try {
      console.log('Preparing NFT type tx:', dto.name);

      if (!adminPublicKey) {
        throw new HttpException(
          {
            success: false,
            message: 'adminPublicKey is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const admin = new PublicKey(adminPublicKey);

      console.log('Admin:', admin.toString());
      console.log('Collection:', dto.collectionName);
      console.log('Type:', dto.name);

      // Find collection in database
      const collection = await this.nftCollectionRepo.findOne({
        where: { name: dto.collectionName },
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found: ${dto.collectionName}`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      if (!files.mainImage || files.mainImage.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Main image file is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Upload main image to IPFS
      const mainImageFile = files.mainImage[0];
      const imageFilename = `${dto.collectionName}_${dto.name}_main`;
      const mainImageUri = await this.uploadFileToIPFS(
        mainImageFile.buffer,
        mainImageFile.originalname,
        imageFilename,
      );

      // Upload additional images if provided
      let additionalImageUris: string[] = [];
      if (files.additionalImages && files.additionalImages.length > 0) {
        console.log('Uploading additional images...');
        additionalImageUris = await Promise.all(
          files.additionalImages.map((file, idx) => {
            const additionalFilename = `${dto.collectionName}_${dto.name}_additional_${idx}`;
            return this.uploadFileToIPFS(
              file.buffer,
              file.originalname,
              additionalFilename,
            );
          }),
        );
      }

      // Parse attributes if provided as JSON string
      let attributes = [];
      if (dto.attributes) {
        try {
          attributes =
            typeof dto.attributes === 'string'
              ? JSON.parse(dto.attributes)
              : dto.attributes;
        } catch (e) {
          console.warn('Failed to parse attributes:', e);
        }
      }

      // Create metadata JSON
      const allFiles = [
        {
          uri: mainImageUri,
          type: mainImageFile.mimetype,
        },
        ...additionalImageUris.map((uri, idx) => ({
          uri,
          type: files.additionalImages
            ? files.additionalImages[idx].mimetype
            : 'image/png',
        })),
      ];

      const metadata = {
        name: dto.name,
        symbol: collection.symbol,
        description: dto.description,
        image: mainImageUri,
        external_url: 'https://vybe.game',
        attributes,
        properties: {
          category: 'image',
          files: allFiles,
        },
        additionalImages: additionalImageUris,
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Convert price to lamports
      const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
      const stakingLamports = dto.stakingAmount
        ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000)
        : 0;

      console.log('Creating NFT type on-chain:', {
        collection: dto.collectionName,
        type: dto.name,
        uri: metadataUri,
        price: priceLamports,
        maxSupply: dto.maxSupply,
        stakingAmount: stakingLamports,
      });

      const { transaction, nftTypePda } =
        await this.solanaContractService.prepareCreateNftTypeTransaction(
          admin,
          dto.collectionName,
          dto.name,
          metadataUri,
          priceLamports,
          Number(dto.maxSupply),
          stakingLamports,
        );

      const nftType = this.nftTypeRepo.create({
        id: nftTypePda,
        collectionId: collection.id,
        name: dto.name,
        uri: metadataUri,
        price: priceLamports.toString(),
        maxSupply: dto.maxSupply.toString(),
        currentSupply: '0',
        stakingAmount: stakingLamports.toString(),
        mainImage: mainImageUri,
        additionalImages: JSON.stringify(additionalImageUris),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.nftTypeRepo.save(nftType);

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        data: {
          transaction: serialized.toString('base64'),
          nftTypePda,
          nftType,
          metadata,
          metadataUri,
          mainImageUri,
          additionalImageUris,
          priceLamports,
          stakingLamports,
          requiredSigners: [admin.toString()],
          message:
            'Transaction prepared. Please sign and send using your wallet.',
        },
      };
    } catch (error) {
      console.error('Error preparing createType:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare NFT type transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepare mint NFT transaction (requires both admin and buyer signatures)
   */
  async prepareMintNft(
    collectionAdminPublicKey: string,
    collectionName: string,
    typeName: string,
    collectionMintAddress: string,
    buyerPublicKey: string,
  ): Promise<any> {
    try {
      console.log('Preparing mint NFT transaction:', {
        collectionName,
        typeName,
        buyerPublicKey,
      });

      if (!collectionAdminPublicKey) {
        throw new HttpException(
          {
            success: false,
            message: 'collectionAdminPublicKey is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!buyerPublicKey) {
        throw new HttpException(
          {
            success: false,
            message: 'buyerPublicKey is required',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const collectionAdmin = new PublicKey(collectionAdminPublicKey);
      const buyer = new PublicKey(buyerPublicKey);

      const {
        transaction,
        nftMintKeypair,
        nftMint,
        buyerTokenAccount,
      } = await this.solanaContractService.prepareMintNftTransaction(
        collectionAdmin,
        buyer,
        collectionName,
        typeName,
        collectionMintAddress,
      );

      // Sign with mint keypair before returning to client
      transaction.partialSign(nftMintKeypair);

      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });

      return {
        success: true,
        data: {
          transaction: serialized.toString('base64'),
          nftMint,
          buyerTokenAccount,
          requiredSigners: [collectionAdmin.toString(), buyer.toString()],
          message:
            'Transaction prepared. Please have all required wallets sign and send.',
        },
      };
    } catch (error) {
      console.error('Error preparing mint NFT transaction:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to prepare mint NFT transaction',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete collection from database
   * NOTE: This does NOT delete from blockchain (blockchain is immutable)
   * Only removes from local database sync
   */
  async deleteCollectionFromDatabase(collectionName: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting collection from database: ${collectionName}`);

      const collection = await this.nftCollectionRepo.findOne({
        where: { name: collectionName },
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection '${collectionName}' not found in database`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete associated NFT types first
      await this.nftTypeRepo.delete({ collectionId: collection.id });
      console.log(`  ✓ Deleted associated NFT types`);

      // Delete the collection
      await this.nftCollectionRepo.delete({ id: collection.id });
      console.log(`  ✓ Deleted collection from database`);

      console.log(
        `✅ Collection '${collectionName}' removed from database (still exists on blockchain)`,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error deleting collection from database:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete collection from database',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete NFT type from database
   * NOTE: This does NOT delete from blockchain (blockchain is immutable)
   * Only removes from local database sync
   */
  async deleteTypeFromDatabase(typeId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting NFT type from database: ${typeId}`);

      const type = await this.nftTypeRepo.findOne({
        where: { id: typeId },
      });

      if (!type) {
        throw new HttpException(
          {
            success: false,
            message: `NFT type with ID '${typeId}' not found in database`,
          },
          HttpStatus.NOT_FOUND,
        );
      }

      // Delete the type
      await this.nftTypeRepo.delete({ id: typeId });
      console.log(`  ✓ Deleted NFT type from database`);

      console.log(
        `✅ NFT type '${type.name}' removed from database (still exists on blockchain)`,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Error deleting NFT type from database:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete NFT type from database',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
