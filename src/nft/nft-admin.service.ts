import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { NftCollection } from '../entities/nft-collection.entity';
import { NftType } from '../entities/nft-type.entity';
import { StoreConfig } from '../entities/store-config.entity';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { CreateTypeDto } from './dto/create-type.dto';
import { CreateStoreConfigDto, UpdateStoreConfigDto } from './dto/store-config.dto';
import { SolanaContractService } from './solana-contract.service';
import { NftService } from './nft.service';
import { AuthService } from '../auth/auth.service';
import axios from 'axios';

const PROGRAM_ID = new PublicKey('Cvz71nzvusTyvH6GzeuHSVKPAGABH2q5tw2HRJdmzvEj');


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
    private authService: AuthService,
  ) {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  /**
   * Upload JSON metadata to IPFS via QuickNode S3 API
   * Documentation: https://www.quicknode.com/docs/ipfs
   */
  async uploadToIPFS(metadata: any): Promise<string> {
    try {
      console.log('Uploading metadata to QuickNode IPFS:', JSON.stringify(metadata, null, 2));

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
        filename: fileName
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
            ...form.getHeaders()
          }
        }
      );

      const result = response.data;

      // Extract CID from response
      const cid = this.extractCIDFromResponse(result);

      // Use custom QuickNode gateway URL from environment variable
      const gatewayBaseUrl = process.env.QUICKNODE_IPFS_GATEWAY_URL || 'https://husband-toy-slight.quicknode-ipfs.com/ipfs';
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
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Upload file buffer to IPFS via QuickNode S3 API
   * Documentation: https://www.quicknode.com/docs/ipfs
   */
  async uploadFileToIPFS(fileBuffer: Buffer, filename: string, customName?: string): Promise<string> {
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
        contentType: contentType
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
            ...form.getHeaders()
          }
        }
      );

      const result = response.data;

      // Extract CID from response
      const cid = this.extractCIDFromResponse(result);

      // Use custom QuickNode gateway URL from environment variable
      const gatewayBaseUrl = process.env.QUICKNODE_IPFS_GATEWAY_URL || 'https://husband-toy-slight.quicknode-ipfs.com/ipfs';
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
          error: errorMessage
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Extract CID from QuickNode IPFS response
   * QuickNode S3 API may return CID in different fields
   */
  private extractCIDFromResponse(result: any): string {
    console.log('QuickNode IPFS response (full):', JSON.stringify(result, null, 2));

    // QuickNode S3 put-object returns the CID in different fields
    // Common fields: pin.cid, cid, ipfsHash, IpfsHash, hash
    let cid = result.pin?.cid || result.cid || result.ipfsHash || result.IpfsHash || result.hash;

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
      throw new Error('Failed to get CID from IPFS upload response. Check QuickNode API response format.');
    }

    return cid;
  }

  /**
   * Get MIME type based on file extension
   */
  private getMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'json': 'application/json',
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
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
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
              message: 'Invalid admin public key'
            },
            HttpStatus.BAD_REQUEST
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
              type: 'image/png'
            }
          ]
        }
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
        updatedAt: new Date()
      });

      await this.nftCollectionRepo.save(collection);

      console.log('✅ Collection created in database:', collection);

      return {
        success: true,
        data: {
          collection,
          metadata,
          metadataUri,
          message: 'Collection created successfully. Please create the collection on-chain using the provided metadata URI.'
        }
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
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create NFT type with IPFS metadata (DEPRECATED - use createTypeWithAuth instead)
   */
  async createType(dto: CreateTypeDto): Promise<any> {
    try {
      // Find collection in database
      const collection = await this.nftCollectionRepo.findOne({
        where: { name: dto.collectionName }
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found: ${dto.collectionName}`
          },
          HttpStatus.NOT_FOUND
        );
      }

      // Upload main image to IPFS
      const mainImageUri = await this.uploadImageToIPFS(dto.image);

      // Upload additional images if provided
      let additionalImageUris: string[] = [];
      if (dto.additionalImages && dto.additionalImages.length > 0) {
        console.log('Uploading additional images...');
        additionalImageUris = await Promise.all(
          dto.additionalImages.map(img => this.uploadImageToIPFS(img))
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
              type: 'image/png'
            },
            ...additionalImageUris.map(uri => ({
              uri,
              type: 'image/png'
            }))
          ]
        },
        additionalImages: additionalImageUris
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Convert price to lamports (SOL * LAMPORTS_PER_SOL)
      const priceLamports = Math.floor(dto.price * 1_000_000_000);
      const stakingLamports = dto.stakingAmount ? Math.floor(dto.stakingAmount * 1_000_000_000) : 0;

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
        updatedAt: new Date()
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
          message: 'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.'
        }
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
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all collections from database
   */
  async getAllCollections(): Promise<NftCollection[]> {
    return this.nftCollectionRepo.find({
      relations: ['nftTypes'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Get all types for a collection
   */
  async getTypesByCollection(collectionName: string): Promise<NftType[]> {
    const collection = await this.nftCollectionRepo.findOne({
      where: { name: collectionName }
    });

    if (!collection) {
      throw new HttpException(
        {
          success: false,
          message: `Collection not found: ${collectionName}`
        },
        HttpStatus.NOT_FOUND
      );
    }

    return this.nftTypeRepo.find({
      where: { collectionId: collection.id },
      order: { createdAt: 'DESC' }
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
      const blockchainCollections = await this.solanaContractService.syncCollectionsFromBlockchain();
      
      let created = 0;
      let updated = 0;
      const syncedCollections: any[] = [];

      for (const bcCollection of blockchainCollections) {
        // Check if collection exists in DB
        let dbCollection = await this.nftCollectionRepo.findOne({
          where: { name: bcCollection.name }
        });

        if (dbCollection) {
          // Update existing collection
          dbCollection.symbol = bcCollection.symbol;
          dbCollection.uri = bcCollection.uri;
          dbCollection.royalty = bcCollection.royalty;
          dbCollection.admin = bcCollection.admin;
          dbCollection.isActive = bcCollection.isActive;
          dbCollection.updatedAt = new Date();
          
          await this.nftCollectionRepo.save(dbCollection);
          updated++;
          
          console.log(`✅ Updated collection: ${bcCollection.name}`);
        } else {
          // Create new collection
          dbCollection = this.nftCollectionRepo.create({
            id: `${bcCollection.name}_${Date.now()}`,
            name: bcCollection.name,
            symbol: bcCollection.symbol,
            uri: bcCollection.uri,
            royalty: bcCollection.royalty,
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
        HttpStatus.INTERNAL_SERVER_ERROR
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
      
      // Fetch types from blockchain
      const blockchainTypes = await this.solanaContractService.syncTypesFromBlockchain();
      
      let created = 0;
      let updated = 0;
      let skipped = 0;
      const syncedTypes: any[] = [];

      for (const bcType of blockchainTypes) {
        console.log(`\n🔍 Processing type: ${bcType.name}, collection PDA: ${bcType.collection}`);
        
        // Find the collection in DB - we need to get all collections and match by PDA
        const allCollections = await this.nftCollectionRepo.find();
        
        // Get collection PDA from blockchain data
        const collectionPDA = bcType.collection;
        
        // Try to find matching collection by checking blockchain collection names
        // Since we just synced, we can fetch collection data from blockchain
        let collection: NftCollection | null = null;
        
        try {
          // Fetch the collection account from blockchain to get its name
          const collectionAccountData: any = await this.solanaContractService.syncCollectionsFromBlockchain();
          const matchingBcCollection = collectionAccountData.find((c: any) => c.pubkey === collectionPDA);
          
          console.log(`  Matching blockchain collection:`, matchingBcCollection ? matchingBcCollection.name : 'NOT FOUND');
          
          if (matchingBcCollection) {
            collection = await this.nftCollectionRepo.findOne({
              where: { name: matchingBcCollection.name }
            });
            console.log(`  DB collection found:`, collection ? collection.name : 'NOT FOUND');
          }
        } catch (err) {
          console.error(`  ❌ Error fetching collection for type ${bcType.name}:`, err.message);
        }

        if (!collection) {
          console.warn(`  ⚠️ Collection not found for type: ${bcType.name} (collection PDA: ${bcType.collection})`);
          skipped++;
          continue;
        }

        // Check if type exists in DB by name and collection
        let dbType = await this.nftTypeRepo.findOne({
          where: { 
            name: bcType.name,
            collectionId: collection.id
          }
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
              mainImage: metadata.image || metadata.properties?.files?.[0]?.uri || '',
              additionalImages: JSON.stringify(metadata.additionalImages || []),
            });
            
            await this.nftTypeRepo.save(dbType);
            created++;
            
            console.log(`✅ Created NFT type: ${bcType.name}`);
          } catch (fetchError) {
            console.error(`❌ Failed to fetch metadata for ${bcType.name}:`, fetchError.message);
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

      console.log(`✅ Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

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
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get all NFT types from all collections
   */
  async getAllTypes(): Promise<NftType[]> {
    return this.nftTypeRepo.find({
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Create or update store configuration for a tab
   */
  async setStoreConfig(dto: CreateStoreConfigDto): Promise<StoreConfig> {
    // Check if collection exists
    const collection = await this.nftCollectionRepo.findOne({
      where: { name: dto.collectionName }
    });

    if (!collection) {
      throw new HttpException(
        {
          success: false,
          message: `Collection not found: ${dto.collectionName}`
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Check if config already exists for this tab
    let config = await this.storeConfigRepo.findOne({
      where: { tabName: dto.tabName }
    });

    if (config) {
      // Update existing config
      config.collectionName = dto.collectionName;
      config.displayName = dto.displayName;
      config.collectionId = dto.collectionId || collection.id;
      config.sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : config.sortOrder;
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
        updatedAt: new Date()
      });
    }

    return this.storeConfigRepo.save(config);
  }

  /**
   * Update store configuration
   */
  async updateStoreConfig(tabName: string, dto: UpdateStoreConfigDto): Promise<StoreConfig> {
    const config = await this.storeConfigRepo.findOne({
      where: { tabName }
    });

    if (!config) {
      throw new HttpException(
        {
          success: false,
          message: `Store config not found for tab: ${tabName}`
        },
        HttpStatus.NOT_FOUND
      );
    }

    // Validate collection if provided (check blockchain)
    if (dto.collectionName) {
      const { collections } = await this.nftService.fetchCollections();
      const collection = collections.find(c => c.name === dto.collectionName);

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found on blockchain: ${dto.collectionName}`
          },
          HttpStatus.NOT_FOUND
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
      order: { sortOrder: 'ASC' }
    });
  }

  /**
   * Get store configuration for a specific tab
   */
  async getStoreConfig(tabName: string): Promise<StoreConfig> {
    const config = await this.storeConfigRepo.findOne({
      where: { tabName }
    });

    if (!config) {
      throw new HttpException(
        {
          success: false,
          message: `Store config not found for tab: ${tabName}`
        },
        HttpStatus.NOT_FOUND
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
          message: `Store config not found for tab: ${tabName}`
        },
        HttpStatus.NOT_FOUND
      );
    }
  }

  /**
   * Create NFT collection with uploaded file - Returns unsigned transaction
   */
  async createCollectionWithFile(
    dto: CreateCollectionDto,
    imageFile: Express.Multer.File
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
              message: 'Invalid admin public key'
            },
            HttpStatus.BAD_REQUEST
          );
        }
      }

      if (!imageFile) {
        throw new HttpException(
          {
            success: false,
            message: 'Image file is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Upload image to IPFS with collection name
      const imageFilename = `${dto.name}_collection_image`;
      const imageUri = await this.uploadFileToIPFS(imageFile.buffer, imageFile.originalname, imageFilename);

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
              type: imageFile.mimetype
            }
          ]
        }
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
          message: 'Metadata uploaded to IPFS successfully! Now create a new Keypair for collection mint and call /nft-admin/collection/create-transaction endpoint with the mint public key.'
        }
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
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create NFT type with uploaded files (DEPRECATED - use createTypeWithAuth instead)
   */
  async createTypeWithFiles(
    dto: CreateTypeDto,
    files: { mainImage?: Express.Multer.File[], additionalImages?: Express.Multer.File[] }
  ): Promise<any> {
    try {
      // Find collection in database
      const collection = await this.nftCollectionRepo.findOne({
        where: { name: dto.collectionName }
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found: ${dto.collectionName}`
          },
          HttpStatus.NOT_FOUND
        );
      }

      if (!files.mainImage || files.mainImage.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Main image file is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Upload main image to IPFS
      const mainImageFile = files.mainImage[0];
      const mainImageUri = await this.uploadFileToIPFS(mainImageFile.buffer, mainImageFile.originalname);

      // Upload additional images if provided
      let additionalImageUris: string[] = [];
      if (files.additionalImages && files.additionalImages.length > 0) {
        console.log('Uploading additional images...');
        additionalImageUris = await Promise.all(
          files.additionalImages.map(file =>
            this.uploadFileToIPFS(file.buffer, file.originalname)
          )
        );
      }

      // Parse attributes if provided as JSON string
      let attributes = [];
      if (dto.attributes) {
        try {
          attributes = typeof dto.attributes === 'string'
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
          type: mainImageFile.mimetype
        },
        ...additionalImageUris.map((uri, idx) => ({
          uri,
          type: files.additionalImages ? files.additionalImages[idx].mimetype : 'image/png'
        }))
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
          files: allFiles
        },
        additionalImages: additionalImageUris
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Convert price to lamports (SOL * LAMPORTS_PER_SOL)
      const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
      const stakingLamports = dto.stakingAmount ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000) : 0;

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
        updatedAt: new Date()
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
          message: 'NFT Type created successfully. Please create the type on-chain using the provided metadata URI.'
        }
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
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create collection with authentication - full workflow
   */
  async createCollectionWithAuth(
    encryptedPrivateKey: string,
    dto: CreateCollectionDto,
    imageFile: Express.Multer.File
  ): Promise<any> {
    try {
      console.log('Creating collection with auth:', dto.name);

      // Check if marketplace is initialized
      const isInitialized = await this.solanaContractService.isMarketplaceInitialized();
      if (!isInitialized) {
        throw new HttpException(
          {
            success: false,
            message: 'Marketplace is not initialized. Please initialize the marketplace first using POST /nft-admin/initialize-marketplace endpoint.',
            error: 'MARKETPLACE_NOT_INITIALIZED'
          },
          HttpStatus.PRECONDITION_FAILED
        );
      }

      // Get admin keypair from encrypted private key
      const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);

      // Generate collection mint keypair
      const collectionMintKeypair = Keypair.generate();

      console.log('Admin:', adminKeypair.publicKey.toString());
      console.log('Collection Mint:', collectionMintKeypair.publicKey.toString());

      // Upload image to IPFS
      const imageFilename = `${dto.name}_collection_image`;
      const imageUri = await this.uploadFileToIPFS(imageFile.buffer, imageFile.originalname, imageFilename);

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
              type: this.getMimeType(imageFile.originalname)
            }
          ]
        },
        seller_fee_basis_points: dto.royalty * 100, // Convert percentage to basis points
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Create collection on-chain
      const result = await this.solanaContractService.createAndSubmitCollection(
        adminKeypair,
        collectionMintKeypair,
        dto.name,
        dto.symbol,
        metadataUri,
        dto.royalty
      );

      const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;

      console.log('✅ Collection created successfully!');
      console.log('   Signature:', result.signature);
      console.log('   Explorer:', explorerUrl);

      return {
        success: true,
        data: {
          signature: result.signature,
          collectionPda: result.collectionPda,
          collectionMint: result.collectionMint,
          metadataUri,
          imageUri,
          explorerUrl,
          message: 'Collection created successfully on Solana!'
        }
      };
    } catch (error) {
      console.error('Error in createCollectionWithAuth:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create collection',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Initialize marketplace with JWT authentication
   */
  async initializeMarketplaceWithAuth(
    encryptedPrivateKey: string,
    feeBps: number = 500
  ): Promise<any> {
    try {
      console.log('Initializing marketplace with auth, fee:', feeBps, 'bps');

      // Check if already initialized
      const isInitialized = await this.solanaContractService.isMarketplaceInitialized();
      if (isInitialized) {
        throw new HttpException(
          {
            success: false,
            message: 'Marketplace is already initialized'
          },
          HttpStatus.CONFLICT
        );
      }

      // Get admin keypair from encrypted private key
      const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);

      console.log('Admin:', adminKeypair.publicKey.toString());

      // Initialize marketplace on-chain
      const result = await this.solanaContractService.initializeMarketplace(
        adminKeypair,
        feeBps
      );

      const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;

      console.log('✅ Marketplace initialized successfully!');
      console.log('   Signature:', result.signature);
      console.log('   Marketplace PDA:', result.marketplacePda);
      console.log('   Explorer:', explorerUrl);

      return {
        success: true,
        data: {
          signature: result.signature,
          marketplacePda: result.marketplacePda,
          feeBps,
          explorerUrl,
          message: 'Marketplace initialized successfully! You can now create collections.'
        }
      };
    } catch (error) {
      console.error('Error in initializeMarketplaceWithAuth:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to initialize marketplace',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Check marketplace initialization status
   */
  async checkMarketplaceStatus(): Promise<any> {
    try {
      const isInitialized = await this.solanaContractService.isMarketplaceInitialized();
      const marketplacePda = this.solanaContractService.getMarketplacePda();

      return {
        success: true,
        data: {
          isInitialized,
          marketplacePda: marketplacePda.toString(),
          message: isInitialized
            ? 'Marketplace is initialized and ready!'
            : 'Marketplace is not initialized. Please initialize it first.'
        }
      };
    } catch (error) {
      console.error('Error checking marketplace status:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to check marketplace status',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create NFT type with authentication - full workflow
   */
  async createTypeWithAuth(
    encryptedPrivateKey: string,
    dto: CreateTypeDto,
    files: { mainImage?: Express.Multer.File[], additionalImages?: Express.Multer.File[] }
  ): Promise<any> {
    try {
      console.log('Creating NFT type with auth:', dto.name);

      // Get admin keypair from encrypted private key
      const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);

      console.log('Admin:', adminKeypair.publicKey.toString());
      console.log('Collection:', dto.collectionName);
      console.log('Type:', dto.name);

      // Find collection in database
      const collection = await this.nftCollectionRepo.findOne({
        where: { name: dto.collectionName }
      });

      if (!collection) {
        throw new HttpException(
          {
            success: false,
            message: `Collection not found: ${dto.collectionName}`
          },
          HttpStatus.NOT_FOUND
        );
      }

      if (!files.mainImage || files.mainImage.length === 0) {
        throw new HttpException(
          {
            success: false,
            message: 'Main image file is required'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Upload main image to IPFS
      const mainImageFile = files.mainImage[0];
      const imageFilename = `${dto.collectionName}_${dto.name}_main`;
      const mainImageUri = await this.uploadFileToIPFS(mainImageFile.buffer, mainImageFile.originalname, imageFilename);

      // Upload additional images if provided
      let additionalImageUris: string[] = [];
      if (files.additionalImages && files.additionalImages.length > 0) {
        console.log('Uploading additional images...');
        additionalImageUris = await Promise.all(
          files.additionalImages.map((file, idx) => {
            const additionalFilename = `${dto.collectionName}_${dto.name}_additional_${idx}`;
            return this.uploadFileToIPFS(file.buffer, file.originalname, additionalFilename);
          })
        );
      }

      // Parse attributes if provided as JSON string
      let attributes = [];
      if (dto.attributes) {
        try {
          attributes = typeof dto.attributes === 'string'
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
          type: mainImageFile.mimetype
        },
        ...additionalImageUris.map((uri, idx) => ({
          uri,
          type: files.additionalImages ? files.additionalImages[idx].mimetype : 'image/png'
        }))
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
          files: allFiles
        },
        additionalImages: additionalImageUris
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(metadata);

      // Convert price to lamports
      const priceLamports = Math.floor(Number(dto.price) * 1_000_000_000);
      const stakingLamports = dto.stakingAmount ? Math.floor(Number(dto.stakingAmount) * 1_000_000_000) : 0;

      console.log('Creating NFT type on-chain:', {
        collection: dto.collectionName,
        type: dto.name,
        uri: metadataUri,
        price: priceLamports,
        maxSupply: dto.maxSupply,
        stakingAmount: stakingLamports
      });

      // Create NFT type on-chain
      const result = await this.solanaContractService.createAndSubmitNftType(
        adminKeypair,
        dto.collectionName,
        dto.name,
        metadataUri,
        priceLamports,
        Number(dto.maxSupply),
        stakingLamports
      );

      // Save to database
      const nftType = this.nftTypeRepo.create({
        id: result.nftTypePda,
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
        updatedAt: new Date()
      });

      await this.nftTypeRepo.save(nftType);

      const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;

      console.log('✅ NFT type created successfully!');
      console.log('   Signature:', result.signature);
      console.log('   Explorer:', explorerUrl);

      return {
        success: true,
        data: {
          signature: result.signature,
          nftTypePda: result.nftTypePda,
          nftType,
          metadata,
          metadataUri,
          mainImageUri,
          additionalImageUris,
          priceLamports,
          stakingLamports,
          explorerUrl,
          message: 'NFT type created successfully on Solana!'
        }
      };
    } catch (error) {
      console.error('Error in createTypeWithAuth:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to create NFT type',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Mint NFT with authentication
   * Note: The mint instruction requires BOTH collection_admin and buyer signatures
   * Since we only have admin's private key from JWT, the buyer must also be the admin for this to work
   * OR we need to implement a two-step process where buyer signs on frontend
   */
  async mintNftWithAuth(
    encryptedPrivateKey: string,
    collectionName: string,
    typeName: string,
    collectionMintAddress: string,
    buyerPublicKey: string
  ): Promise<any> {
    try {
      console.log('Minting NFT with auth:', { collectionName, typeName, buyerPublicKey });

      // Get admin keypair from encrypted private key
      const adminKeypair = this.authService.getKeypairFromToken(encryptedPrivateKey);

      console.log('Admin:', adminKeypair.publicKey.toString());
      console.log('Buyer:', buyerPublicKey);

      // Validate buyer public key
      let buyerPubkey: PublicKey;
      try {
        buyerPubkey = new PublicKey(buyerPublicKey);
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid buyer public key'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Important: The smart contract requires BOTH collection_admin and buyer to sign
      // For this endpoint to work, buyer and admin must be the same person
      // Otherwise, we need a different flow (e.g., create unsigned transaction for buyer to sign)
      if (adminKeypair.publicKey.toString() !== buyerPublicKey) {
        throw new HttpException(
          {
            success: false,
            message: 'Minting requires buyer signature. For now, buyer must be the same as admin. Use the admin wallet as buyer.',
            error: 'BUYER_SIGNATURE_REQUIRED'
          },
          HttpStatus.BAD_REQUEST
        );
      }

      // Mint NFT on-chain
      const result = await this.solanaContractService.mintNftFromCollection(
        adminKeypair,  // collection admin
        adminKeypair,  // buyer (same as admin for now)
        collectionName,
        typeName,
        collectionMintAddress
      );

      const explorerUrl = `https://explorer.solana.com/tx/${result.signature}?cluster=devnet`;

      console.log('✅ NFT minted successfully!');
      console.log('   Signature:', result.signature);
      console.log('   NFT Mint:', result.nftMint);
      console.log('   Explorer:', explorerUrl);

      return {
        success: true,
        data: {
          signature: result.signature,
          nftMint: result.nftMint,
          buyerTokenAccount: result.buyerTokenAccount,
          explorerUrl,
          message: 'NFT minted successfully on Solana!'
        }
      };
    } catch (error) {
      console.error('Error in mintNftWithAuth:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Failed to mint NFT',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
