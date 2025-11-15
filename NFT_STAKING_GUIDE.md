# NFT Staking System Guide

## 🎯 Overview

The NFT staking system allows users to stake their NFTs and earn hourly rewards based on the NFT type's `stake_multiplier`. The system is fully integrated with the blockchain and calculates rewards automatically based on time staked.

## 📋 Smart Contract Details

### Deployed Addresses (Devnet)
- **Program ID**: `ptcbSp1UEqYLmod2jgFxGPZnFMqBECcrRyU1fTmnJ5b`
- **Stake Pool PDA**: `ADJE4dPWQ8hWScUcrDeQ6bFNzYfXw2dMDJw5M8EhTKty`
- **Reward Vault PDA**: `Az4khWxYh9NWLJNoUXyC8aF8mHbPp1oxr2dRCHF24LwX`
- **Reward Token Mint**: `Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc` (Devnet VYBE Token)

### Reward Calculation
```
Base Rate: 1 token per hour = 277,777 smallest units per second
Actual Rewards = base_rate × stake_multiplier / 10000 × time_staked
```

**Example:**
- NFT with stake_multiplier = 10000 (1x) → 1 token/hour
- NFT with stake_multiplier = 20000 (2x) → 2 tokens/hour
- NFT with stake_multiplier = 50000 (5x) → 5 tokens/hour

## 🔧 Backend API Endpoints

### Public Endpoints

#### 1. Get Staking Pool Info
```http
GET /staking/pool
```

Response:
```json
{
  "publicKey": "ADJE4dPWQ8hWScUcrDeQ6bFNzYfXw2dMDJw5M8EhTKty",
  "admin": "8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw",
  "rewardTokenMint": "Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc",
  "rewardRatePerSecond": "277777",
  "totalStaked": "0",
  "rewardVault": "Az4khWxYh9NWLJNoUXyC8aF8mHbPp1oxr2dRCHF24LwX"
}
```

#### 2. Get Staked NFTs for User
```http
GET /staking/nfts?owner=<wallet_address>
```

Response:
```json
[
  {
    "publicKey": "...",
    "owner": "...",
    "nftMint": "...",
    "nftType": "...",
    "stakePool": "...",
    "stakeTimestamp": "1699876543",
    "lastClaimTimestamp": "1699876543",
    "stakeMultiplier": "10000"
  }
]
```

#### 3. Calculate Pending Rewards
```http
GET /staking/pending-rewards?nftMint=<nft_mint>&staker=<wallet_address>
```

Response:
```json
{
  "success": true,
  "nftMint": "...",
  "staker": "...",
  "pendingRewards": 1000000000,
  "pendingRewardsFormatted": "1.000000000",
  "stakeTimestamp": "1699876543",
  "lastClaimTimestamp": "1699876543",
  "stakeMultiplier": "10000",
  "timeSinceLastClaim": 3600
}
```

#### 4. Prepare Stake NFT Transaction
```http
POST /staking/prepare-stake
Content-Type: application/json

{
  "userWallet": "<wallet_address>",
  "nftMintAddress": "<nft_mint>",
  "collectionName": "VYBE",
  "typeName": "Barbarian"
}
```

Response:
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>",
  "stakeAccountPda": "..."
}
```

#### 5. Prepare Unstake NFT Transaction
```http
POST /staking/prepare-unstake
Content-Type: application/json

{
  "userWallet": "<wallet_address>",
  "nftMintAddress": "<nft_mint>"
}
```

Response:
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>"
}
```

#### 6. Prepare Claim Rewards Transaction
```http
POST /staking/prepare-claim
Content-Type: application/json

{
  "userWallet": "<wallet_address>",
  "nftMintAddress": "<nft_mint>"
}
```

Response:
```json
{
  "success": true,
  "message": "Transaction prepared. Please sign with your wallet.",
  "transaction": "<base64_encoded_transaction>"
}
```

### Admin Endpoints (Requires JWT Auth)

#### 7. Fund Reward Vault
```http
POST /staking/fund-reward-vault
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "adminPrivateKey": "<base58_private_key>",
  "amountTokens": 1000000000000
}
```

## 🚀 Frontend Integration

### 1. Install Dependencies
```bash
npm install @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-wallets
```

### 2. Example: Stake NFT
```typescript
import { Connection, Transaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';

const StakeNFT = ({ nftMint, collectionName, typeName }) => {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const handleStake = async () => {
    try {
      // 1. Prepare transaction from backend
      const response = await fetch('http://localhost:3000/staking/prepare-stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: publicKey.toString(),
          nftMintAddress: nftMint,
          collectionName: collectionName,
          typeName: typeName,
        }),
      });

      const { transaction: base64Tx } = await response.json();

      // 2. Deserialize transaction
      const transaction = Transaction.from(Buffer.from(base64Tx, 'base64'));

      // 3. Sign transaction with wallet
      const signedTx = await signTransaction(transaction);

      // 4. Send transaction
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // 5. Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('NFT staked successfully!', signature);
    } catch (error) {
      console.error('Error staking NFT:', error);
    }
  };

  return <button onClick={handleStake}>Stake NFT</button>;
};
```

