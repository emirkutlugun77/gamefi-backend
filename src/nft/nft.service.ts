import { Injectable } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { dasApi } from '@metaplex-foundation/digital-asset-standard-api';
import { publicKey as umiPublicKey } from '@metaplex-foundation/umi';

// Constants from the marketplace website
const PROGRAM_ID = new PublicKey('ptcbSp1UEqYLmod2jgFxGPZnFMqBECcrRyU1fTmnJ5b');
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
);

// Staking program constants (same as marketplace program)
const STAKING_PROGRAM_ID = new PublicKey(
  'ptcbSp1UEqYLmod2jgFxGPZnFMqBECcrRyU1fTmnJ5b',
);
const REWARD_TOKEN_MINT = new PublicKey(
  'GshYgeeG5xmeMJ4crtg1SHGafYXBpnCyPz9VNF8DXxSW',
);

// Target collection filter
const TARGET_COLLECTION_NAME = 'VYBE_SUPERHEROES_w89yuli8p3l';
const TARGET_COLLECTION_MINT = '2xXLJU6hbKwTjvqkDsfv8rwFqSB7hRSqzyAvXDmgJi1r'; // VYBE_SUPERHEROES collection mint

// Account discriminators for parsing
const MARKETPLACE_ACCOUNT_DISCRIMINATOR = [70, 222, 41, 62, 78, 3, 32, 174];
const COLLECTION_ACCOUNT_DISCRIMINATOR = [
  243, 209, 195, 150, 192, 176, 151, 165,
];

export interface Marketplace {
  admin: PublicKey;
  fee_bps: number;
  total_collections: number;
  bump: number;
}

export interface NFTCollection {
  admin: PublicKey;
  name: string;
  symbol: string;
  uri: string;
  royalty: number;
  mint: PublicKey;
  is_active: boolean;
  bump: number;
  pda?: PublicKey;
}

export interface NFTItemType {
  collection: PublicKey;
  name: string;
  uri: string;
  price: number;
  max_supply: number;
  current_supply: number;
  bump: number;
}

export interface MarketplaceData {
  marketplace: Marketplace | null;
  collections: NFTCollection[];
  itemTypesByCollection: Record<string, NFTItemType[]>;
}

@Injectable()
export class NftService {
  private connection: Connection;
  private umi: any;

  // Cache için
  private collectionsCache: {
    collections: NFTCollection[];
    itemTypesByCollection: Record<string, NFTItemType[]>;
  } | null = null;
  private collectionsCacheTime: number = 0;
  private metadataCache: Map<string, any> = new Map();
  private userNFTsCache: Map<string, { data: any[]; timestamp: number }> =
    new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika cache
  private readonly METADATA_CACHE_DURATION = 30 * 60 * 1000; // 30 dakika metadata cache
  private readonly USER_NFTS_CACHE_DURATION = 2 * 60 * 1000; // 2 dakika user NFTs cache

  constructor() {
    this.connection = new Connection(
      'https://api.devnet.solana.com',
      'confirmed',
    );
    this.umi = createUmi('https://api.devnet.solana.com').use(dasApi());
  }

  private async fetchMetadataWithCache(uri: string): Promise<any> {
    const cacheKey = uri;
    const cachedData = this.metadataCache.get(cacheKey);

    if (
      cachedData &&
      Date.now() - cachedData.timestamp < this.METADATA_CACHE_DURATION
    ) {
      return cachedData.data;
    }

    try {
      // Convert IPFS URI to HTTP gateway URL if needed
      let fetchUri = uri;
      if (uri.startsWith('ipfs://')) {
        fetchUri = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
      }

      const res = await fetch(fetchUri);
      if (res.ok) {
        const metadata = await res.json();
        // Cache'e kaydet
        this.metadataCache.set(cacheKey, {
          data: metadata,
          timestamp: Date.now(),
        });
        return metadata;
      }
    } catch (e) {
      console.warn('Failed to fetch metadata JSON for URI:', uri, e.message);
    }

    return null;
  }

