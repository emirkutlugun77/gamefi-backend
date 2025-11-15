# NFT Marketplace & Staking Deployment Info

## 🚀 Deployed Smart Contract (Devnet)

### Contract Addresses
- **Program ID**: `6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm`
- **Deployer**: `EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr`
- **Network**: Devnet
- **RPC**: `https://api.devnet.solana.com`

### Deployment Transaction
- **TX**: `2ySM7ZenuHNKvzcEetVmRqLibuLW6JvUYx2YXMztRDMESrZ5rK8H5VaDCmkygBd2K9RZuqZcxRcRfH93j5bDqa4r`
- **Explorer**: https://solscan.io/tx/2ySM7ZenuHNKvzcEetVmRqLibuLW6JvUYx2YXMztRDMESrZ5rK8H5VaDCmkygBd2K9RZuqZcxRcRfH93j5bDqa4r?cluster=devnet

## 🎯 Staking Pool

### Addresses
- **Stake Pool PDA**: `EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH`
- **Reward Vault**: `9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg`
- **Reward Token Mint**: `Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc`

### Initialization Transaction
- **TX**: `2GDsw7hKq8NL8cb4YeNBBbbPogbe6DzD5gpnW8eNqrGkbbwb44KajdqZyddPGgTDj7Givs9YKUtMcFu3t5Lnrjo`
- **Explorer**: https://solscan.io/tx/2GDsw7hKq8NL8cb4YeNBBbbPogbe6DzD5gpnW8eNqrGkbbwb44KajdqZyddPGgTDj7Givs9YKUtMcFu3t5Lnrjo?cluster=devnet

### Reward Configuration
- **Base Rate**: 1 token per hour (277,777 smallest units per second)
- **Formula**: `actual_rewards = base_rate × stake_multiplier / 10000`

#### Example Multipliers
- 10000 (1x) = 1 token/hour
- 20000 (2x) = 2 tokens/hour
- 50000 (5x) = 5 tokens/hour

## 🔧 Backend Configuration

Update your `.env` file with:

```bash
MARKETPLACE_PROGRAM_ID=6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm
STAKE_POOL_ADDRESS=EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH
REWARD_VAULT_ADDRESS=9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg
REWARD_TOKEN_MINT=Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc
SOLANA_RPC_URL=https://api.devnet.solana.com
```

## 📝 Next Steps

### 1. Fund Reward Vault
The reward vault needs to be funded with tokens so users can claim their staking rewards.

```bash
# Transfer tokens to: 9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg
# OR use backend API:
POST http://localhost:3000/staking/fund-reward-vault
{
  "adminPrivateKey": "YOUR_ADMIN_PRIVATE_KEY",
  "amountTokens": 1000000000000
}
```

### 2. Initialize Marketplace (if not done)
```typescript
// Call initialize_marketplace instruction
await program.methods
  .initializeMarketplace(feeBps)
  .accounts({ ... })
  .rpc();
```

### 3. Create NFT Collections & Types
Each NFT type should have a `stake_multiplier` set:
- Common: 10000 (1x)
- Rare: 20000 (2x)
- Epic: 30000 (3x)
- Legendary: 50000 (5x)

## 🔗 Useful Links

### Devnet Explorer
- **Program**: https://solscan.io/account/6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm?cluster=devnet
- **Deployer**: https://solscan.io/account/EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr?cluster=devnet
- **Stake Pool**: https://solscan.io/account/EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH?cluster=devnet
- **Reward Vault**: https://solscan.io/account/9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg?cluster=devnet

### API Endpoints
- Swagger Docs: http://localhost:3000/api
- Get Pool Info: `GET /staking/pool`
- Get Staked NFTs: `GET /staking/nfts?owner=<wallet>`
- Calculate Rewards: `GET /staking/pending-rewards?nftMint=<mint>&staker=<wallet>`

## ⚠️ Security Notes

1. **Never expose private keys** in frontend or public repositories
2. **Deployer key** (`25MFL6zATB3qGXTGWva9Du6ume76kSyYtFCt5JAY6ifqPDGq5dAQ5k2kM9XaEqF8doD4WsgsxmXdsGxgzJC67puE`) is the upgrade authority
3. **Keep this key secure** - it can upgrade the program
4. For production, use a multisig wallet as upgrade authority

## 📊 Monitoring

### Check Deployment
```bash
solana program show 6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm --url devnet
```

### Check Pool Status
```bash
curl http://localhost:3000/staking/pool
```

### Check Deployer Balance
```bash
solana balance EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr --url devnet
```

---

**Deployed**: November 15, 2025  
**Status**: ✅ Active on Devnet  
**Version**: 1.0.0

