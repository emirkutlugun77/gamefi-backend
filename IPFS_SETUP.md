# QuickNode IPFS Setup Guide

This project uses QuickNode's IPFS REST API for decentralized file storage.

## Setup Instructions

### 1. Get QuickNode API Key

1. Go to [QuickNode Dashboard](https://dashboard.quicknode.com/)
2. Sign in or create an account
3. Navigate to IPFS section
4. Generate a new API key

### 2. Configure Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Then update the following values in `.env`:

```env
# QuickNode IPFS Configuration
QUICKNODE_IPFS_API_KEY=your-actual-api-key-here
```

### 3. API Endpoints Used

The service uses the following QuickNode IPFS REST API endpoints:

- **S3 Put-Object Endpoint**: `https://api.quicknode.com/ipfs/rest/v1/s3/put-object`
  - Method: POST
  - Headers: `x-api-key: <your-api-key>`
  - Body: FormData with 3 required fields:
    - `Body`: File buffer/content
    - `Key`: Unique file name/key
    - `ContentType`: MIME type
  - Response: `{ requestid: "Qm..." }` (requestid is the CID)

### 4. Usage in Code

The IPFS upload service is implemented in `src/nft/nft-admin.service.ts`:

#### Upload JSON Metadata
```typescript
const ipfsUri = await this.uploadToIPFS(metadata);
// Returns: ipfs://Qm...
```

#### Upload File
```typescript
const ipfsUri = await this.uploadFileToIPFS(fileBuffer, filename);
// Returns: ipfs://Qm...
```

### 5. Gateway URLs

QuickNode provides a gateway to access IPFS content:

- Gateway: `https://gateway.quicknode.com/ipfs/<CID>`
- IPFS URI format: `ipfs://<CID>`

### 6. Testing

You can test the IPFS upload using the admin endpoints:

```bash
# Create collection with image upload
curl -X POST http://localhost:3000/nft-admin/collection \
  -H "Content-Type: multipart/form-data" \
  -F "adminPublicKey=YOUR_PUBLIC_KEY" \
  -F "name=TEST_COLLECTION" \
  -F "symbol=TEST" \
  -F "royalty=5" \
  -F "description=Test collection" \
  -F "image=@/path/to/image.png"
```

### 7. Documentation

For more information, refer to:
- [QuickNode IPFS Documentation](https://www.quicknode.com/docs/ipfs)
- [QuickNode REST API](https://www.quicknode.com/docs/ipfs/getting-started)

## Features

✅ Upload JSON metadata to IPFS  
✅ Upload image files to IPFS  
✅ Support for multiple file formats (PNG, JPEG, GIF, WebP, SVG)  
✅ Automatic MIME type detection  
✅ Gateway URL generation  
✅ Error handling and logging  

## Manual Testing with cURL

You can test the QuickNode IPFS API directly with cURL:

```bash
curl --location 'https://api.quicknode.com/ipfs/rest/v1/s3/put-object' \
  --header 'x-api-key: YOUR_API_KEY' \
  --form 'Body=@"/path/to/your/file.png"' \
  --form 'Key="test_file.png"' \
  --form 'ContentType="image/png"'
```

Expected response:
```json
{
  "requestid": "QmXxxx...",
  "status": "pinned"
}
```

## Troubleshooting

### Error: "QUICKNODE_IPFS_API_KEY is not configured"
- Make sure you've created the `.env` file
- Check that `QUICKNODE_IPFS_API_KEY` is set correctly
- Restart the server after changing `.env`

### Error: "Multipart: Unexpected end of form"
- Ensure you're sending all 3 required fields: `Body`, `Key`, `ContentType`
- Check that `Body` contains the actual file buffer
- Verify `Key` is a string (unique filename)
- Verify `ContentType` matches the file type

### Error: "IPFS upload failed"
- Verify your API key is valid
- Check QuickNode dashboard for API usage limits
- Ensure the file size is within QuickNode limits

### Error: "Failed to get CID from IPFS upload response"
- Check the API response format in logs (`console.log('QuickNode IPFS response:', result)`)
- The CID should be in `result.requestid` field
- Verify QuickNode API hasn't changed response structure
- Contact QuickNode support if issue persists

