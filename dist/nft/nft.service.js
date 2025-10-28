"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NftService = void 0;
const common_1 = require("@nestjs/common");
const web3_js_1 = require("@solana/web3.js");
const umi_bundle_defaults_1 = require("@metaplex-foundation/umi-bundle-defaults");
const digital_asset_standard_api_1 = require("@metaplex-foundation/digital-asset-standard-api");
const PROGRAM_ID = new web3_js_1.PublicKey('B6c38JtYJXDiaW2XNJWrueLUULAD4vsxChz1VJk1d9zX');
const TOKEN_METADATA_PROGRAM_ID = new web3_js_1.PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
const TARGET_COLLECTION_MINT = 'DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN';
const MARKETPLACE_ACCOUNT_DISCRIMINATOR = [70, 222, 41, 62, 78, 3, 32, 174];
const COLLECTION_ACCOUNT_DISCRIMINATOR = [243, 209, 195, 150, 192, 176, 151, 165];
let NftService = class NftService {
    connection;
    umi;
    collectionsCache = null;
    collectionsCacheTime = 0;
    metadataCache = new Map();
    userNFTsCache = new Map();
    CACHE_DURATION = 5 * 60 * 1000;
    METADATA_CACHE_DURATION = 30 * 60 * 1000;
    USER_NFTS_CACHE_DURATION = 10 * 1000;
    constructor() {
        this.connection = new web3_js_1.Connection('https://api.devnet.solana.com', 'confirmed');
        this.umi = (0, umi_bundle_defaults_1.createUmi)('https://api.devnet.solana.com').use((0, digital_asset_standard_api_1.dasApi)());
    }
    async fetchMetadataWithCache(uri) {
        const cacheKey = uri;
        const cachedData = this.metadataCache.get(cacheKey);
        if (cachedData && (Date.now() - cachedData.timestamp) < this.METADATA_CACHE_DURATION) {
            return cachedData.data;
        }
        try {
            let fetchUri = uri;
            if (uri.startsWith('ipfs://')) {
                fetchUri = uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
            }
            const res = await fetch(fetchUri);
            if (res.ok) {
                const metadata = await res.json();
                this.metadataCache.set(cacheKey, {
                    data: metadata,
                    timestamp: Date.now()
                });
                return metadata;
            }
        }
        catch (e) {
            console.warn('Failed to fetch metadata JSON for URI:', uri, e.message);
        }
        return null;
    }
    extractImagesFromMetadata(metadata) {
        if (!metadata)
            return {};
        const mainImage = metadata.image || metadata.main_image || metadata.mainImage;
        const additionalImages = [];
        if (metadata.additional_images) {
            additionalImages.push(...metadata.additional_images);
        }
        if (metadata.additionalImages) {
            additionalImages.push(...metadata.additionalImages);
        }
        if (metadata.gallery) {
            additionalImages.push(...metadata.gallery);
        }
        if (metadata.images && Array.isArray(metadata.images)) {
            additionalImages.push(...metadata.images);
        }
        const convertToHttpUrl = (url) => {
            if (url && url.startsWith('ipfs://')) {
                return url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/');
            }
            return url;
        };
        return {
            mainImage: mainImage ? convertToHttpUrl(mainImage) : undefined,
            additionalImages: additionalImages.map(convertToHttpUrl).filter(Boolean)
        };
    }
    getMarketplacePDA() {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('marketplace')], PROGRAM_ID);
    }
    getCollectionPDA(collectionName) {
        return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from('collection'), Buffer.from(collectionName)], PROGRAM_ID);
    }
    getMetadataPDA(mint) {
        return web3_js_1.PublicKey.findProgramAddressSync([
            Buffer.from('metadata'),
            TOKEN_METADATA_PROGRAM_ID.toBuffer(),
            mint.toBuffer(),
        ], TOKEN_METADATA_PROGRAM_ID);
    }
    async fetchMarketplace() {
        try {
            const [marketplacePDA] = this.getMarketplacePDA();
            const accountInfo = await this.connection.getAccountInfo(marketplacePDA);
            if (accountInfo && accountInfo.data.length > 0) {
                const data = accountInfo.data;
                let offset = 8;
                const admin = new web3_js_1.PublicKey(data.slice(offset, offset + 32));
                offset += 32;
                const fee_bps = data.readUInt16LE(offset);
                offset += 2;
                const total_collections = Number(data.readBigUInt64LE(offset));
                offset += 8;
                const bump = data.readUInt8(offset);
                return { admin, fee_bps, total_collections, bump };
            }
            return null;
        }
        catch (error) {
            console.error('Error fetching marketplace:', error);
            return null;
        }
    }
    async fetchCollections() {
        const now = Date.now();
        if (this.collectionsCache && (now - this.collectionsCacheTime) < this.CACHE_DURATION) {
            console.log('✅ Returning cached collections data');
            return this.collectionsCache;
        }
        try {
            const accounts = await this.connection.getProgramAccounts(PROGRAM_ID);
            console.log('Total program accounts found:', accounts.length);
            const collectionsData = [];
            const itemTypesMap = {};
            for (const account of accounts) {
                try {
                    const data = account.account.data;
                    if (data.length < 100)
                        continue;
                    const accountDiscriminator = Array.from(data.slice(0, 8));
                    const isCollection = JSON.stringify(accountDiscriminator) === JSON.stringify(COLLECTION_ACCOUNT_DISCRIMINATOR);
                    if (!isCollection) {
                        try {
                            let offset = 8;
                            if (data.length < offset + 32)
                                continue;
                            const collection = new web3_js_1.PublicKey(data.slice(offset, offset + 32));
                            offset += 32;
                            if (data.length < offset + 4)
                                continue;
                            const nameLen = data.readUInt32LE(offset);
                            offset += 4;
                            if (nameLen === 0 || nameLen > 100 || data.length < offset + nameLen + 4)
                                continue;
                            const name = data.slice(offset, offset + nameLen).toString('utf8');
                            offset += nameLen;
                            const uriLen = data.readUInt32LE(offset);
                            offset += 4;
                            if (uriLen === 0 || uriLen > 500 || data.length < offset + uriLen + 8 + 8 + 8 + 8 + 1)
                                continue;
                            const uri = data.slice(offset, offset + uriLen).toString('utf8');
                            offset += uriLen;
                            const price = Number(data.readBigUInt64LE(offset));
                            offset += 8;
                            const max_supply = Number(data.readBigUInt64LE(offset));
                            offset += 8;
                            const current_supply = Number(data.readBigUInt64LE(offset));
                            offset += 8;
                            const staking_amount = Number(data.readBigUInt64LE(offset));
                            offset += 8;
                            const bump = data.readUInt8(offset);
                            const key = collection.toString();
                            if (!itemTypesMap[key])
                                itemTypesMap[key] = [];
                            itemTypesMap[key].push({ collection, name, uri, price, max_supply, current_supply, staking_amount, bump });
                            continue;
                        }
                        catch (_) {
                            continue;
                        }
                    }
                    let offset = 8;
                    const admin = new web3_js_1.PublicKey(data.slice(offset, offset + 32));
                    offset += 32;
                    if (data.length <= offset + 4)
                        continue;
                    const nameLength = data.readUInt32LE(offset);
                    offset += 4;
                    if (data.length < offset + nameLength || nameLength > 100)
                        continue;
                    const name = data.slice(offset, offset + nameLength).toString('utf8');
                    offset += nameLength;
                    if (data.length <= offset + 4)
                        continue;
                    const symbolLength = data.readUInt32LE(offset);
                    offset += 4;
                    if (data.length < offset + symbolLength || symbolLength > 20)
                        continue;
                    const symbol = data.slice(offset, offset + symbolLength).toString('utf8');
                    offset += symbolLength;
                    if (data.length <= offset + 4)
                        continue;
                    const uriLength = data.readUInt32LE(offset);
                    offset += 4;
                    if (data.length < offset + uriLength || uriLength > 500)
                        continue;
                    const uri = data.slice(offset, offset + uriLength).toString('utf8');
                    offset += uriLength;
                    if (data.length < offset + 36)
                        continue;
                    const royalty = data.readUInt16LE(offset);
                    offset += 2;
                    const mint = new web3_js_1.PublicKey(data.slice(offset, offset + 32));
                    offset += 32;
                    const is_active = data.readUInt8(offset) === 1;
                    offset += 1;
                    const bump = data.readUInt8(offset);
                    if (name && name.length > 0 && symbol && symbol.length > 0 &&
                        /^[\x20-\x7E]*$/.test(name) && /^[\x20-\x7E]*$/.test(symbol)) {
                        const collectionObj = {
                            admin,
                            name,
                            symbol,
                            uri,
                            royalty,
                            mint,
                            is_active,
                            bump,
                            pda: account.pubkey
                        };
                        collectionsData.push(collectionObj);
                        console.log('✅ Found collection:', {
                            name,
                            symbol,
                            royalty: royalty / 100 + '%',
                            active: is_active
                        });
                    }
                }
                catch (parseError) {
                    console.warn('Failed to parse account:', account.pubkey.toString(), parseError);
                    continue;
                }
            }
            console.log('Total collections found:', collectionsData.length);
            console.log('Total item types:', Object.values(itemTypesMap).flat().length);
            const result = { collections: collectionsData, itemTypesByCollection: itemTypesMap };
            this.collectionsCache = result;
            this.collectionsCacheTime = Date.now();
            return result;
        }
        catch (error) {
            console.error('Error fetching collections:', error);
            throw error;
        }
    }
    async fetchUserNFTs(walletAddress) {
        const cacheKey = walletAddress;
        const cachedData = this.userNFTsCache.get(cacheKey);
        if (cachedData && (Date.now() - cachedData.timestamp) < this.USER_NFTS_CACHE_DURATION) {
            console.log('✅ Returning cached user NFTs for:', walletAddress);
            return cachedData.data;
        }
        try {
            console.log('🚀 Fetching user NFTs from VYBE collections:', walletAddress);
            const startTime = Date.now();
            const { collections } = await this.fetchCollections();
            const collectionMints = collections.map(c => c.mint.toString());
            console.log('📋 VYBE Collections:', collectionMints);
            let allNFTs = [];
            for (const collectionMint of collectionMints) {
                try {
                    console.log(`🔍 Searching in collection: ${collectionMint}`);
                    const result = await this.umi.rpc.getAssetsByGroup({
                        groupKey: 'collection',
                        groupValue: collectionMint,
                    });
                    console.log(`  ✓ Found ${result.items.length} total NFTs in collection`);
                    const userAssets = result.items.filter(asset => asset.ownership?.owner === walletAddress);
                    console.log(`  ✓ User owns ${userAssets.length} NFTs in this collection`);
                    if (userAssets.length > 0) {
                        const transformed = userAssets.map(asset => this.transformDasAsset(asset));
                        allNFTs = allNFTs.concat(transformed);
                    }
                }
                catch (err) {
                    console.warn(`  ⚠️ Error fetching from collection ${collectionMint}:`, err.message);
                }
            }
            const duration = Date.now() - startTime;
            console.log(`✅ Fetched ${allNFTs.length} NFTs from ${collectionMints.length} collections in ${duration}ms`);
            await this.loadMetadataFromUrisSync(allNFTs);
            this.userNFTsCache.set(cacheKey, {
                data: allNFTs,
                timestamp: Date.now()
            });
            const totalDuration = Date.now() - startTime;
            console.log(`✅ Complete fetch with metadata completed in ${totalDuration}ms`);
            return allNFTs;
        }
        catch (error) {
            console.error('Error fetching user NFTs:', error);
            throw error;
        }
    }
    transformDasAsset(asset) {
        const collectionAddress = asset.grouping?.find(g => g.group_key === 'collection')?.group_value || '';
        const collectionName = asset.content?.metadata?.collection?.name || asset.grouping?.find(g => g.group_key === 'collection')?.group_value || 'Unknown Collection';
        return {
            mint: asset.id,
            metadata: asset.content?.metadata || null,
            name: asset.content?.metadata?.name || 'Unknown NFT',
            image: asset.content?.files?.[0]?.uri || asset.content?.metadata?.image || '/placeholder.svg',
            collectionName: collectionName,
            symbol: asset.content?.metadata?.symbol || '',
            description: asset.content?.metadata?.description || '',
            attributes: asset.content?.metadata?.attributes || [],
            uri: asset.content?.json_uri || '',
            collection: {
                address: collectionAddress,
                verified: asset.grouping?.find(g => g.group_key === 'collection')?.collection_verified || true,
            },
            creators: asset.creators?.map((creator) => ({
                address: creator.address,
                verified: creator.verified,
                share: creator.share,
            })) || [],
            interface: asset.interface,
            ownership: asset.ownership,
            supply: asset.supply,
            mutable: asset.mutable,
            burnt: asset.burnt,
        };
    }
    async loadMetadataFromUrisSync(nfts) {
        try {
            console.log('🎨 Loading metadata from URIs for', nfts.length, 'NFTs (sync)...');
            const BATCH_SIZE = 8;
            for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
                const batch = nfts.slice(i, i + BATCH_SIZE);
                const metadataPromises = batch.map(async (nft) => {
                    try {
                        if (nft.uri) {
                            const metadata = await this.fetchMetadataWithCache(nft.uri);
                            if (metadata) {
                                if (metadata.image && nft.image === '/placeholder.svg') {
                                    nft.image = metadata.image;
                                }
                                const { mainImage, additionalImages } = this.extractImagesFromMetadata(metadata);
                                nft.mainImage = mainImage;
                                nft.additionalImages = additionalImages;
                                if (metadata.description && !nft.description) {
                                    nft.description = metadata.description;
                                }
                                if (metadata.attributes && (!nft.attributes || nft.attributes.length === 0)) {
                                    nft.attributes = metadata.attributes;
                                }
                                nft.metadata = metadata;
                            }
                        }
                    }
                    catch (e) {
                        console.warn('Failed to load metadata from URI for NFT:', nft.mint, e.message);
                    }
                });
                await Promise.all(metadataPromises);
                if (i + BATCH_SIZE < nfts.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            console.log('✅ Sync metadata loading from URIs completed');
        }
        catch (e) {
            console.warn('Sync metadata loading from URIs failed:', e);
        }
    }
    async loadMetadataFromUris(nfts) {
        setTimeout(async () => {
            try {
                console.log('🎨 Loading metadata from URIs for', nfts.length, 'NFTs...');
                const BATCH_SIZE = 5;
                for (let i = 0; i < nfts.length; i += BATCH_SIZE) {
                    const batch = nfts.slice(i, i + BATCH_SIZE);
                    const metadataPromises = batch.map(async (nft) => {
                        try {
                            if (nft.uri) {
                                const metadata = await this.fetchMetadataWithCache(nft.uri);
                                if (metadata) {
                                    if (metadata.image && nft.image === '/placeholder.svg') {
                                        nft.image = metadata.image;
                                    }
                                    const { mainImage, additionalImages } = this.extractImagesFromMetadata(metadata);
                                    nft.mainImage = mainImage;
                                    nft.additionalImages = additionalImages;
                                    if (metadata.description && !nft.description) {
                                        nft.description = metadata.description;
                                    }
                                    if (metadata.attributes && (!nft.attributes || nft.attributes.length === 0)) {
                                        nft.attributes = metadata.attributes;
                                    }
                                    nft.metadata = metadata;
                                }
                            }
                        }
                        catch (e) {
                            console.warn('Failed to load metadata from URI for NFT:', nft.mint, e.message);
                        }
                    });
                    await Promise.all(metadataPromises);
                    if (i + BATCH_SIZE < nfts.length) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                }
                console.log('✅ Background metadata loading from URIs completed');
            }
            catch (e) {
                console.warn('Background metadata loading from URIs failed:', e);
            }
        }, 100);
    }
    async loadMetadataInBackgroundBatch(nfts) {
        setTimeout(async () => {
            try {
                console.log('🎨 Loading metadata for', nfts.length, 'NFTs in background...');
                const METADATA_CHUNK_SIZE = 10;
                for (let i = 0; i < nfts.length; i += METADATA_CHUNK_SIZE) {
                    const chunk = nfts.slice(i, i + METADATA_CHUNK_SIZE);
                    const metadataPromises = chunk.map(async (nft) => {
                        try {
                            const metadata = await this.fetchMetadataWithCache(nft.uri);
                            if (metadata) {
                                nft.metadata = metadata;
                                nft.image = metadata.image || '/placeholder.svg';
                                const { mainImage, additionalImages } = this.extractImagesFromMetadata(metadata);
                                nft.mainImage = mainImage;
                                nft.additionalImages = additionalImages;
                            }
                            delete nft.uri;
                        }
                        catch (e) {
                            console.warn('Failed to load metadata for NFT:', nft.mint);
                        }
                    });
                    await Promise.all(metadataPromises);
                }
                console.log('✅ Background metadata loading completed');
            }
            catch (e) {
                console.warn('Background metadata loading failed:', e);
            }
        }, 50);
    }
    async loadMetadataInBackground(nfts) {
        setTimeout(async () => {
            try {
                const metadataPromises = nfts
                    .filter(nft => nft._metadataPromise)
                    .map(async (nft) => {
                    try {
                        const metadata = await nft._metadataPromise;
                        if (metadata) {
                            nft.metadata = metadata;
                            nft.image = metadata.image || '/placeholder.svg';
                        }
                        delete nft._metadataPromise;
                    }
                    catch (e) {
                        console.warn('Failed to load metadata for NFT:', nft.mint);
                    }
                });
                await Promise.all(metadataPromises);
                console.log('🎨 Background metadata loading completed');
            }
            catch (e) {
                console.warn('Background metadata loading failed:', e);
            }
        }, 100);
    }
    async processTokenAccountFast(tokenAccount, collections) {
        try {
            const info = tokenAccount.account.data.parsed.info;
            const mint = new web3_js_1.PublicKey(info.mint);
            const [metadataPDA] = this.getMetadataPDA(mint);
            const metadataAccount = await this.connection.getAccountInfo(metadataPDA);
            if (!metadataAccount)
                return null;
            const d = metadataAccount.data;
            let off = 1 + 32 + 32;
            const nameLen = d.readUInt32LE(off);
            off += 4;
            const name = d.slice(off, off + nameLen).toString('utf8');
            off += nameLen;
            const symbolLen = d.readUInt32LE(off);
            off += 4;
            off += symbolLen;
            const uriLen = d.readUInt32LE(off);
            off += 4;
            const uri = d.slice(off, off + uriLen).toString('utf8');
            off += uriLen;
            off += 2;
            const hasCreators = d.readUInt8(off);
            off += 1;
            if (hasCreators === 1) {
                const creatorsLen = d.readUInt32LE(off);
                off += 4;
                off += creatorsLen * (32 + 1 + 1);
            }
            off += 2;
            const hasEditionNonce = d.readUInt8(off);
            off += 1;
            if (hasEditionNonce === 1)
                off += 1;
            const hasTokenStandard = d.readUInt8(off);
            off += 1;
            if (hasTokenStandard === 1)
                off += 1;
            let belongsToOurCollection = false;
            let matchedCollectionName;
            const hasCollectionOpt = d.readUInt8(off);
            off += 1;
            if (hasCollectionOpt === 1) {
                off += 1;
                const collectionMintBuf = d.slice(off, off + 32);
                const collectionMint = new web3_js_1.PublicKey(collectionMintBuf);
                for (const c of collections) {
                    if (c.mint.equals(collectionMint)) {
                        belongsToOurCollection = true;
                        matchedCollectionName = c.name;
                        break;
                    }
                }
            }
            if (!belongsToOurCollection)
                return null;
            const metadataPromise = this.fetchMetadataWithCache(uri);
            return {
                mint: mint.toString(),
                metadata: null,
                name: name.replace(/\0+$/, ''),
                image: '/placeholder.svg',
                collectionName: matchedCollectionName,
                _metadataPromise: metadataPromise
            };
        }
        catch (e) {
            console.warn('Failed to process token account fast:', e.message);
            return null;
        }
    }
    async processTokenAccount(tokenAccount, collections) {
        try {
            const info = tokenAccount.account.data.parsed.info;
            const mint = new web3_js_1.PublicKey(info.mint);
            const [metadataPDA] = this.getMetadataPDA(mint);
            const metadataAccount = await this.connection.getAccountInfo(metadataPDA);
            if (!metadataAccount)
                return null;
            const d = metadataAccount.data;
            let off = 1;
            off += 32;
            off += 32;
            const nameLen = d.readUInt32LE(off);
            off += 4;
            const name = d.slice(off, off + nameLen).toString('utf8');
            off += nameLen;
            const symbolLen = d.readUInt32LE(off);
            off += 4;
            const _symbol = d.slice(off, off + symbolLen).toString('utf8');
            off += symbolLen;
            const uriLen = d.readUInt32LE(off);
            off += 4;
            const uri = d.slice(off, off + uriLen).toString('utf8');
            off += uriLen;
            off += 2;
            const hasCreators = d.readUInt8(off);
            off += 1;
            if (hasCreators === 1) {
                const creatorsLen = d.readUInt32LE(off);
                off += 4;
                off += creatorsLen * (32 + 1 + 1);
            }
            off += 1;
            off += 1;
            const hasEditionNonce = d.readUInt8(off);
            off += 1;
            if (hasEditionNonce === 1) {
                off += 1;
            }
            const hasTokenStandard = d.readUInt8(off);
            off += 1;
            if (hasTokenStandard === 1) {
                off += 1;
            }
            let belongsToOurCollection = false;
            let matchedCollectionName;
            const hasCollectionOpt = d.readUInt8(off);
            off += 1;
            if (hasCollectionOpt === 1) {
                const _verified = d.readUInt8(off);
                off += 1;
                const collectionMintBuf = d.slice(off, off + 32);
                off += 32;
                const collectionMint = new web3_js_1.PublicKey(collectionMintBuf);
                for (const c of collections) {
                    if (c.mint.equals(collectionMint)) {
                        belongsToOurCollection = true;
                        matchedCollectionName = c.name;
                        break;
                    }
                }
            }
            if (!belongsToOurCollection)
                return null;
            const metadataJson = await this.fetchMetadataWithCache(uri);
            const { mainImage, additionalImages } = this.extractImagesFromMetadata(metadataJson);
            return {
                mint: mint.toString(),
                metadata: metadataJson,
                name: name.replace(/\0+$/, ''),
                mainImage,
                additionalImages,
                image: metadataJson?.image || '/placeholder.svg',
                collectionName: matchedCollectionName,
            };
        }
        catch (e) {
            console.warn('Failed to process token account:', e.message);
            return null;
        }
    }
    async getCollectionNFTs(collectionAddress) {
        const targetCollection = collectionAddress || TARGET_COLLECTION_MINT;
        const cacheKey = `collection-nfts-${targetCollection}`;
        const cachedData = this.userNFTsCache.get(cacheKey);
        if (cachedData && (Date.now() - cachedData.timestamp) < this.USER_NFTS_CACHE_DURATION) {
            console.log('✅ Returning cached collection NFTs for:', targetCollection);
            return cachedData.data;
        }
        try {
            console.log('🚀 Fetching collection NFTs with DAS API for collection:', targetCollection);
            const startTime = Date.now();
            const result = await this.umi.rpc.getAssetsByGroup({
                groupKey: 'collection',
                groupValue: targetCollection,
                page: 1,
                limit: 1000,
                displayOptions: {
                    showCollectionMetadata: true,
                    showInscription: true
                }
            });
            console.log(`📦 DAS API found ${result.items.length} NFTs in collection`);
            const transformedNFTs = result.items.map(asset => this.transformDasAsset(asset));
            this.userNFTsCache.set(cacheKey, {
                data: transformedNFTs,
                timestamp: Date.now()
            });
            const duration = Date.now() - startTime;
            console.log(`✅ Collection NFTs fetch completed in ${duration}ms, found ${transformedNFTs.length} NFTs`);
            await this.loadMetadataFromUrisSync(transformedNFTs);
            const totalDuration = Date.now() - startTime;
            console.log(`✅ Complete collection fetch with metadata completed in ${totalDuration}ms`);
            return transformedNFTs;
        }
        catch (error) {
            console.error('Error fetching collection NFTs with DAS API:', error);
            throw error;
        }
    }
    async getMarketplaceData() {
        const [marketplace, { collections, itemTypesByCollection }] = await Promise.all([
            this.fetchMarketplace(),
            this.fetchCollections()
        ]);
        return {
            marketplace,
            collections,
            itemTypesByCollection
        };
    }
};
exports.NftService = NftService;
exports.NftService = NftService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], NftService);
//# sourceMappingURL=nft.service.js.map