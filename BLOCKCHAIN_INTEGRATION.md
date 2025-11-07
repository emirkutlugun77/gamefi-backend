# Blockchain Integration Guide - Türkçe

## Yapılan Değişiklikler

Backend artık NFT koleksiyonlarını sadece IPFS'e değil, **Solana blockchain'e de** oluşturuyor!

### Yeni Özellikler

1. ✅ **Blockchain Entegrasyonu**: Koleksiyonlar artık gerçekten blockchain'de oluşturuluyor
2. ✅ **Private Key Auth**: Admin wallet private key ile işlem imzalama
3. ✅ **Akıllı Dosya Adlandırma**: IPFS dosyaları koleksiyon/NFT ismiyle isimlen dirilir
4. ✅ **Transaction Tracking**: Solana Explorer linki ile işlem takibi

## API Kullanımı

### 1. Collection Oluşturma

#### Endpoint
```
POST /nft-admin/collection
```

#### Headers
```
Authorization: [123,45,67,...,189]  // Wallet private key (JSON array olarak)
Content-Type: multipart/form-data
```

#### Body (Form Data)
- `admin PublicKey`: Cüzdan public key (string)
- `name`: Koleksiyon adı (string, örn: "VYBE_BUILDINGS")
- `symbol`: Sembol (string, örn: "VYBEB")
- `royalty`: Royalty oranı (number, örn: 5)
- `description`: Açıklama (string)
- `image`: Koleksiyon resmi (file)

#### Private Key Nasıl Alınır?

**Phantom Wallet**:
1. Phantom'u aç
2. Settings → Show Secret Recovery Phrase
3. Solana CLI ile import et:
```bash
solana-keygen recover 'prompt:?key=0/0' -o keypair.json
cat keypair.json
# Çıktı: [123,45,67,...,189]
```

**Solflare Wallet**:
1. Solflare'i aç
2. Settings → Export Private Key
3. Private key byte array'ini kopyala

**Yeni Wallet Oluştur** (Test için):
```bash
solana-keygen new --outfile test-wallet.json
cat test-wallet.json
# Output: [123,45,67,...,189]

# Public key'i al
solana-keygen pubkey test-wallet.json
# Output: 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw

# Devnet SOL al
solana airdrop 2 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw --url devnet
```

#### Swagger UI ile Test

1. Sunucuyu başlat: `npm run start:dev`
2. Tarayıcıda aç: http://localhost:3001/api
3. **nft-admin** bölümünde **POST /nft-admin/collection** seç
4. "Try it out" butonuna tıkla
5. **Authorization** header'a private key'i ekle:
   ```
   [123,45,67,89,90,...]
   ```
6. Form alanlarını doldur:
   - `adminPublicKey`: Public key (örn: 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw)
   - `name`: VYBE_TEST_COLLECTION
   - `symbol`: VTEST
   - `royalty`: 5
   - `description`: Test collection for VYBE
   - `image`: Bir resim dosyası yükle
7. "Execute" butonuna tıkla

#### Başarılı Yanıt

```json
{
  "success": true,
  "data": {
    "collection": {
      "id": "8kX7...",  // Collection mint address
      "admin": "Fn4P5...",
      "name": "VYBE_TEST_COLLECTION",
      "symbol": "VTEST",
      "uri": "ipfs://QmX...",
      "royalty": 5,
      "isActive": true
    },
    "metadata": {
      "name": "VYBE_TEST_COLLECTION",
      "symbol": "VTEST",
      "description": "Test collection for VYBE",
      "image": "ipfs://QmY...",
      "external_url": "https://vybe.game",
      ...
    },
    "metadataUri": "ipfs://QmX...",
    "blockchain": {
      "signature": "5k8r...",  // Transaction signature
      "collectionPda": "ABC...",  // Collection PDA address
      "collectionMint": "8kX7...",  // Collection mint address
      "explorer": "https://explorer.solana.com/tx/5k8r...?cluster=devnet"
    },
    "message": "Collection created successfully on blockchain, IPFS, and database!"
  }
}
```

### 2. Dosya Adlandırma

Artık IPFS'e yüklenen dosyalar anlamlı isimler alıyor:

**Önceki**:
- `1729250000000_image.png`
- `metadata_1729250000123.json`

**Şimdi**:
- `VYBE_BUILDINGS_collection_image_1729250000000`
- `metadata_1729250000123.json`

### 3. Blockchain İşlemi Doğrulama

Transaction signature'ı Solana Explorer'da kontrol et:

```
https://explorer.solana.com/tx/{signature}?cluster=devnet
```

Veya Solana CLI ile:

```bash
solana confirm {signature} --url devnet
```

## Teknik Detaylar

### Oluşturulan Servisler

**SolanaContractService** (`src/nft/solana-contract.service.ts`):
- `createCollectionOnChain()` - Blockchain'de koleksiyon oluştur
- `createNftTypeOnChain()` - Blockchain'de NFT tipi oluştur (yakında)
- `checkAdminBalance()` - Admin bakiye kontrolü

**NftAdminService** Güncellemeleri:
- `uploadFileToIPFS()` - Custom dosya adı desteği eklendi
- `createCollectionWithFile()` - Blockchain entegrasyonu eklendi

### İşlem Akışı

