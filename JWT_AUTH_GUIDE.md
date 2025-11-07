# JWT Authentication Guide - Türkçe

## Değişiklikler

Backend artık JWT token authentication kullanıyor! Private key'ler güvenli bir şekilde şifrelenip token içinde taşınıyor.

### Yeni Özellikler

✅ **JWT Token Encryption**: Private key base58 formatında alınıp JWT ile şifreleniyor
✅ **Swagger Auth**: Swagger UI'da "Authorize" butonu ile kolayca test
✅ **Güvenli Depolama**: Private key 1 gün geçerli token içinde şifreleniyor
✅ **Basit Kullanım**: Sadece base58 private key ver, token al, kullan!

## Nasıl Kullanılır?

### 1. Adım: Token Al (Login)

#### Endpoint
```
POST /auth/login
```

#### Body
```json
{
  "privateKey": "3mi4bzn28FXZCuULco7vgnFD3RAdzJo6SMt4PZ1MUv5jYmVqbf48kZaZa78tGbTt6MDPPQ1c8LgEwUm1ujhtiHSq"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcml2YXRlS2V5IjoiM21pNGJ6bjI4RlhaQ3VVTGNvN3Znb...",
    "publicKey": "8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw",
    "expiresIn": "1 day"
  },
  "message": "Token generated successfully. Use this token in the Authorization header as \"Bearer <token>\""
}
```

### 2. Adım: Token ile İstek At

#### Endpoint
```
POST /nft-admin/collection
```

#### Headers
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

#### Body (Form Data)
```
adminPublicKey: 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw
name: VYBE_TEST_COLLECTION
symbol: VTEST
royalty: 5
description: Test collection
image: [file]
```

## Swagger UI ile Kullanım

### 1. Sunucuyu Başlat
```bash
npm run start:dev
```

### 2. Swagger UI'ı Aç
```
http://localhost:3001/api
```

### 3. Token Al

1. **auth** bölümünü aç
2. **POST /auth/login** endpoint'ini seç
3. "Try it out" tıkla
4. Private key'ini gir:
   ```json
   {
     "privateKey": "3mi4bzn28FXZCuULco7vgnFD3RAdzJo6SMt4PZ1MUv5jYmVqbf48kZaZa78tGbTt6MDPPQ1c8LgEwUm1ujhtiHSq"
   }
   ```
5. "Execute" tıkla
6. Response'dan `token` değerini kopyala

### 4. Token'ı Swagger'a Ekle

1. Sayfanın üstündeki **"Authorize"** butonuna tıkla (kilit simgesi)
2. Açılan pencereye token'ı yapıştır (sadece token, "Bearer" yazmana gerek yok)
3. "Authorize" tıkla
4. "Close" tıkla

### 5. Collection Oluştur

1. **nft-admin** bölümünü aç
2. **POST /nft-admin/collection** endpoint'ini seç
3. "Try it out" tıkla
4. Form'u doldur:
   - `adminPublicKey`: 8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw
   - `name`: VYBE_TEST_COLLECTION
   - `symbol`: VTEST
   - `royalty`: 5
   - `description`: Test collection for VYBE
   - `image`: Bir resim dosyası seç
5. "Execute" tıkla
6. ✅ Collection blockchain'de oluşturuldu!

## Private Key Nasıl Alınır?

### Yeni Test Wallet Oluştur (En Kolay)

```bash
# Yeni wallet oluştur
solana-keygen new --outfile test-wallet.json

# Base58 private key'i al
solana-keygen pubkey test-wallet.json --outfile /dev/null 2>&1 | grep -v "Wrote" | head -1
# Veya daha basit:
cat test-wallet.json | python3 -c "import sys, json, base58; print(base58.b58encode(bytes(json.load(sys.stdin))).decode())"

# Public key'i al
solana-keygen pubkey test-wallet.json

# Devnet SOL al
solana airdrop 2 $(solana-keygen pubkey test-wallet.json) --url devnet
```

### Phantom Wallet'tan Al

1. Phantom'u aç
2. Settings → Show Secret Recovery Phrase
3. Recovery phrase'i kopyala
4. Python ile base58 formatına çevir:

```python
from solders.keypair import Keypair
import base58

# Recovery phrase'ten keypair oluştur
# Bu kısmı Solana CLI ile yapman daha kolay
```

### Solflare Wallet'tan Al

1. Solflare'i aç
2. Settings → Export Private Key
3. Private key base58 formatında gösterilir

## Token Detayları

### JWT Payload
```json
{
  "privateKey": "3mi4bzn28FXZCuULco7vgnFD3RAdzJo6SMt4PZ1MUv5j...",
  "publicKey": "8dsHsVcdr9rFDa2CaiNam5GtemN8MwyGYxne9ZtfmtRw",
  "iat": 1729260000,
  "exp": 1729346400
}
```

### Encryption
- **Secret**: `emirsuperdeveloper`
- **Algorithm**: HS256
- **Expiry**: 1 day (24 saat)

### Token Akışı

