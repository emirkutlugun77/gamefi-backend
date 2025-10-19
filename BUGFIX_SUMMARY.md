# IPFS Upload Bug Fix - Summary

## Problem

When attempting to upload NFT collection images to IPFS via QuickNode API, the following error occurred:

```
QuickNode IPFS file upload failed: {"statusCode":400,"message":"Multipart: Unexpected end of form","error":"Bad Request"}
Error uploading file to IPFS: Error: File upload failed: Bad Request
```

## Root Cause

The issue was caused by using Node.js's native `fetch` API with `form-data` streams. The native fetch implementation (undici) doesn't properly handle multipart/form-data streams, causing the boundary to be incomplete and resulting in "Unexpected end of form" errors.

## Solution

Replaced native `fetch` with `axios` library, which properly handles multipart/form-data uploads with streams.

### Changes Made

#### 1. Updated Dependencies

**File**: `package.json`

- Added `axios@^1.12.2` to dependencies
- Added `dotenv-cli@^10.0.0` to devDependencies
- Updated scripts to use environment-specific configurations

#### 2. Fixed IPFS Upload Functions

**File**: `src/nft/nft-admin.service.ts`

**Before**:
```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// ... other imports

async uploadFileToIPFS(fileBuffer: Buffer, filename: string): Promise<string> {
  // ... setup code
  const response = await fetch('https://api.quicknode.com/ipfs/rest/v1/s3/put-object', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      ...form.getHeaders()
    },
    body: form as any  // ❌ Issue: fetch doesn't handle form-data streams
  });
}
```

**After**:
```typescript
import axios from 'axios';
// ... other imports

async uploadFileToIPFS(fileBuffer: Buffer, filename: string): Promise<string> {
  // ... setup code
  const response = await axios.post(
    'https://api.quicknode.com/ipfs/rest/v1/s3/put-object',
    form,  // ✅ axios properly handles form-data streams
    {
      headers: {
        'x-api-key': apiKey,
        ...form.getHeaders()
      }
    }
  );

  const result = response.data;
  // ... rest of the code
}
```

**Same fix applied to**:
- `uploadToIPFS()` - For JSON metadata uploads
- `uploadFileToIPFS()` - For file buffer uploads

#### 3. Environment Configuration

**New Files Created**:

1. `.env.development` - Development environment configuration
```env
PORT=3001
NODE_ENV=development
API_HOST=http://localhost:3001
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
QUICKNODE_IPFS_API_KEY=your-quicknode-api-key-here
```

2. `.env.production` - Production environment configuration
```env
PORT=3001
NODE_ENV=production
API_HOST=https://gamefi-backend-production.up.railway.app
CORS_ORIGIN=https://yourdomain.com
QUICKNODE_IPFS_API_KEY=your-production-api-key
```

3. `ENV_SETUP.md` - Comprehensive setup guide
4. `BUGFIX_SUMMARY.md` - This file

#### 4. Updated NPM Scripts

**File**: `package.json`

**Before**:
```json
"scripts": {
  "start:dev": "nest start --watch",
  "start:prod": "node dist/main"
}
```

**After**:
```json
"scripts": {
  "start:dev": "dotenv -e .env.development -- nest start --watch",
  "start:prod": "dotenv -e .env.production -- node dist/main"
}
```

## Testing the Fix

### Prerequisites

1. Get QuickNode IPFS API key from https://dashboard.quicknode.com/
2. Add the API key to `.env.development`:
   ```env
   QUICKNODE_IPFS_API_KEY=qn_your_actual_api_key_here
   ```

### Run Development Server

```bash
cd gamefi-backend
npm run start:dev
```

The server will start on http://localhost:3001

### Test via Swagger UI

