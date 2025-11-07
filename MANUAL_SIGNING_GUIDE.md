# Manuel Transaction İmzalama - Kullanım Kılavuzu

## Değişiklikler

✅ JWT auth **komple kaldırıldı**
✅ Artık **unsigned transaction** döndürülüyor
✅ Sen **manuel olarak imzalayıp** göndereceksin
✅ Anchor IDL kullanılarak **doğru instruction** oluşturuluyor

## Nasıl Kullanılır?

### Adım 1: Metadata Yükle (IPFS)

#### Endpoint
```
POST /nft-admin/collection
```

#### Body (Form Data)
```
adminPublicKey: 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw
name: VYBE_TEST_COLLECTION
symbol: VTEST
royalty: 5
description: Test collection
image: [dosya]
```

#### Response
```json
{
  "success": true,
  "data": {
    "metadataUri": "ipfs://QmXxx...",
    "imageUri": "ipfs://QmYyy...",
    "metadata": {...},
    "message": "Metadata uploaded to IPFS successfully!"
  }
}
```

### Adım 2: Transaction Oluştur

#### Collection Mint Keypair Oluştur

```bash
# Yeni keypair oluştur
solana-keygen new --outfile collection-mint.json --no-bip39-passphrase

# Public key'i al
solana-keygen pubkey collection-mint.json
# Output: Cv7jep4QNY4Z7TQqodb1Rwa9S3eLLxpohgzPk1TqR9Ss
```

#### Endpoint
```
POST /nft-admin/collection/create-transaction
```

#### Body (JSON)
```json
{
  "adminPublicKey": "8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw",
  "collectionMint": "Cv7jep4QNY4Z7TQqodb1Rwa9S3eLLxpohgzPk1TqR9Ss",
  "name": "VYBE_TEST_COLLECTION",
  "symbol": "VTEST",
  "metadataUri": "ipfs://QmXxx...",
  "royalty": 5
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "transaction": "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDBg...",
    "collectionPda": "9Aqrcm9Q4iEXoLZvcuYqj27D4VSUYkgnSMKF1YqriB8f",
    "collectionMint": "Cv7jep4QNY4Z7TQqodb1Rwa9S3eLLxpohgzPk1TqR9Ss",
    "message": "Unsigned transaction created. Sign with your wallet..."
  }
}
```

### Adım 3: Manuel İmzalama ve Gönderme

#### Node.js ile

```javascript
const {
  Transaction,
  Keypair,
  Connection,
  sendAndConfirmTransaction
} = require('@solana/web3.js');
const fs = require('fs');

async function signAndSend() {
  // 1. Transaction'ı decode et
  const base64Tx = "AQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAEDBg...";
  const txBuffer = Buffer.from(base64Tx, 'base64');
  const transaction = Transaction.from(txBuffer);

  // 2. Keypair'leri yükle
  const adminKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync('./admin-wallet.json', 'utf-8')))
  );

  const collectionMintKeypair = Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync('./collection-mint.json', 'utf-8')))
  );

  // 3. İmzala (her iki keypair ile)
  transaction.partialSign(adminKeypair);
  transaction.partialSign(collectionMintKeypair);

  // 4. Gönder
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [adminKeypair, collectionMintKeypair]
  );

  console.log('✅ Transaction successful!');
  console.log('Signature:', signature);
  console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
}

signAndSend();
```

#### Python ile

```python
from solders.keypair import Keypair
from solders.transaction import Transaction
from solana.rpc.api import Client
import base64
import json

# 1. Transaction'ı decode et
base64_tx = "AQAAAAAAAAAA..."
tx_bytes = base64.b64decode(base64_tx)
transaction = Transaction.from_bytes(tx_bytes)

# 2. Keypair'leri yükle
with open('./admin-wallet.json') as f:
    admin_keypair = Keypair.from_bytes(json.load(f))

with open('./collection-mint.json') as f:
    collection_mint_keypair = Keypair.from_bytes(json.load(f))

# 3. İmzala
transaction.sign([admin_keypair, collection_mint_keypair])

# 4. Gönder
client = Client("https://api.devnet.solana.com")
result = client.send_transaction(transaction)
print(f"✅ Signature: {result.value}")
```

#### CLI ile (En Kolay)

