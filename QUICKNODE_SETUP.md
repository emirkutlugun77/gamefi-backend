# QuickNode RPC Setup Guide

## ⚠️ Problem: Jito Bundler Error

If you're seeing this error:
```
code: -32004
message: "Transaction must write lock at least one tip account"
```

This means you're using a **Jito bundler endpoint** when you should use a **regular RPC endpoint**.

## 🔧 Solution: Use QuickNode

QuickNode provides reliable RPC endpoints without Jito bundler requirements.

### 1. Get QuickNode Endpoint

1. Sign up at https://www.quicknode.com
2. Create a new endpoint
3. Select **Solana Devnet** (or Mainnet for production)
4. Copy your HTTP Provider URL

It will look like:
```
https://fluent-patient-needle.solana-devnet.quiknode.pro/abc123def456/
```

### 2. Update Backend `.env`

Create or update `/marketplace-backend/.env`:

```bash
# QuickNode RPC (NO Jito bundler)
SOLANA_RPC_URL=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-API-KEY/

# QuickNode for DAS API (NFT queries)
QUICKNODE_ENDPOINT=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-API-KEY/

# Other settings
MARKETPLACE_PROGRAM_ID=6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm
STAKE_POOL_ADDRESS=EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH
REWARD_VAULT_ADDRESS=9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg
REWARD_TOKEN_MINT=Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc
```

### 3. Restart Backend

```bash
cd marketplace-backend
npm run start:dev
```

## 🎯 Why QuickNode?

### Regular Solana RPC (❌ May Have Issues)
- Rate limited
- Can be slow
- May timeout
- Unreliable for production

### QuickNode (✅ Recommended)
- No rate limits (with paid plan)
- Fast and reliable
- 99.9% uptime
- DAS API support (for NFTs)
- No Jito bundler conflicts

## 🔍 How to Verify

After updating `.env` and restarting backend:

```bash
# Test presale initialization
curl -X POST http://localhost:3001/presale/prepare-initialize \
  -H "Content-Type: application/json" \
  -d '{"adminWallet":"EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr"}'

# Should return:
# {
#   "success": true,
#   "transaction": "base64..."
# }

# NO MORE "tip account" errors! ✅
```

## 🌐 QuickNode Alternatives

If you don't have QuickNode, you can also use:

### Helius
```bash
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR-API-KEY
```

### Alchemy (Solana)
```bash
SOLANA_RPC_URL=https://solana-devnet.g.alchemy.com/v2/YOUR-API-KEY
```

### GenesysGo (Mainnet only)
```bash
SOLANA_RPC_URL=https://devnet.genesysgo.net/
```

## 🚨 Important Notes

### DO NOT Use:
- ❌ Jito bundler endpoints
- ❌ `https://jito-mainnet.rpc...`
- ❌ `https://block-engine...`

### DO Use:
- ✅ QuickNode HTTP Provider
- ✅ Helius RPC
- ✅ Alchemy Solana API
- ✅ Standard Solana RPC (for testing only)

## 🔧 Configuration Locations

The RPC URL is used in these files:

1. `src/staking/staking.service.ts` - Line 43
2. `src/presale/presale.service.ts` - Line 40
3. `src/nft/solana-contract.service.ts` - Line 37
4. `src/nft/nft.service.ts` - Line 87, 90
5. `src/nft/nft-admin.service.ts` - Line 46
6. `src/nft/nft.controller.ts` - Line 41

All read from `process.env.SOLANA_RPC_URL` ✅

## 🎯 Expected Behavior After Fix

### Before (❌)
```
Presale initialization → Jito Error
code: -32004
message: "Transaction must write lock at least one tip account"
```

### After (✅)
```
Presale initialization → Transaction prepared
Phantom opens → Clear transaction details
User approves → Transaction confirmed
No errors! ✅
```

## 📝 Quick Setup Checklist

- [ ] Sign up for QuickNode
- [ ] Create Solana Devnet endpoint
- [ ] Copy HTTP Provider URL
- [ ] Update `.env` file
- [ ] Restart backend
- [ ] Test transaction preparation
- [ ] Verify in Phantom (no warnings)

## 💡 Pro Tips

1. **Use QuickNode's DAS API**: Great for fetching NFTs
2. **Enable Add-ons**: Enable DAS API in QuickNode dashboard
3. **Monitor Usage**: Check QuickNode dashboard for request stats
4. **Set Alerts**: Get notified if approaching rate limits

## 🔗 Useful Links

- QuickNode: https://www.quicknode.com
- QuickNode Docs: https://www.quicknode.com/docs/solana
- Solana RPC API: https://docs.solana.com/api/http

---

**Last Updated**: November 15, 2025  
**Issue**: Jito bundler conflict  
**Solution**: Use QuickNode RPC  
**Status**: Configuration required