1. Open http://localhost:3001/api
2. Navigate to **nft-admin** section
3. Click on **POST /nft-admin/collection**
4. Fill in the form:
   - `adminPublicKey`: Your Solana wallet public key
   - `name`: Test collection name (e.g., "VYBE_TEST_COLLECTION")
   - `symbol`: Symbol (e.g., "VTEST")
   - `royalty`: Royalty percentage (e.g., 5)
   - `description`: Collection description
   - `image`: Upload a test image file (PNG/JPEG)
5. Click "Execute"

### Expected Result

**Success Response**:
```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "VYBE_TEST_COLLECTION_1729250000000",
      "admin": "...",
      "name": "VYBE_TEST_COLLECTION",
      "symbol": "VTEST",
      "uri": "ipfs://QmXxx...",
      "royalty": 5,
      "isActive": true
    },
    "metadata": {
      "name": "VYBE_TEST_COLLECTION",
      "symbol": "VTEST",
      "description": "...",
      "image": "ipfs://QmYyy...",
      "external_url": "https://vybe.game",
      "attributes": [],
      "properties": {...}
    },
    "metadataUri": "ipfs://QmXxx...",
    "message": "Collection created successfully..."
  }
}
```

**Console Output**:
```
Uploading file to QuickNode IPFS: test-image.png
QuickNode IPFS response: { requestid: 'QmYyy...', ... }
✅ File uploaded to IPFS: ipfs://QmYyy...
   Gateway URL: https://gateway.quicknode.com/ipfs/QmYyy...

Uploading metadata to QuickNode IPFS: {...}
✅ Uploaded metadata to IPFS: ipfs://QmXxx...
```

## Verification

You can verify the uploaded content via IPFS gateways:

```
https://gateway.quicknode.com/ipfs/[CID]
https://ipfs.io/ipfs/[CID]
https://cloudflare-ipfs.com/ipfs/[CID]
```

## Benefits of the Fix

1. **Reliable Uploads**: Axios properly handles multipart boundaries
2. **Better Error Handling**: Access to `error.response.data` for detailed error messages
3. **Environment Separation**: Clear dev/prod configuration
4. **Improved DX**: Easier to test and debug with separate environments

## Migration Notes

### For Developers

If you were running the server before this fix:

1. Stop the running server
2. Pull the latest changes
3. Install new dependencies: `npm install`
4. Create your `.env.development` file (or copy from `.env.development` template)
5. Add your QuickNode API key
6. Run: `npm run start:dev`

### For Production Deployment

1. Update Railway environment variables with values from `.env.production`
2. Add `QUICKNODE_IPFS_API_KEY` to Railway secrets
3. Deploy with the updated code
4. The build will automatically use axios

## Files Changed

### Modified
- `src/nft/nft-admin.service.ts` - Fixed IPFS upload methods
- `package.json` - Added dependencies and updated scripts
- `.gitignore` - Updated comments for environment files

### Added
- `.env.development` - Development configuration template
- `.env.production` - Production configuration template
- `ENV_SETUP.md` - Environment setup documentation
- `BUGFIX_SUMMARY.md` - This summary document

### Dependencies Added
- `axios@^1.12.2` - HTTP client with proper multipart support
- `dotenv-cli@^10.0.0` - Environment file loader for npm scripts

## Future Improvements

1. **Add retry logic** for IPFS uploads in case of transient failures
2. **Implement upload progress tracking** for large files
3. **Add IPFS pin verification** to ensure content persistence
4. **Create admin panel UI** for easier NFT management
5. **Add image validation** (size, format, dimensions) before upload
6. **Implement rate limiting** to prevent API quota exhaustion

## Support

If you encounter any issues:

1. Check `ENV_SETUP.md` for troubleshooting
2. Verify your QuickNode API key is valid
3. Check server logs for detailed error messages
4. Ensure ports are not conflicting (default: 3001)

## References

- [QuickNode IPFS API Documentation](https://www.quicknode.com/docs/ipfs)
- [Axios Documentation](https://axios-http.com/)
- [form-data NPM Package](https://www.npmjs.com/package/form-data)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
