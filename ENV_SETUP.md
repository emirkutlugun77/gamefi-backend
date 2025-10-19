# Environment Configuration Guide

This guide explains how to set up and use the development and production environments for the GameFi Backend.

## Environment Files

The project now supports separate environment configurations:

- `.env.development` - Development environment (local testing)
- `.env.production` - Production environment (deployed)
- `.env.example` - Template for environment variables

## Quick Start

### 1. Configure Your API Key

Before running the application, you need to set up your QuickNode IPFS API key:

1. Get your API key from [QuickNode Dashboard](https://dashboard.quicknode.com/)
2. Open `.env.development` or `.env.production`
3. Replace `your-quicknode-api-key-here` with your actual API key

Example:
```env
QUICKNODE_IPFS_API_KEY=qn_abc123xyz...
```

### 2. Running the Application

#### Development Mode (Port 3001)
```bash
npm run start:dev
```

This will:
- Load `.env.development` configuration
- Run on `http://localhost:3001`
- Enable hot reload for code changes
- Use local database connection

#### Production Mode
```bash
npm run build
npm run start:prod
```

This will:
- Load `.env.production` configuration
- Run the compiled version from `dist/`
- Use production database credentials
- Connect to Railway deployment URL

## Environment Variables

### Development (.env.development)

```env
# Server runs on port 3001 to avoid conflicts
PORT=3001
NODE_ENV=development

# API host for frontend integration
API_HOST=http://localhost:3001

# CORS allows localhost origins
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# Local database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=vybe_gamefi

# Solana devnet for testing
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# QuickNode IPFS API key (required)
QUICKNODE_IPFS_API_KEY=your-api-key-here
```

### Production (.env.production)

```env
# Server configuration
PORT=3001
NODE_ENV=production

# Production API host (Railway deployment)
API_HOST=https://gamefi-backend-production.up.railway.app

# CORS for production domain only
CORS_ORIGIN=https://yourdomain.com

# Production database (update with Railway credentials)
DATABASE_HOST=your-railway-db-host
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=vybe_gamefi

# Solana network (can be devnet or mainnet)
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# QuickNode IPFS API key
QUICKNODE_IPFS_API_KEY=your-production-api-key
```

## Testing IPFS Upload

After setting up your environment, test the IPFS upload functionality:

### Using Swagger UI

1. Start the dev server: `npm run start:dev`
2. Open http://localhost:3001/api
3. Navigate to **nft-admin** endpoints
4. Try **POST /nft-admin/collection**
5. Upload a test image file

### Expected Response

Successful upload:
```json
{
  "success": true,
  "data": {
    "collection": {...},
    "metadata": {...},
    "metadataUri": "ipfs://QmXxx...",
    "message": "Collection created successfully..."
  }
}
```

## Troubleshooting

### "QUICKNODE_IPFS_API_KEY is not configured"

- Make sure you've added your API key to the environment file
- Verify you're using the correct npm script (`npm run start:dev` or `npm run start:prod`)
- Restart the server after changing environment variables

### "Multipart: Unexpected end of form" Error

This has been **fixed** by switching from native `fetch` to `axios` for multipart uploads.

If you still encounter this error:
1. Ensure `axios` is installed: `npm install axios`
2. Check that the service imports axios: `import axios from 'axios'`
3. Verify the FormData is properly structured

### Port Already in Use

If port 3001 is occupied:
1. Change `PORT` in your `.env.development` file
2. Update any frontend API configurations to match

### Database Connection Issues

Development:
1. Ensure PostgreSQL is running locally
2. Verify credentials in `.env.development`
3. Create the database: `createdb vybe_gamefi`

Production:
1. Update `.env.production` with Railway database credentials
2. Enable SSL if required by your database provider

## API Endpoints Reference

### Admin NFT Endpoints

- `POST /nft-admin/collection` - Create NFT collection with file upload
- `POST /nft-admin/type` - Create NFT type with file uploads
- `GET /nft-admin/collections` - List all collections
- `GET /nft-admin/types?collection=NAME` - List types by collection

### Store Configuration

- `POST /nft-admin/store-config` - Create/update store tab config
- `GET /nft-admin/store-configs` - List all store configs
- `GET /nft-admin/store-config/:tabName` - Get config by tab
- `PUT /nft-admin/store-config/:tabName` - Update config
- `DELETE /nft-admin/store-config/:tabName` - Delete config

## Frontend Integration

### Development

Point your frontend API client to:
```
http://localhost:3001
```

### Production

Point your frontend API client to:
```
https://gamefi-backend-production.up.railway.app
```

## Recent Changes

### IPFS Upload Fix (October 18, 2024)

**Problem**: "Multipart: Unexpected end of form" error when uploading files to IPFS

**Solution**: Replaced native `fetch` with `axios` for proper multipart/form-data handling

**Files Changed**:
- `src/nft/nft-admin.service.ts` - Added axios import and updated `uploadToIPFS` and `uploadFileToIPFS` methods
- `package.json` - Added axios dependency

### Environment Configuration (October 18, 2024)

**Added**:
- Separate `.env.development` and `.env.production` files
- Updated npm scripts to use dotenv-cli
- This documentation file

## Security Notes

⚠️ **Never commit environment files with real credentials!**

- Add `.env.development` and `.env.production` to `.gitignore`
- Use environment variables in CI/CD pipelines
- Rotate API keys regularly
- Use different API keys for dev and production