```bash
# Transaction'ı dosyaya kaydet
echo "AQAAAAAAAAAA..." > unsigned-tx.txt

# Base64'ü binary'ye çevir
base64 -d unsigned-tx.txt > tx.bin

# İmzala ve gönder
solana transaction sign-and-send \
  tx.bin \
  --keypair ./admin-wallet.json \
  --keypair ./collection-mint.json \
  --url devnet
```

## Swagger UI ile Test

### 1. Sunucuyu Başlat
```bash
npm run start:dev
```

### 2. Metadata Yükle

1. http://localhost:3001/api aç
2. **nft-admin** → **POST /nft-admin/collection**
3. Form'u doldur
4. Execute
5. `metadataUri`'yi kopyala

### 3. Transaction Oluştur

1. Collection mint keypair oluştur:
```bash
solana-keygen new --outfile collection-mint.json --no-bip39-passphrase
solana-keygen pubkey collection-mint.json
```

2. **nft-admin** → **POST /nft-admin/collection/create-transaction**
3. JSON'u doldur:
```json
{
  "adminPublicKey": "8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw",
  "collectionMint": "COLLECTION_MINT_PUBLIC_KEY",
  "name": "VYBE_TEST_COLLECTION",
  "symbol": "VTEST",
  "metadataUri": "ipfs://QmXxx...",
  "royalty": 5
}
```
4. Execute
5. `transaction` değerini kopyala

### 4. İmzala ve Gönder

```javascript
// sign-and-send.js
const { Transaction, Keypair, Connection, sendAndConfirmTransaction } = require('@solana/web3.js');
const fs = require('fs');

const base64Tx = "BURAYA_TRANSACTION_YAPIŞTIR";
const txBuffer = Buffer.from(base64Tx, 'base64');
const transaction = Transaction.from(txBuffer);

const adminKeypair = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync('./admin-wallet.json', 'utf-8')))
);

const collectionMintKeypair = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync('./collection-mint.json', 'utf-8')))
);

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

sendAndConfirmTransaction(connection, transaction, [adminKeypair, collectionMintKeypair])
  .then(sig => {
    console.log('✅ Success!');
    console.log('Signature:', sig);
    console.log('Explorer:', `https://explorer.solana.com/tx/${sig}?cluster=devnet`);
  })
  .catch(err => console.error('❌ Error:', err));
```

```bash
node sign-and-send.js
```

## Anchor IDL Kullanımı

Backend artık Anchor IDL kullanarak doğru instruction oluşturuyor:

- ✅ Doğru instruction discriminator
- ✅ Doğru account sıralaması
- ✅ Doğru data serialization
- ✅ Metaplex metadata entegrasyonu

## Neden Manuel İmzalama?

1. **Güvenlik**: Private key asla backend'e gönderilmiyor
2. **Şeffaflık**: Transaction'ı imzalamadan önce inceleyebilirsin
3. **Kontrol**: Tam kontrol sende
4. **Hardware Wallet**: Ledger gibi cihazlarla uyumlu

## Hata Durumları

### "Invalid admin public key"
**Sebep**: Public key formatı yanlış

**Çözüm**: Geçerli base58 public key kullan

### "Failed to create collection transaction"
**Sebep**: Çeşitli nedenler

**Çözüm**: Console loglarını kontrol et

### Transaction imzalama hatası
**Sebep**: Keypair'ler eksik veya yanlış

**Çözüm**:
- Admin keypair doğru mu?
- Collection mint keypair oluşturdun mu?
- Her iki keypair ile de imzaladın mı?

## Faydalı Komutlar

### Keypair Oluşturma
```bash
# Admin wallet (varsa kullan)
solana-keygen pubkey ~/.config/solana/id.json

# Collection mint (her koleksiyon için yeni)
solana-keygen new --outfile collection-mint.json --no-bip39-passphrase
```

### Balance Kontrol
```bash
solana balance 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw --url devnet
```

### Airdrop (Devnet)
```bash
solana airdrop 2 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw --url devnet
```

### Transaction Doğrulama
```bash
solana confirm {SIGNATURE} --url devnet
```

## Özet - 4 Adım

1. ✅ **Metadata Yükle**: `POST /nft-admin/collection` → IPFS URI al
2. ✅ **Mint Oluştur**: `solana-keygen new` → Collection mint keypair
3. ✅ **Transaction Al**: `POST /nft-admin/collection/create-transaction` → Base64 transaction
4. ✅ **İmzala & Gönder**: Node.js/Python/CLI ile imzala ve Solana'ya gönder

Başarılar! 🚀