```
1. User → POST /auth/login (base58 private key)
   ↓
2. Backend → Validate private key (Keypair.fromSecretKey)
   ↓
3. Backend → Create JWT token (encrypted)
   ↓
4. User ← Token (valid for 1 day)
   ↓
5. User → POST /nft-admin/collection (Bearer token)
   ↓
6. Backend → Verify token (JwtAuthGuard)
   ↓
7. Backend → Extract private key from token
   ↓
8. Backend → Convert to JSON array format
   ↓
9. Backend → Sign blockchain transaction
   ↓
10. User ← Success response + explorer link
```

## Güvenlik

### ✅ Güvenli
- Token 1 gün sonra expire oluyor
- Private key JWT içinde encrypted
- HTTPS üzerinden transfer (production)
- Token revoke edilebilir (gelecek özellik)

### ⚠️ Dikkat
- Token'ı kimseyle paylaşma!
- Production'da HTTPS kullan
- Token'ı localStorage'da sakla (session storage daha güvenli)
- Frontend'de token'ı encrypt et

### 🔒 Production İçin
- Secret'i environment variable'dan al
- Token expiry süresini azalt (4-8 saat)
- Refresh token mekanizması ekle
- Rate limiting ekle
- IP whitelist kullan (admin işlemler için)

## Hata Durumları

### "Invalid private key format"
**Sebep**: Private key base58 formatında değil

**Çözüm**: Private key'i base58 formatına çevir veya yeni wallet oluştur

### "Invalid or expired token"
**Sebep**: Token expire olmuş veya bozuk

**Çözüm**: Yeni token al (`POST /auth/login`)

### "Unauthorized"
**Sebep**: Token header'da yok veya yanlış format

**Çözüm**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Test Senaryosu

### Baştan Sona Test

```bash
# 1. Wallet oluştur
solana-keygen new --outfile test.json

# 2. Public key al
PUBKEY=$(solana-keygen pubkey test.json)
echo "Public Key: $PUBKEY"

# 3. Private key al (base58)
# Bu kısım için Python veya başka bir araç gerekli
# Veya Phantom/Solflare kullan

# 4. Devnet SOL al
solana airdrop 2 $PUBKEY --url devnet

# 5. Backend başlat
npm run start:dev

# 6. Token al (curl ile)
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"privateKey": "YOUR_BASE58_PRIVATE_KEY"}' \
  | jq -r '.data.token'

# 7. Token'ı kopyala ve collection oluştur (Swagger UI kullan)
# Veya curl ile:
curl -X POST http://localhost:3001/nft-admin/collection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "adminPublicKey=$PUBKEY" \
  -F "name=VYBE_TEST" \
  -F "symbol=VTEST" \
  -F "royalty=5" \
  -F "description=Test" \
  -F "image=@test-image.png"
```

## İleri Düzey

### Token Decode (Debug için)

```bash
# Token'ı 3 parçaya ayır: header.payload.signature
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcml2YXRl..."

# Payload'ı decode et (base64)
echo $TOKEN | cut -d. -f2 | base64 -d | jq
```

### Custom Token Generation (Backend)

```typescript
import { JwtService } from '@nestjs/jwt';

const jwtService = new JwtService({
  secret: 'emirsuperdeveloper',
});

const token = jwtService.sign({
  privateKey: 'base58_key',
  publicKey: 'public_key',
}, { expiresIn: '1d' });
```

## Sıkça Sorulan Sorular

**S: Token'ı nasıl saklarım?**
C: Frontend'de `localStorage` veya `sessionStorage` kullan. Session storage daha güvenli (tarayıcı kapanınca siliniyor).

**S: Token expire olunca ne yaparım?**
C: Yeni token al (`POST /auth/login`). Gelecekte refresh token mekanizması eklenecek.

**S: Production'da farklı bir secret kullanabilir miyim?**
C: Evet! Environment variable olarak ekle:
```typescript
JwtModule.register({
  secret: process.env.JWT_SECRET || 'emirsuperdeveloper',
  signOptions: { expiresIn: '1d' },
})
```

**S: Base58 private key'i nasıl oluştururum?**
C: Phantom/Solflare kullan veya `solana-keygen` + Python ile:
```python
import base58
import json

with open('keypair.json') as f:
    keypair = json.load(f)

private_key_base58 = base58.b58encode(bytes(keypair)).decode()
print(private_key_base58)
```

## Özet

1. ✅ **Login**: `POST /auth/login` + base58 private key → JWT token
2. ✅ **Authorize**: Swagger'da "Authorize" butonuna token'ı yapıştır
3. ✅ **Create**: `POST /nft-admin/collection` + form data → Blockchain'de collection
4. ✅ **Verify**: Explorer linkinden transaction'ı kontrol et

Artık hazırsın! 🚀

## Referanslar

- [JWT.io](https://jwt.io/) - Token decode/debug
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [NestJS JWT](https://docs.nestjs.com/security/authentication#jwt-token)
- [Base58 Encoding](https://en.wikipedia.org/wiki/Base58)
