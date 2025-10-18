# QuickNode IPFS Migration Summary

## ✅ Completed Changes

### 1. Environment Configuration
Created `.env.example` with QuickNode IPFS API key configuration:
```env
QUICKNODE_IPFS_API_KEY=your-quicknode-api-key-here
```

### 2. Updated IPFS Upload Methods

#### `uploadToIPFS()` - Metadata Upload
**Before:**
```typescript
fetch(`${process.env.QUICKNODE_IPFS_URL}/ipfs/api/v0/add`, {...})
```

**After:**
```typescript
const form = new FormData();
form.append('Body', metadataBuffer, { filename: fileName });
form.append('Key', fileName);
form.append('ContentType', 'application/json');

fetch('https://api.quicknode.com/ipfs/rest/v1/s3/put-object', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.QUICKNODE_IPFS_API_KEY,
    ...form.getHeaders()
  },
  body: form
})
```

#### `uploadFileToIPFS()` - File Upload
**Before:**
```typescript
fetch(`${process.env.QUICKNODE_IPFS_URL}/ipfs/api/v0/add`, {...})
```

**After:**
```typescript
const form = new FormData();
form.append('Body', fileBuffer, { filename });
form.append('Key', fileKey);
form.append('ContentType', contentType);

fetch('https://api.quicknode.com/ipfs/rest/v1/s3/put-object', {
  method: 'POST',
  headers: {
    'x-api-key': process.env.QUICKNODE_IPFS_API_KEY,
    ...form.getHeaders()
  },
  body: form
})
```

### 3. Added Helper Methods

#### `getMimeType()` - Automatic MIME Type Detection
```typescript
private getMimeType(filename: string): string {
  const mimeTypes = {
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'json': 'application/json',
  };
  // ...
}
```

## 🔄 API Changes

### Endpoint
```
https://api.quicknode.com/ipfs/rest/v1/s3/put-object
```

### FormData Fields (3 required fields)
```javascript
form.append('Body', fileBuffer, { filename });  // The file content
form.append('Key', uniqueFileName);              // Unique file key/name
form.append('ContentType', mimeType);            // MIME type
```

### Response Format
```javascript
// QuickNode S3 returns requestid as CID
const cid = result.requestid || result.pin?.cid || result.cid;
const ipfsUri = `ipfs://${cid}`;
```

### Old Environment Variables (Removed)
```env
QUICKNODE_IPFS_URL=https://...
```

### New Environment Variables (Required)
```env
QUICKNODE_IPFS_API_KEY=your-api-key
```

## 📚 Key Improvements

1. **Standard REST API**: Uses QuickNode's official REST API endpoint
2. **Authentication**: Uses `x-api-key` header for authentication
3. **Better Error Handling**: Includes detailed error messages and response logging
4. **Gateway URLs**: Automatically generates gateway URLs for uploaded content
5. **MIME Type Detection**: Automatic content-type detection based on file extension
6. **CID Extraction**: Properly extracts CID from QuickNode response format

## 🚀 Next Steps

1. **Get API Key**: Visit [QuickNode Dashboard](https://dashboard.quicknode.com/)
2. **Create `.env` file**: Copy `.env.example` and add your API key
3. **Restart Server**: `npm run start:dev`
4. **Test Upload**: Use the admin endpoints to test IPFS uploads

## 📝 Testing Commands

### Test Collection Creation with Image
```bash
curl -X POST http://localhost:3000/nft-admin/collection \
  -H "Content-Type: multipart/form-data" \
  -F "adminPublicKey=YOUR_PUBLIC_KEY" \
  -F "name=TEST_COLLECTION" \
  -F "symbol=TEST" \
  -F "royalty=5" \
  -F "description=Test collection" \
  -F "image=@/path/to/image.png"
```

### Test NFT Type Creation with Images
```bash
curl -X POST http://localhost:3000/nft-admin/type \
  -H "Content-Type: multipart/form-data" \
  -F "adminPublicKey=YOUR_PUBLIC_KEY" \
  -F "collectionName=TEST_COLLECTION" \
  -F "name=Test NFT" \
  -F "price=0.5" \
  -F "maxSupply=1000" \
  -F "description=Test NFT description" \
  -F "mainImage=@/path/to/main.png" \
  -F "additionalImages=@/path/to/extra1.png" \
  -F "additionalImages=@/path/to/extra2.png"
```

## 🔗 Resources

- **QuickNode IPFS Docs**: https://www.quicknode.com/docs/ipfs
- **QuickNode Dashboard**: https://dashboard.quicknode.com/
- **IPFS Gateway**: https://gateway.quicknode.com/ipfs/

## 📊 Expected Response Format

### Successful Upload
```json
{
  "success": true,
  "data": {
    "collection": { ... },
    "metadata": { ... },
    "metadataUri": "ipfs://Qm...",
    "message": "Collection created successfully..."
  }
}
```

### Console Logs
```
Uploading metadata to QuickNode IPFS: {...}
✅ Uploaded metadata to IPFS: ipfs://Qm...
   Gateway URL: https://gateway.quicknode.com/ipfs/Qm...
```

## ⚠️ Important Notes

1. **API Key Required**: The service will throw an error if `QUICKNODE_IPFS_API_KEY` is not set
2. **FormData Format**: All uploads use `multipart/form-data` with `Body` field
3. **CID Format**: QuickNode returns CID in `result.pin.cid` or `result.cid`
4. **Gateway Access**: Content is accessible via `https://gateway.quicknode.com/ipfs/<CID>`

## 🐛 Troubleshooting

If uploads fail:
1. Check API key is valid in `.env`
2. Verify API key has IPFS permissions in QuickNode dashboard
3. Check file size limits (QuickNode may have limits)
4. Review console logs for detailed error messages
5. Ensure `form-data` package is installed (`npm list form-data`)

---

**Migration Date**: 2025-10-18  
**QuickNode API Version**: REST API v1  
**Documentation Reference**: https://www.quicknode.com/docs/ipfs