  private getMarketplacePDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('marketplace')],
      PROGRAM_ID,
    );
  }

  private getCollectionPDA(collectionName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('collection'), Buffer.from(collectionName)],
      PROGRAM_ID,
    );
  }

  private getMetadataPDA(mint: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );
  }

  async fetchMarketplace(): Promise<Marketplace | null> {
    try {
      const [marketplacePDA] = this.getMarketplacePDA();
      const accountInfo = await this.connection.getAccountInfo(marketplacePDA);

      if (accountInfo && accountInfo.data.length > 0) {
        const data = accountInfo.data;

        // Parse marketplace data according to Rust struct
        let offset = 8; // Skip discriminator

        const admin = new PublicKey(data.slice(offset, offset + 32));
        offset += 32;

        const fee_bps = data.readUInt16LE(offset);
        offset += 2;

        const total_collections = Number(data.readBigUInt64LE(offset));
        offset += 8;

        const bump = data.readUInt8(offset);

        return { admin, fee_bps, total_collections, bump };
      }

      return null;
    } catch (error) {
      console.error('Error fetching marketplace:', error);
      return null;
    }
  }

  async fetchCollections(): Promise<{
    collections: NFTCollection[];
    itemTypesByCollection: Record<string, NFTItemType[]>;
  }> {
    // Cache kontrolü
    const now = Date.now();
    if (
      this.collectionsCache &&
      now - this.collectionsCacheTime < this.CACHE_DURATION
    ) {
      console.log('✅ Returning cached collections data');
      return this.collectionsCache;
    }

    try {
      const accounts = await this.connection.getProgramAccounts(PROGRAM_ID);

      console.log('Total program accounts found:', accounts.length);

      const collectionsData: NFTCollection[] = [];
      const itemTypesMap: Record<string, NFTItemType[]> = {};

      for (const account of accounts) {
        try {
          const data = account.account.data;

          // Skip if too small
          if (data.length < 100) continue;

          // Check for NFTCollection / NFTItemType account discriminator
          const accountDiscriminator = Array.from(data.slice(0, 8));
          const isCollection =
            JSON.stringify(accountDiscriminator) ===
            JSON.stringify(COLLECTION_ACCOUNT_DISCRIMINATOR);

          if (!isCollection) {
            // Try to parse as NftType based on structure
            try {
              let offset = 8;
              if (data.length < offset + 32) continue;
              const collection = new PublicKey(data.slice(offset, offset + 32));
              offset += 32;
              if (data.length < offset + 4) continue;
              const nameLen = data.readUInt32LE(offset);
              offset += 4;
              if (
                nameLen === 0 ||
                nameLen > 100 ||
                data.length < offset + nameLen + 4
              )
                continue;
              const name = data
                .slice(offset, offset + nameLen)
                .toString('utf8');
              offset += nameLen;
              const uriLen = data.readUInt32LE(offset);
              offset += 4;
              if (
                uriLen === 0 ||
                uriLen > 500 ||
                data.length < offset + uriLen + 8 + 8 + 8 + 1
              )
                continue;
              const uri = data.slice(offset, offset + uriLen).toString('utf8');
              offset += uriLen;
              const price = Number(data.readBigUInt64LE(offset));
              offset += 8;
              const max_supply = Number(data.readBigUInt64LE(offset));
              offset += 8;
              const current_supply = Number(data.readBigUInt64LE(offset));
              offset += 8;
              const bump = data.readUInt8(offset);

              // Only include item types for target collection
              // We'll check this after we have all collections parsed
              const key = collection.toString();
              if (!itemTypesMap[key]) itemTypesMap[key] = [];
              itemTypesMap[key].push({
                collection,
                name,
                uri,
                price,
                max_supply,
                current_supply,
                bump,
              });
              continue;
            } catch (_) {
              continue;
            }
          }

          let offset = 8; // Skip discriminator

          // If we reach here, it is a Collection

          // Parse admin (Pubkey)
          const admin = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          // Parse name (String)
          if (data.length <= offset + 4) continue;
          const nameLength = data.readUInt32LE(offset);
          offset += 4;

          if (data.length < offset + nameLength || nameLength > 100) continue;
          const name = data.slice(offset, offset + nameLength).toString('utf8');
          offset += nameLength;

          // Parse symbol (String)
          if (data.length <= offset + 4) continue;
          const symbolLength = data.readUInt32LE(offset);
          offset += 4;

          if (data.length < offset + symbolLength || symbolLength > 20)
            continue;
          const symbol = data
            .slice(offset, offset + symbolLength)
            .toString('utf8');
          offset += symbolLength;

          // Parse uri (String)
          if (data.length <= offset + 4) continue;
          const uriLength = data.readUInt32LE(offset);
          offset += 4;

          if (data.length < offset + uriLength || uriLength > 500) continue;
          const uri = data.slice(offset, offset + uriLength).toString('utf8');
          offset += uriLength;

          // Ensure we have enough bytes for remaining fields (2+32+1+1 = 36 bytes)
          if (data.length < offset + 36) continue;

          // Parse remaining numeric fields
          const royalty = data.readUInt16LE(offset);
          offset += 2;

          const mint = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          const is_active = data.readUInt8(offset) === 1;
          offset += 1;

          const bump = data.readUInt8(offset);

          // Validate collection data (collect all first, then filter)
          if (
            name &&
            name.length > 0 &&
            symbol &&
            symbol.length > 0 &&
            /^[\x20-\x7E]*$/.test(name) &&
            /^[\x20-\x7E]*$/.test(symbol)
          ) {
            const collectionObj: NFTCollection = {
              admin,
              name,
              symbol,
              uri,
              royalty,
              mint,
              is_active,
              bump,
              pda: account.pubkey,
            };
            collectionsData.push(collectionObj);

            console.log('✅ Found collection:', {
              name,
              symbol,
              royalty: royalty / 100 + '%',
              active: is_active,
            });
          }
        } catch (parseError) {
          console.warn(
            'Failed to parse account:',
            account.pubkey.toString(),
            parseError,
          );
          continue;
        }
      }

      // Filter collections to only include target collection
      const targetCollections = collectionsData.filter(
        (c) => c.name === TARGET_COLLECTION_NAME,
      );

      // Filter item types to only include those from target collection
      const filteredItemTypesMap: Record<string, NFTItemType[]> = {};
      for (const collection of targetCollections) {
        const collectionKey = collection.pda?.toString() || '';
        if (itemTypesMap[collectionKey]) {
          filteredItemTypesMap[collectionKey] = itemTypesMap[collectionKey];
        }
      }

      console.log('Total collections found:', collectionsData.length);
      console.log('Target collections after filter:', targetCollections.length);
      console.log(
        'Total item types for target collection:',
        Object.values(filteredItemTypesMap).flat().length,
      );

      // Cache'e kaydet
      const result = {
        collections: targetCollections,
        itemTypesByCollection: filteredItemTypesMap,
      };
      this.collectionsCache = result;
      this.collectionsCacheTime = Date.now();

      return result;
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw error;
    }
  }

  async fetchUserNFTs(walletAddress: string): Promise<any[]> {
    // User NFTs cache kontrolü
    const cacheKey = walletAddress;
    const cachedData = this.userNFTsCache.get(cacheKey);

    if (
      cachedData &&
      Date.now() - cachedData.timestamp < this.USER_NFTS_CACHE_DURATION
    ) {
      console.log('✅ Returning cached user NFTs for:', walletAddress);
      return cachedData.data;
    }

    try {
      console.log(
        '🚀 Fetching user NFTs with searchAssets (owner + collection filter):',
        walletAddress,
      );
      const startTime = Date.now();

      // DAS API searchAssets - owner ve collection filtresini birlikte kullan
      const result = await this.umi.rpc.searchAssets({
        owner: umiPublicKey(walletAddress),
        grouping: ['collection', TARGET_COLLECTION_MINT],
        options: {
          showCollectionMetadata: true,
          showInscription: true,
        },
      });

      console.log(
        `📦 DAS searchAssets found ${result.items.length} NFTs from target collection`,
      );

      // Transform assets to our format
      const transformedNFTs = result.items.map((asset) =>
        this.transformDasAsset(asset),
      );

      const duration = Date.now() - startTime;
      console.log(
        `✅ searchAssets completed in ${duration}ms, found ${transformedNFTs.length} NFTs`,
      );

      // Metadata'ları URI'lerden yükle (response'u bloklar)
      await this.loadMetadataFromUrisSync(transformedNFTs);

      // Cache'e kaydet
      this.userNFTsCache.set(cacheKey, {
        data: transformedNFTs,
        timestamp: Date.now(),
      });

      const totalDuration = Date.now() - startTime;
      console.log(
        `✅ Complete fetch with metadata completed in ${totalDuration}ms`,
      );

      return transformedNFTs;
    } catch (error) {
      console.error('Error fetching user NFTs with searchAssets:', error);
      throw error;
    }
  }

  private transformDasAsset(asset: any): any {
    const nftName = asset.content?.metadata?.name || 'Unknown NFT';
    
    // Extract type name from NFT name (e.g., "Barbarian #1" -> "Barbarian")
    const typeName = nftName.includes('#') 
      ? nftName.split('#')[0].trim() 
      : nftName;

    return {
      mint: asset.id,
      metadata: asset.content?.metadata || null,
      name: nftName,
      typeName: typeName, // For staking
      image:
        asset.content?.files?.[0]?.uri ||
        asset.content?.metadata?.image ||
        '/placeholder.svg',
      collectionName: TARGET_COLLECTION_NAME,
      symbol: asset.content?.metadata?.symbol || '',
      description: asset.content?.metadata?.description || '',
      attributes: asset.content?.metadata?.attributes || [],
      uri: asset.content?.json_uri || '',
      collection: {
        address:
          asset.grouping?.find((g) => g.group_key === 'collection')
            ?.group_value || '',
        verified: true, // DAS API'de filtrelenmiş olarak geliyor
      },
      creators:
        asset.creators?.map((creator: any) => ({
          address: creator.address,
          verified: creator.verified,
          share: creator.share,
        })) || [],
      // DAS API specific fields
      interface: asset.interface,
      ownership: asset.ownership,
      supply: asset.supply,
      mutable: asset.mutable,
      burnt: asset.burnt,
    };
  }

  private async loadMetadataFromUrisSync(nfts: any[]): Promise<void> {
    // Senkron metadata loading - response'u bloklar ama tam veri döner
    try {
      console.log(
        '🎨 Loading metadata from URIs for',
        nfts.length,
        'NFTs (sync)...',
      );

      const BATCH_SIZE = 8; // Daha büyük batch - hızlı ama güvenli
      for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
        const batch = nfts.slice(i, i + BATCH_SIZE);

        const metadataPromises = batch.map(async (nft) => {
          try {
            if (nft.uri) {
              const metadata = await this.fetchMetadataWithCache(nft.uri);
              if (metadata) {
                // Metadata'dan eksik alanları güncelle
                if (metadata.image && nft.image === '/placeholder.svg') {
                  nft.image = metadata.image;
                }
                if (metadata.description && !nft.description) {
                  nft.description = metadata.description;
                }
                if (
                  metadata.attributes &&
                  (!nft.attributes || nft.attributes.length === 0)
                ) {
                  nft.attributes = metadata.attributes;
                }
                // Full metadata'yı da sakla
                nft.metadata = metadata;
              }
            }
          } catch (e) {
            console.warn(
              'Failed to load metadata from URI for NFT:',
              nft.mint,
              e.message,
            );
          }
        });

        await Promise.all(metadataPromises);

        // Rate limiting için kısa bekleme
        if (i + BATCH_SIZE < nfts.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      console.log('✅ Sync metadata loading from URIs completed');
    } catch (e) {
      console.warn('Sync metadata loading from URIs failed:', e);
    }
  }

  private async loadMetadataFromUris(nfts: any[]): Promise<void> {
    // Background'da URI'lerden tam metadata'yı yükle
    setTimeout(async () => {
      try {
        console.log(
          '🎨 Loading metadata from URIs for',
          nfts.length,
          'NFTs...',
        );

        const BATCH_SIZE = 5; // Rate limiting için küçük batch
        for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
          const batch = nfts.slice(i, i + BATCH_SIZE);

          const metadataPromises = batch.map(async (nft) => {
            try {
              if (nft.uri) {
                const metadata = await this.fetchMetadataWithCache(nft.uri);
                if (metadata) {
                  // Metadata'dan eksik alanları güncelle
                  if (metadata.image && nft.image === '/placeholder.svg') {
                    nft.image = metadata.image;
                  }
                  if (metadata.description && !nft.description) {
                    nft.description = metadata.description;
                  }
                  if (
                    metadata.attributes &&
                    (!nft.attributes || nft.attributes.length === 0)
                  ) {
                    nft.attributes = metadata.attributes;
                  }
                  // Full metadata'yı da sakla
                  nft.metadata = metadata;
                }
              }
            } catch (e) {
              console.warn(
                'Failed to load metadata from URI for NFT:',
                nft.mint,
                e.message,
              );
            }
          });

          await Promise.all(metadataPromises);

          // Rate limiting için kısa bekleme
          if (i + BATCH_SIZE < nfts.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        console.log('✅ Background metadata loading from URIs completed');
      } catch (e) {
        console.warn('Background metadata loading from URIs failed:', e);
      }
    }, 100); // 100ms sonra başla - response'u bloklamaz
  }

  private async loadMetadataInBackgroundBatch(nfts: any[]): Promise<void> {
    // Background'da metadata'ları batch olarak yükle
    setTimeout(async () => {
      try {
        console.log(
          '🎨 Loading metadata for',
          nfts.length,
          'NFTs in background...',
        );

        // Paralel olarak metadata'ları fetch et
        const METADATA_CHUNK_SIZE = 10;
        for (let i = 0; i < nfts.length; i += METADATA_CHUNK_SIZE) {
          const chunk = nfts.slice(i, i + METADATA_CHUNK_SIZE);
          const metadataPromises = chunk.map(async (nft) => {
            try {
              const metadata = await this.fetchMetadataWithCache(nft.uri);
              if (metadata) {
                nft.metadata = metadata;
                nft.image = metadata.image || '/placeholder.svg';
              }
              delete nft.uri; // Temizle
            } catch (e) {
              console.warn('Failed to load metadata for NFT:', nft.mint);
            }
          });

          await Promise.all(metadataPromises);
        }

        console.log('✅ Background metadata loading completed');
      } catch (e) {
        console.warn('Background metadata loading failed:', e);
      }
    }, 50); // 50ms sonra başla
  }

  private async loadMetadataInBackground(nfts: any[]): Promise<void> {
    // Background'da metadata'ları yükle - response'u bloklamaz
    setTimeout(async () => {
      try {
        const metadataPromises = nfts
          .filter((nft) => nft._metadataPromise)
          .map(async (nft) => {
            try {
              const metadata = await nft._metadataPromise;
              if (metadata) {
                nft.metadata = metadata;
                nft.image = metadata.image || '/placeholder.svg';
              }
              delete nft._metadataPromise; // Temizle
            } catch (e) {
              console.warn('Failed to load metadata for NFT:', nft.mint);
            }
          });

        await Promise.all(metadataPromises);
        console.log('🎨 Background metadata loading completed');
      } catch (e) {
        console.warn('Background metadata loading failed:', e);
      }
    }, 100); // 100ms sonra başla
  }

  private async processTokenAccountFast(
    tokenAccount: any,
    collections: NFTCollection[],
  ): Promise<any | null> {
    try {
      const info: any = tokenAccount.account.data.parsed.info;
      const mint = new PublicKey(info.mint);

      // Get metadata PDA
      const [metadataPDA] = this.getMetadataPDA(mint);
      const metadataAccount = await this.connection.getAccountInfo(metadataPDA);

      if (!metadataAccount) return null;

      // Parse sadece gerekli kısımları - daha hızlı
      const d = metadataAccount.data;
      let off = 1 + 32 + 32; // key + update authority + mint

      // name
      const nameLen = d.readUInt32LE(off);
      off += 4;
      const name = d.slice(off, off + nameLen).toString('utf8');
      off += nameLen;

      // symbol - skip
      const symbolLen = d.readUInt32LE(off);
      off += 4;
      off += symbolLen;

      // uri
      const uriLen = d.readUInt32LE(off);
      off += 4;
      const uri = d.slice(off, off + uriLen).toString('utf8');
      off += uriLen;

      // Skip seller fee
      off += 2;

      // Skip creators
      const hasCreators = d.readUInt8(off);
      off += 1;
      if (hasCreators === 1) {
        const creatorsLen = d.readUInt32LE(off);
        off += 4;
        off += creatorsLen * (32 + 1 + 1);
      }

      // Skip flags
      off += 2; // primary_sale_happened + is_mutable

      // Skip edition_nonce
      const hasEditionNonce = d.readUInt8(off);
      off += 1;
      if (hasEditionNonce === 1) off += 1;

      // Skip token_standard
      const hasTokenStandard = d.readUInt8(off);
      off += 1;
      if (hasTokenStandard === 1) off += 1;

      // Collection check - en önemli kısım
      let belongsToOurCollection = false;
      let matchedCollectionName: string | undefined;
      const hasCollectionOpt = d.readUInt8(off);
      off += 1;

      if (hasCollectionOpt === 1) {
        off += 1; // skip verified
        const collectionMintBuf = d.slice(off, off + 32);
        const collectionMint = new PublicKey(collectionMintBuf);

        // Sadece target collection'ı kontrol et - daha hızlı
        for (const c of collections) {
          if (
            c.mint.equals(collectionMint) &&
            c.name === TARGET_COLLECTION_NAME
          ) {
            belongsToOurCollection = true;
            matchedCollectionName = c.name;
            break;
          }
        }
      }

      // Eğer collection'a ait değilse erken çık
      if (!belongsToOurCollection) return null;

      // Metadata'yı async olarak fetch et ama beklemeden devam et
      const metadataPromise = this.fetchMetadataWithCache(uri);

      // Temel bilgileri hemen döndür, metadata sonra gelir
      return {
        mint: mint.toString(),
        metadata: null, // İlk başta null, sonra cache'den gelir
        name: name.replace(/\0+$/, ''),
        image: '/placeholder.svg', // Placeholder, metadata gelince güncellenecek
        collectionName: matchedCollectionName,
        _metadataPromise: metadataPromise, // İç kullanım için
      };
    } catch (e) {
      console.warn('Failed to process token account fast:', e.message);
      return null;
    }
  }

  private async processTokenAccount(
    tokenAccount: any,
    collections: NFTCollection[],
  ): Promise<any | null> {
    try {
      const info: any = tokenAccount.account.data.parsed.info;
      const mint = new PublicKey(info.mint);

      // Get metadata PDA
      const [metadataPDA] = this.getMetadataPDA(mint);
      const metadataAccount = await this.connection.getAccountInfo(metadataPDA);

      if (!metadataAccount) return null;

      // Parse metadata
      const d = metadataAccount.data;
      let off = 1; // key
      off += 32; // update authority
      off += 32; // mint
      // name
      const nameLen = d.readUInt32LE(off);
      off += 4;
      const name = d.slice(off, off + nameLen).toString('utf8');
      off += nameLen;
      // symbol
      const symbolLen = d.readUInt32LE(off);
      off += 4;
      const _symbol = d.slice(off, off + symbolLen).toString('utf8');
      off += symbolLen;
      // uri
      const uriLen = d.readUInt32LE(off);
      off += 4;
      const uri = d.slice(off, off + uriLen).toString('utf8');
      off += uriLen;
      // seller fee
      off += 2;
      // creators option
      const hasCreators = d.readUInt8(off);
      off += 1;
      if (hasCreators === 1) {
        const creatorsLen = d.readUInt32LE(off);
        off += 4;
        // each creator: pubkey(32) + verified(1) + share(1)
        off += creatorsLen * (32 + 1 + 1);
      }
      // primary_sale_happened (bool)
      off += 1;
      // is_mutable (bool)
      off += 1;
      // edition_nonce: Option<u8>
      const hasEditionNonce = d.readUInt8(off);
      off += 1;
      if (hasEditionNonce === 1) {
        off += 1; // skip nonce value
      }
      // token_standard: Option<u8>
      const hasTokenStandard = d.readUInt8(off);
      off += 1;
      if (hasTokenStandard === 1) {
        off += 1; // skip token_standard value
      }
      // collection option (DataV2.collection)
      let belongsToOurCollection = false;
      let matchedCollectionName: string | undefined;
      const hasCollectionOpt = d.readUInt8(off);
      off += 1;
      if (hasCollectionOpt === 1) {
        // Collection { verified: bool, key: Pubkey }
        const _verified = d.readUInt8(off);
        off += 1;
        const collectionMintBuf = d.slice(off, off + 32);
        off += 32;
        const collectionMint = new PublicKey(collectionMintBuf);
        for (const c of collections) {
          if (
            c.mint.equals(collectionMint) &&
            c.name === TARGET_COLLECTION_NAME
          ) {
            belongsToOurCollection = true;
            matchedCollectionName = c.name;
            break;
          }
        }
      }

      // Only process if belongs to our collection
      if (!belongsToOurCollection) return null;

      // Fetch metadata JSON with cache
      const metadataJson = await this.fetchMetadataWithCache(uri);

      return {
        mint: mint.toString(),
        metadata: metadataJson,
        name: name.replace(/\0+$/, ''),
        image: metadataJson?.image || '/placeholder.svg',
        collectionName: matchedCollectionName,
      };
    } catch (e) {
      console.warn('Failed to process token account:', e.message);
      return null;
    }
  }

  async getCollectionNFTs(collectionAddress?: string): Promise<any[]> {
    const targetCollection = collectionAddress || TARGET_COLLECTION_MINT;
    const cacheKey = `collection-nfts-${targetCollection}`;
    const cachedData = this.userNFTsCache.get(cacheKey);

    if (
      cachedData &&
      Date.now() - cachedData.timestamp < this.USER_NFTS_CACHE_DURATION
    ) {
      console.log('✅ Returning cached collection NFTs for:', targetCollection);
      return cachedData.data;
    }

    try {
      console.log(
        '🚀 Fetching collection NFTs with DAS API for collection:',
        targetCollection,
      );
      const startTime = Date.now();

      // DAS API getAssetsByGroup - en optimize yöntem
      const result = await this.umi.rpc.getAssetsByGroup({
        groupKey: 'collection',
        groupValue: targetCollection,
        page: 1,
        limit: 1000, // Max limit
        displayOptions: {
          showCollectionMetadata: true,
          showInscription: true,
        },
      });

      console.log(`📦 DAS API found ${result.items.length} NFTs in collection`);

      // Transform assets to our format
      const transformedNFTs = result.items.map((asset) =>
        this.transformDasAsset(asset),
      );

      // Cache'e kaydet
      this.userNFTsCache.set(cacheKey, {
        data: transformedNFTs,
        timestamp: Date.now(),
      });

      const duration = Date.now() - startTime;
      console.log(
        `✅ Collection NFTs fetch completed in ${duration}ms, found ${transformedNFTs.length} NFTs`,
      );

      // Metadata'ları URI'lerden yükle (response'u bloklar)
      await this.loadMetadataFromUrisSync(transformedNFTs);

      const totalDuration = Date.now() - startTime;
      console.log(
        `✅ Complete collection fetch with metadata completed in ${totalDuration}ms`,
      );

      return transformedNFTs;
    } catch (error) {
      console.error('Error fetching collection NFTs with DAS API:', error);
      throw error;
    }
  }

  async getMarketplaceData(): Promise<MarketplaceData> {
    const [marketplace, { collections, itemTypesByCollection }] =
      await Promise.all([this.fetchMarketplace(), this.fetchCollections()]);

    return {
      marketplace,
      collections,
      itemTypesByCollection,
    };
  }

  // ==================== STAKING FUNCTIONS ====================

  private getStakePoolPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('stake_pool')],
      STAKING_PROGRAM_ID,
    );
  }

  private getStakeAccountPDA(
    staker: PublicKey,
    nftMint: PublicKey,
  ): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('stake_account'), staker.toBuffer(), nftMint.toBuffer()],
      STAKING_PROGRAM_ID,
    );
  }

  async fetchStakedNFTs(walletAddress: string): Promise<any[]> {
    try {
      console.log('🎯 Fetching staked NFTs for wallet:', walletAddress);
      const startTime = Date.now();

      const walletPubkey = new PublicKey(walletAddress);

      // Get all stake accounts owned by this wallet
      const accounts = await this.connection.getProgramAccounts(
        STAKING_PROGRAM_ID,
        {
          filters: [
            {
              memcmp: {
                offset: 8, // After discriminator
                bytes: walletPubkey.toBase58(),
              },
            },
          ],
        },
      );

      console.log(`📦 Found ${accounts.length} stake accounts`);

      interface StakeAccountData {
        pda: string;
        owner: string;
        nftMint: string;
        nftType: string;
        stakePool: string;
        stakeTimestamp: number;
        lastClaimTimestamp: number;
        stakeMultiplier: number;
        multiplier: number;
        bump: number;
      }

      const stakes: StakeAccountData[] = [];

      for (const account of accounts) {
        try {
          const data = account.account.data;

          // Parse StakeAccount struct
          let offset = 8; // Skip discriminator

          // owner (Pubkey - 32 bytes)
          const owner = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          // nft_mint (Pubkey - 32 bytes)
          const nftMint = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          // nft_type (Pubkey - 32 bytes)
          const nftType = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          // stake_pool (Pubkey - 32 bytes)
          const stakePool = new PublicKey(data.slice(offset, offset + 32));
          offset += 32;

          // stake_timestamp (i64 - 8 bytes)
          const stakeTimestamp = Number(data.readBigInt64LE(offset));
          offset += 8;

          // last_claim_timestamp (i64 - 8 bytes)
          const lastClaimTimestamp = Number(data.readBigInt64LE(offset));
          offset += 8;

          // stake_multiplier (u64 - 8 bytes)
          const stakeMultiplier = Number(data.readBigUInt64LE(offset));
          offset += 8;

          // bump (u8 - 1 byte)
          const bump = data.readUInt8(offset);

          stakes.push({
            pda: account.pubkey.toString(),
            owner: owner.toString(),
            nftMint: nftMint.toString(),
            nftType: nftType.toString(),
            stakePool: stakePool.toString(),
            stakeTimestamp,
            lastClaimTimestamp,
            stakeMultiplier,
            multiplier: stakeMultiplier / 10000, // Convert basis points to decimal
            bump,
          });
        } catch (parseError) {
          console.warn(
            'Failed to parse stake account:',
            account.pubkey.toString(),
            parseError,
          );
          continue;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`✅ Fetched ${stakes.length} staked NFTs in ${duration}ms`);

      return stakes;
    } catch (error) {
      console.error('Error fetching staked NFTs:', error);
      throw error;
    }
  }

  async calculatePendingRewards(
    walletAddress: string,
    nftMint: string,
  ): Promise<any> {
    try {
      console.log('💰 Calculating pending rewards for NFT:', nftMint);

      const walletPubkey = new PublicKey(walletAddress);
      const nftMintPubkey = new PublicKey(nftMint);

      // Get stake account PDA
      const [stakeAccountPDA] = this.getStakeAccountPDA(
        walletPubkey,
        nftMintPubkey,
      );

      // Fetch stake account
      const stakeAccountInfo =
        await this.connection.getAccountInfo(stakeAccountPDA);

      if (!stakeAccountInfo) {
        throw new Error(`Stake account not found for NFT: ${nftMint}`);
      }

      // Parse stake account
      const data = stakeAccountInfo.data;
      let offset = 8; // Skip discriminator

      offset += 32; // owner
      offset += 32; // nft_mint
      offset += 32; // nft_type
      offset += 32; // stake_pool

      const stakeTimestamp = Number(data.readBigInt64LE(offset));
      offset += 8;

      const lastClaimTimestamp = Number(data.readBigInt64LE(offset));
      offset += 8;

      const stakeMultiplier = Number(data.readBigUInt64LE(offset));

      // Get stake pool to get reward rate
      const [stakePoolPDA] = this.getStakePoolPDA();
      const stakePoolInfo = await this.connection.getAccountInfo(stakePoolPDA);

      if (!stakePoolInfo) {
        throw new Error('Stake pool not found');
      }

      // Parse stake pool
      const poolData = stakePoolInfo.data;
      let poolOffset = 8; // Skip discriminator
      poolOffset += 32; // admin
      poolOffset += 32; // reward_token_mint

      const rewardRatePerSecond = Number(poolData.readBigUInt64LE(poolOffset));

      // Calculate pending rewards
      const currentTime = Math.floor(Date.now() / 1000);
      const timeSinceLastClaim = currentTime - lastClaimTimestamp;
      const baseRewards = timeSinceLastClaim * rewardRatePerSecond;
      const pendingRewards = (baseRewards * stakeMultiplier) / 10000;

      return {
        nftMint,
        stakeTimestamp,
        lastClaimTimestamp,
        stakeMultiplier,
        multiplier: stakeMultiplier / 10000,
        rewardRatePerSecond,
        timeSinceLastClaim,
        pendingRewards,
        pendingRewardsFormatted: (pendingRewards / 1e9).toFixed(4), // Convert lamports to tokens
      };
    } catch (error) {
      console.error('Error calculating pending rewards:', error);
      throw error;
    }
  }
}
