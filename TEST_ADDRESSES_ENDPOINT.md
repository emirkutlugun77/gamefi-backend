# Contract Addresses Endpoint Test

## 📍 Endpoint

```
GET http://localhost:3000/staking/addresses
```

## 📦 Response Example

```json
{
  "success": true,
  "network": "devnet",
  "rpcUrl": "https://api.devnet.solana.com",
  "addresses": {
    "programId": "6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm",
    "stakePoolPda": "EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH",
    "rewardVaultPda": "9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg",
    "rewardTokenMint": "Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc"
  },
  "explorer": {
    "program": "https://solscan.io/account/6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm?cluster=devnet",
    "stakePool": "https://solscan.io/account/EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH?cluster=devnet",
    "rewardVault": "https://solscan.io/account/9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg?cluster=devnet",
    "rewardToken": "https://solscan.io/account/Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc?cluster=devnet"
  },
  "deployment": {
    "programId": "6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm",
    "deployer": "EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr",
    "deploymentTx": "2ySM7ZenuHNKvzcEetVmRqLibuLW6JvUYx2YXMztRDMESrZ5rK8H5VaDCmkygBd2K9RZuqZcxRcRfH93j5bDqa4r",
    "stakingPoolInitTx": "2GDsw7hKq8NL8cb4YeNBBbbPogbe6DzD5gpnW8eNqrGkbbwb44KajdqZyddPGgTDj7Givs9YKUtMcFu3t5Lnrjo"
  },
  "rewardConfig": {
    "baseRatePerSecond": 277777,
    "tokensPerHour": 1,
    "formula": "actual_rewards = base_rate × stake_multiplier / 10000",
    "multiplierExamples": {
      "common": {
        "multiplier": 10000,
        "tokensPerHour": 1
      },
      "rare": {
        "multiplier": 20000,
        "tokensPerHour": 2
      },
      "epic": {
        "multiplier": 30000,
        "tokensPerHour": 3
      },
      "legendary": {
        "multiplier": 50000,
        "tokensPerHour": 5
      }
    }
  }
}
```

## 🧪 Test with curl

```bash
curl http://localhost:3000/staking/addresses
```

## 🧪 Test with fetch (JavaScript)

```javascript
const response = await fetch('http://localhost:3000/staking/addresses');
const data = await response.json();

console.log('Program ID:', data.addresses.programId);
console.log('Stake Pool:', data.addresses.stakePoolPda);
console.log('Reward Vault:', data.addresses.rewardVaultPda);
console.log('Reward Token:', data.addresses.rewardTokenMint);
```

## 💡 Usage in Frontend

```typescript
// config.ts
export async function getContractAddresses() {
  const response = await fetch(`${API_URL}/staking/addresses`);
  const data = await response.json();
  return data.addresses;
}

// Use in components
const addresses = await getContractAddresses();
const programId = new PublicKey(addresses.programId);
```

## 📋 Response Fields

### addresses
Contains all smart contract addresses that frontend needs to interact with.

### explorer
Direct links to Solscan explorer for each address.

### deployment
Historical deployment information including deployer address and transaction signatures.

### rewardConfig
Reward calculation configuration including base rate and example multipliers.

## 🔗 Related Endpoints

- `GET /staking/pool` - Get staking pool state
- `GET /staking/nfts?owner=<wallet>` - Get user's staked NFTs
- `POST /staking/prepare-stake` - Prepare stake transaction
- `POST /staking/prepare-unstake` - Prepare unstake transaction
- `POST /staking/prepare-claim` - Prepare claim rewards transaction

## 📖 Documentation

For more details, see:
- `DEPLOYMENT_INFO.md` - Full deployment information
- `NFT_STAKING_GUIDE.md` - Complete staking guide
- Swagger UI: http://localhost:3000/api