```
1. Frontend → API Request (multipart/form-data + private key)
   ↓
2. Backend → Resmi IPFS'e yükle (QuickNode)
   ↓
3. Backend → Metadata JSON oluştur
   ↓
4. Backend → Metadata'yı IPFS'e yükle
   ↓
5. Backend → Solana transaction oluştur ve gönder
   ↓
6. Backend → Transaction'ı confirm et
   ↓
7. Backend → Database'e kaydet (mint address ile)
   ↓
8. Frontend ← Başarı yanıtı + explorer linki
```

### PDAs (Program Derived Addresses)

Kontrat şu PDA'ları kullanıyor:

```typescript
// Marketplace PDA
[b"marketplace"] → Marketplace hesabı

// Collection PDA
[b"collection", collection_name] → Collection bilgileri

// Collection Metadata PDA (Metaplex)
[b"metadata", TOKEN_METADATA_PROGRAM, collection_mint] → Metadata

// Collection Master Edition PDA (Metaplex)
[b"metadata", TOKEN_METADATA_PROGRAM, collection_mint, b"edition"] → Master Edition

// NFT Type PDA (gelecek güncellemede)
[b"type", collection_pda, type_name] → NFT tip bilgileri
```

### Gas Fees

Collection oluşturma ~0.02-0.05 SOL tutar (devnet):
- Mint account creation
- Metadata account creation
- Master edition creation
- Collection PDA initialization

## Hata Durumları

### "Admin private key is required"
**Sebep**: Authorization header eksik veya yanlış format

**Çözüm**:
```
Authorization: [123,45,67,...]
```

### "Insufficient funds"
**Sebep**: Cüzdanda yeterli SOL yok

**Çözüm** (Devnet):
```bash
solana airdrop 2 {PUBLIC_KEY} --url devnet
```

### "Transaction failed"
**Sebep**: Çeşitli nedenler olabilir

**Kontrol**:
1. Console loglarını incele
2. Transaction signature'ı explorer'da aç
3. Program logs'u oku

### "Collection already exists"
**Sebep**: Aynı isimli koleksiyon zaten var

**Çözüm**: Farklı bir isim kullan

## Gelecek Güncellemeler

### NFT Type Creation (Yakında)
```typescript
POST /nft-admin/type
Authorization: [private_key]
Body:
  - collectionName
  - name
  - price (SOL)
  - maxSupply
  - stakingAmount (SOL)
  - mainImage
  - additionalImages
  - attributes (user-friendly form - JSON değil!)
```

### Frontend Admin Panel
- React/Next.js UI
- Wallet bağlantısı (Phantom/Solflare)
- Drag & drop resim yükleme
- Attribute builder (JSON yazmadan)
- Real-time transaction tracking
- Collection ve NFT type yönetimi

### Attribute Builder Örneği

**Şu anki durum** (kullanıcı dostu değil):
```json
{
  "attributes": "[{\"trait_type\":\"Rarity\",\"value\":\"Common\"},{\"trait_type\":\"Power\",\"value\":\"100\"}]"
}
```

**Planlanan** (kullanıcı dostu):
```
Attributes:
  [+] Add Attribute

  Trait Type: Rarity      Value: Common      [X]
  Trait Type: Power       Value: 100         [X]
  Trait Type: ______      Value: _____       [+]
```

## Güvenlik Notları

⚠️ **UYARI**: Private key'leri asla Git'e commit etmeyin!

✅ **Production için**:
- Private key'leri environment variable'da tutun
- Hardware wallet kullanın (Ledger)
- Multi-sig wallet kullanmayı düşünün
- Admin işlemleri için 2FA ekleyin

✅ **Development için**:
- Test wallet'ları kullanın (gerçek SOL yok)
- Private key'leri `.env.local` dosyasında tutun
- `.env.local`'i `.gitignore`'a ekleyin

## Test Adımları

### 1. Wallet Hazırlığı
```bash
# Yeni test wallet oluştur
solana-keygen new --outfile test-admin.json

# Public key'i al
solana-keygen pubkey test-admin.json

# Private key'i al
cat test-admin.json

# Devnet SOL al
solana airdrop 2 $(solana-keygen pubkey test-admin.json) --url devnet
```

### 2. Backend Başlatma
```bash
cd gamefi-backend
npm run start:dev
```

### 3. Collection Oluşturma
1. http://localhost:3001/api adresini aç
2. POST /nft-admin/collection endpoint'ini bul
3. Authorization header'a private key ekle
4. Form'u doldur
5. Execute tıkla
6. Explorer linkinden transaction'ı kontrol et

### 4. Doğrulama
```bash
# Collection hesabını kontrol et (devnet)
solana account {COLLECTION_PDA} --url devnet

# Transaction'ı kontrol et
solana confirm {SIGNATURE} --url devnet
```

## Destek

Sorun yaşarsan:
1. Console loglarını kontrol et
2. Explorer'da transaction'ı incele
3. `BLOCKCHAIN_INTEGRATION.md` dosyasını oku
4. `ENV_SETUP.md` dosyasını kontrol et

## Referanslar

- [Solana Docs](https://docs.solana.com/)
- [Anchor Docs](https://www.anchor-lang.com/)
- [Metaplex Docs](https://docs.metaplex.com/)
- [QuickNode IPFS](https://www.quicknode.com/docs/ipfs)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
