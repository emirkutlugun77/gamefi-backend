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

const PROGRAM_ID = new PublicKey('Cvz71nzvusTyvH6GzeuHSVKPAGABH2q5tw2HRJdmzvEj');
const QUICKNODE_IPFS_URL = 'https://skilled-aged-lambo.solana-devnet.quiknode.pro/e9123242ac843b701a00c0975743cf7f13953692';

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
  ) {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  }

  /**
   * Upload JSON metadata to IPFS via QuickNode
   */
  async uploadToIPFS(metadata: any): Promise<string> {
    try {
      console.log('Uploading to QuickNode IPFS:', JSON.stringify(metadata, null, 2));

      const response = await fetch(`${QUICKNODE_IPFS_URL}/ipfs/api/v0/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'metadata.json',
          content: JSON.stringify(metadata)
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('IPFS upload failed:', errorText);
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const ipfsHash = result.Hash;
      const ipfsUri = `ipfs://${ipfsHash}`;

      console.log('✅ Uploaded to IPFS:', ipfsUri);
      return ipfsUri;
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload metadata to IPFS',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Upload file buffer to IPFS
   */
  async uploadFileToIPFS(fileBuffer: Buffer, filename: string): Promise<string> {
    try {
      console.log('Uploading file to IPFS:', filename);

      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', fileBuffer, filename);

      const response = await fetch(`${QUICKNODE_IPFS_URL}/ipfs/api/v0/add`, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('IPFS file upload failed:', errorText);
        throw new Error(`File upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      const ipfsUri = `ipfs://${result.Hash}`;

      console.log('✅ File uploaded to IPFS:', ipfsUri);
      return ipfsUri;
    } catch (error) {
      console.error('Error uploading file to IPFS:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload file to IPFS',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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
      // Validate admin public key
      let adminPubkey: PublicKey;
      try {
        adminPubkey = new PublicKey(dto.adminPublicKey);
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid admin public key'
          },
          HttpStatus.BAD_REQUEST
        );
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
        admin: dto.adminPublicKey,
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
   * Create NFT type with IPFS metadata
   */
  async createType(dto: CreateTypeDto): Promise<any> {
    try {
      // Validate admin public key
      let adminPubkey: PublicKey;
      try {
        adminPubkey = new PublicKey(dto.adminPublicKey);
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid admin public key'
          },
          HttpStatus.BAD_REQUEST
        );
      }

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

    // Validate collection if provided
    if (dto.collectionName) {
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

      config.collectionName = dto.collectionName;
      config.collectionId = collection.id;
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
   * Create NFT collection with uploaded file
   */
  async createCollectionWithFile(dto: CreateCollectionDto, imageFile: Express.Multer.File): Promise<any> {
    try {
      // Validate admin public key
      let adminPubkey: PublicKey;
      try {
        adminPubkey = new PublicKey(dto.adminPublicKey);
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid admin public key'
          },
          HttpStatus.BAD_REQUEST
        );
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

      // Upload image to IPFS
      const imageUri = await this.uploadFileToIPFS(imageFile.buffer, imageFile.originalname);

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

      // Save to database
      const collection = this.nftCollectionRepo.create({
        id: `${dto.name}_${Date.now()}`,
        admin: dto.adminPublicKey,
        name: dto.name,
        symbol: dto.symbol,
        uri: metadataUri,
        royalty: dto.royalty,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await this.nftCollectionRepo.save(collection);

      console.log('✅ Collection created with file upload:', collection);

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
      console.error('Error creating collection with file:', error);

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
   * Create NFT type with uploaded files
   */
  async createTypeWithFiles(
    dto: CreateTypeDto,
    files: { mainImage?: Express.Multer.File[], additionalImages?: Express.Multer.File[] }
  ): Promise<any> {
    try {
      // Validate admin public key
      let adminPubkey: PublicKey;
      try {
        adminPubkey = new PublicKey(dto.adminPublicKey);
      } catch (error) {
        throw new HttpException(
          {
            success: false,
            message: 'Invalid admin public key'
          },
          HttpStatus.BAD_REQUEST
        );
      }

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
}
