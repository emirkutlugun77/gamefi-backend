# Presale API Guide

## 🎯 Overview

The presale system allows admin to create a presale campaign with a time limit and SOL target. All transactions are prepared by the backend and signed with the user's wallet - **NO PRIVATE KEYS NEEDED**.

## 📋 API Endpoints

### 1. Get Presale Info

```http
GET /presale/info
```

**Response:**
```json
{
  "publicKey": "...",
  "admin": "EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr",
  "startTs": 1700000000,
  "endTs": 1700086400,
  "totalRaised": 123456789,
  "totalRaisedSol": "0.12",
  "targetLamports": 845000000000,
  "targetSol": "845",
  "isActive": true,
  "timeRemaining": 86400,
  "progress": 0.15
}
```

### 2. Prepare Initialize Presale Transaction

```http
POST /presale/prepare-initialize
Content-Type: application/json

{
  "adminWallet": "EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>",
  "presalePda": "..."
}
```

**What it does:**
- Creates presale PDA
- Sets 1-day timer
- Sets 845 SOL target
- Sets admin as owner

### 3. Prepare Contribute Transaction

```http
POST /presale/prepare-contribute
Content-Type: application/json

{
  "contributorWallet": "...",
  "amountSol": 1.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>",
  "contributionPda": "..."
}
```

**What it does:**
- Transfers SOL from contributor to presale escrow
- Creates/updates contribution record
- Updates total raised amount

### 4. Prepare End Presale Transaction

```http
POST /presale/prepare-end
Content-Type: application/json

{
  "adminWallet": "EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>"
}
```

**What it does:**
- Ends the presale
- Withdraws all funds to admin
- Marks presale as inactive

### 5. Prepare Restart Presale Transaction

```http
POST /presale/prepare-restart
Content-Type: application/json

{
  "adminWallet": "EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>"
}
```

**What it does:**
- Resets presale
- Starts new 1-day timer
- Resets total raised to 0

### 6. Get Contribution Info

```http
GET /presale/contribution?wallet=<wallet_address>
```

**Response:**
```json
{
  "success": true,
  "contribution": {
    "publicKey": "...",
    "presale": "...",
    "contributor": "...",
    "amount": 1500000000,
    "amountSol": "1.50"
  }
}
```

Or if no contribution:
```json
{
  "success": true,
  "contribution": null,
  "message": "No contribution found for this wallet"
}
```

## 🚀 Frontend Integration

### Using the Hook

```typescript
import { usePresale } from '@/lib/hooks/usePresale'

const {
  presaleInfo,
  loading,
  error,
  fetchPresaleInfo,
  initializePresale,
  contributePresale,
  endPresale,
  restartPresale,
} = usePresale()
```

### Example: Initialize Presale

```typescript
const handleInit = async () => {
  const result = await initializePresale()
  
  if (result.success) {
    console.log('Presale initialized!', result.signature)
  } else {
    console.error('Error:', result.error)
  }
}
```

### Example: Contribute to Presale

```typescript
const handleContribute = async (amount: number) => {
  const result = await contributePresale(amount)
  
  if (result.success) {
    console.log('Contribution successful!', result.signature)
  } else {
    console.error('Error:', result.error)
  }
}
```

### Example: End Presale

```typescript
const handleEnd = async () => {
  const result = await endPresale()
  
  if (result.success) {
    console.log('Presale ended!', result.signature)
  } else {
    console.error('Error:', result.error)
  }
}
```

## 🔐 Security Improvements

### Before (❌ Insecure):
- Required private key input
- Private key sent to backend
- Security risk if intercepted

### After (✅ Secure):
- NO private keys needed
- Backend prepares unsigned transaction
- User signs with wallet (private key never leaves device)
- Phantom shows clear transaction details
- No "Ana ağda geçerli olan bir işlem bulundu" warning

## 🎨 Admin UI Updates

### Removed:
- ❌ Private key login modal
- ❌ Login/logout buttons
- ❌ JWT token storage
- ❌ "isLoggedIn" state

### Kept:
- ✅ Wallet connection check
- ✅ Admin pubkey verification
- ✅ Transaction signing with wallet

## 📊 Transaction Flow

```
1. User clicks "Initialize Presale" button
   ↓
2. Frontend calls: POST /presale/prepare-initialize
   ↓
3. Backend prepares unsigned transaction
   ↓
4. Frontend receives base64 transaction
   ↓
5. Wallet prompts user to sign
   ↓
6. User reviews & approves in Phantom
   ↓
7. Frontend sends signed transaction to blockchain
   ↓
8. Transaction confirmed
   ↓
9. Presale info refreshes automatically
```

## ⚙️ Configuration

### Contract Addresses
- **Program ID**: `6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm`
- **Admin**: `EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr`

### Presale Settings
- **Duration**: 1 day (86,400 seconds)
- **Target**: 845 SOL
- **Network**: Devnet

## 🧪 Testing

### 1. Initialize Presale
```bash
# Admin connects wallet
# Clicks "Initialize Presale"
# Signs transaction in Phantom
# ✅ Presale created
```

### 2. Contribute
```bash
# Any user connects wallet
# Enters SOL amount
# Signs transaction
# ✅ Contribution recorded
```

### 3. End Presale
```bash
# Admin connects wallet
# Clicks "End Presale"
# Signs transaction
# ✅ Funds withdrawn to admin
```

## 🔗 Related Documentation

- Smart Contract: `/marketplacemetaplex/programs/marketplace/src/lib.rs`
- Frontend Hook: `/site-son/lib/hooks/usePresale.ts`
- Admin Page: `/site-son/app/app/admin/page.tsx`

---

**Last Updated**: November 15, 2025  
**Status**: ✅ Wallet-only authentication (No private keys!)  
**Version**: 2.0.0