### 3. Example: Display Pending Rewards
```typescript
const PendingRewards = ({ nftMint }) => {
  const { publicKey } = useWallet();
  const [rewards, setRewards] = useState(null);

  useEffect(() => {
    const fetchRewards = async () => {
      const response = await fetch(
        `http://localhost:3000/staking/pending-rewards?nftMint=${nftMint}&staker=${publicKey.toString()}`
      );
      const data = await response.json();
      setRewards(data);
    };

    fetchRewards();
    const interval = setInterval(fetchRewards, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [nftMint, publicKey]);

  return (
    <div>
      <h3>Pending Rewards</h3>
      <p>{rewards?.pendingRewardsFormatted} VYBE</p>
    </div>
  );
};
```

### 4. Example: Claim Rewards
```typescript
const ClaimRewards = ({ nftMint }) => {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  const handleClaim = async () => {
    try {
      // Prepare claim transaction
      const response = await fetch('http://localhost:3000/staking/prepare-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userWallet: publicKey.toString(),
          nftMintAddress: nftMint,
        }),
      });

      const { transaction: base64Tx } = await response.json();
      const transaction = Transaction.from(Buffer.from(base64Tx, 'base64'));
      const signedTx = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Rewards claimed successfully!', signature);
    } catch (error) {
      console.error('Error claiming rewards:', error);
    }
  };

  return <button onClick={handleClaim}>Claim Rewards</button>;
};
```

## ⚙️ NFT Type Configuration

When creating NFT types, set the `stake_multiplier` field to define hourly rewards:

```typescript
// Example: Create NFT type with 2x rewards (2 tokens/hour)
const stake_multiplier = 20000; // 20000 / 10000 = 2x

await createNftType({
  type_name: "Elite Barbarian",
  uri: "https://...",
  price: 1000000000, // 1 SOL
  max_supply: 100,
  stake_multiplier: 20000 // 2 tokens per hour
});
```

### Recommended Multipliers
- Common NFTs: 10000 (1x = 1 token/hour)
- Rare NFTs: 20000 (2x = 2 tokens/hour)
- Epic NFTs: 30000 (3x = 3 tokens/hour)
- Legendary NFTs: 50000 (5x = 5 tokens/hour)

## 🔐 Security Notes

1. **Never expose private keys** in frontend code
2. **Always use wallet adapters** for signing transactions
3. **Validate all inputs** before sending to backend
4. **Confirm transactions** before showing success messages
5. **Handle errors gracefully** and show user-friendly messages

## 🧪 Testing

### Test Stake Flow
1. User connects wallet
2. User selects NFT to stake
3. Frontend calls `/staking/prepare-stake`
4. User signs transaction with wallet
5. Transaction confirmed on blockchain
6. NFT appears in `/staking/nfts` for user

### Test Reward Calculation
1. Stake an NFT
2. Wait 1 hour
3. Check `/staking/pending-rewards`
4. Should show rewards based on multiplier
5. Claim or unstake to receive rewards

## 📊 Monitoring

### Check Pool Status
```bash
curl http://localhost:3000/staking/pool
```

### Check User Stakes
```bash
curl "http://localhost:3000/staking/nfts?owner=<wallet>"
```

### Calculate Rewards
```bash
curl "http://localhost:3000/staking/pending-rewards?nftMint=<mint>&staker=<wallet>"
```

## 🐛 Common Issues

### Issue: "Account not found"
- **Cause**: Staking pool not initialized or NFT not staked
- **Solution**: Initialize pool first or check NFT is staked

### Issue: "Insufficient funds"
- **Cause**: Reward vault doesn't have enough tokens
- **Solution**: Fund vault using `/staking/fund-reward-vault`

### Issue: "Invalid NFT type"
- **Cause**: NFT type PDA doesn't exist or wrong collection/type name
- **Solution**: Verify collection and type names match exactly

## 🎓 Advanced: Direct On-Chain Interaction

If you prefer to interact with the smart contract directly:

```typescript
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import IDL from './nft_marketplace_idl.json';

const programId = new PublicKey('ptcbSp1UEqYLmod2jgFxGPZnFMqBECcrRyU1fTmnJ5b');
const program = new Program(IDL, provider);

// Stake NFT
await program.methods
  .stakeNft()
  .accounts({
    stakePool: STAKE_POOL_PDA,
    stakeAccount: stakeAccountPda,
    collection: collectionPda,
    nftType: nftTypePda,
    nftMint: nftMint,
    nftMetadata: nftMetadataPda,
    stakerNftTokenAccount: stakerNftTokenAccount,
    vaultNftTokenAccount: vaultNftTokenAccount,
    staker: wallet.publicKey,
    systemProgram: SystemProgram.programId,
    tokenProgram: TOKEN_PROGRAM_ID,
    tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY,
  })
  .rpc();
```

## 📞 Support

For issues or questions, check:
1. This guide first
2. Backend logs for detailed error messages
3. Solana Explorer for transaction details
4. Contact dev team if problem persists

---

**Last Updated**: November 15, 2025
**Version**: 1.0.0

