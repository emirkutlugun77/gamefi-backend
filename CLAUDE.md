# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VYBE GameFi Backend - A NestJS REST API for a Solana NFT marketplace that fetches data directly from the blockchain without requiring a traditional database. Built for the VYBE Superheroes NFT collection on Solana devnet.

## Development Commands

### Running the Application
```bash
npm run start:dev    # Development mode with hot reload
npm run start        # Standard mode
npm run start:prod   # Production mode (requires build)
```

### Building and Testing
```bash
npm run build        # Compile TypeScript to dist/
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:cov     # Run tests with coverage
npm run test:e2e     # Run end-to-end tests
```

### Code Quality
```bash
npm run lint         # Run ESLint with auto-fix
npm run format       # Format code with Prettier
```

### Single Test Execution
```bash
npm run test -- <test-file-name>                    # Run specific test file
npm run test:debug -- --runInBand <test-file-name> # Debug specific test
```

## Architecture

### Core Structure

**Dual Data Sources:**
1. **Blockchain (Solana)** - Primary source for NFT marketplace data, collections, and NFT metadata
2. **PostgreSQL Database** - Stores user data (public keys, telegram IDs, chosen sides)

### Key Modules

**NFT Module** (`src/nft/`)
- Fetches marketplace, collection, and NFT data directly from Solana blockchain
- Uses custom PDA (Program Derived Address) parsing to decode on-chain accounts
- Integrates Metaplex DAS (Digital Asset Standard) API for efficient NFT queries
- Implements multi-layer caching:
  - Collections cache: 5 minutes
  - Metadata cache: 30 minutes
  - User NFTs cache: 2 minutes
- Target collection filtering: Only returns NFTs from `VYBE_SUPERHEROES_w89yuli8p3l`

**User Module** (`src/user/`)
- Manages user registration and profile data in PostgreSQL
- Tracks user's chosen side (DARK/HOLY/NOT_CHOSEN) for gameplay
- Links Solana public keys with optional Telegram IDs

### Blockchain Integration

**Program IDs:**
- Marketplace Program: `8KzE3LCicxv13iJx2v2V4VQQNWt4QHuvfuH8jxYnkGQ1`
- Token Metadata Program: `metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
- Target Collection Mint: `DoJfRjtn4SXnAafzvSUGEjaokSLBLnzmNWzzRzayF4cN`

**Data Fetching Strategy:**
- Uses `@solana/web3.js` for direct RPC calls to parse custom program accounts
- Uses `@metaplex-foundation/umi` + DAS API for optimized NFT metadata queries
- Implements custom binary deserialization for marketplace and collection accounts
- Account discriminators identify account types (marketplace, collection, item type)

**PDA Derivation:**
- Marketplace PDA: `['marketplace']`
- Collection PDA: `['collection', <collection_name>]`
- Metadata PDA: `['metadata', TOKEN_METADATA_PROGRAM_ID, <mint>]`

### Caching Strategy

The service uses in-memory Map-based caching to reduce blockchain RPC calls:
- Collection data cached to avoid repeated program account scans
- Metadata URIs cached after first fetch (IPFS gateway calls are expensive)
- User NFT lists cached per wallet address
- Cache invalidation based on time-to-live (TTL)

### Image Handling

NFT metadata can contain images in multiple fields:
- Main image: `image`, `main_image`, `mainImage`
- Additional images: `additional_images`, `additionalImages`, `gallery`, `images` array
- IPFS URLs automatically converted to HTTP gateway URLs (Pinata gateway)

## API Endpoints

### NFT Endpoints
- `GET /nft/marketplace` - Complete marketplace data (marketplace info + collections + item types)
- `GET /nft/marketplace-info` - Only marketplace information
- `GET /nft/collections` - Collections and their item types
- `GET /nft/user-nfts?wallet=<address>` - User's NFTs filtered by target collection
- `GET /nft/collection-nfts?collection=<mint>` - All NFTs in a collection (defaults to VYBE_SUPERHEROES)

### User Endpoints
- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `GET /users/by-public-key?publicKey=<key>` - Get user by Solana public key
- `POST /users/register` - Register new user (body: `{ publicKey, telegramId? }`)
- `POST /users/choose-side` - Set user's chosen side (body: `{ publicKey, side }`)

## Configuration

**Server:**
- Default port: 3001
- CORS enabled for localhost:3000-3001
- Swagger UI available at `/api`
- OpenAPI JSON at `/api-json`

**Solana:**
- Network: Devnet
- RPC Endpoint: `https://api.devnet.solana.com`

**Database:**
- TypeORM with PostgreSQL
- Auto-synchronize enabled (caution in production)
- Connection string in `app.module.ts` (should be moved to environment variable)

## Important Notes

### When Adding New NFT Features
- Always consider cache invalidation strategy
- Use DAS API (`umi.rpc.searchAssets`, `umi.rpc.getAssetsByGroup`) for NFT queries - it's much faster than manual token account parsing
- Filter results by `TARGET_COLLECTION_NAME` to ensure only relevant NFTs are returned
- Handle IPFS URI conversion for all image fields

### When Working with Blockchain Data
- All binary deserialization follows Rust struct layouts from the on-chain program
- Account discriminators (first 8 bytes) are used to identify account types
- String fields are length-prefixed (u32 length + UTF-8 bytes)
- PublicKeys are 32 bytes
- Numeric types follow little-endian encoding

### Database Entities
- `User` - User profiles with Solana public keys
- `NftCollection`, `NftType`, `UserNft` - TypeORM entities defined but not actively used (blockchain is source of truth)

### DTOs and Validation
- Uses `class-validator` and `class-transformer` for request/response validation
- Swagger decorators on all endpoints for API documentation
- Response format: `{ success: boolean, data: any, message?: string }`
