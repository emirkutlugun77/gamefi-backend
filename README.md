# Marketplace Backend API

Bu backend, Solana blockchain üzerindeki NFT marketplace verilerini çeken bir REST API'dir. Veritabanı kullanmadan doğrudan blockchain'den veri çeker.

## Başlangıç

### Kurulum

```bash
npm install
```

### Geliştirme Modunda Çalıştırma

```bash
npm run start:dev
```

Server `http://localhost:3001` adresinde çalışacaktır.

### API Dokümantasyonu (Swagger)

Server çalıştıktan sonra Swagger dokümantasyonuna şu adresten erişebilirsiniz:
- **Swagger UI**: `http://localhost:3001/api`
- **OpenAPI JSON**: `http://localhost:3001/api-json`

### Build

```bash
npm run build
```

### Production Modunda Çalıştırma

```bash
npm run start:prod
```

## API Endpoints

### 1. Marketplace Verileri
**GET** `/nft/marketplace`

Marketplace bilgileri, tüm koleksiyonlar ve item tiplerini döner.

**Response:**
```json
{
  "success": true,
  "data": {
    "marketplace": {
      "admin": "7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe",
      "fee_bps": 500,
      "total_collections": 3,
      "bump": 252
    },
    "collections": [...],
    "itemTypesByCollection": {...}
  }
}
```

### 2. Koleksiyonlar
**GET** `/nft/collections`

Sadece koleksiyonlar ve item tiplerini döner.

**Response:**
```json
{
  "success": true,
  "data": {
    "collections": [...],
    "itemTypesByCollection": {...}
  }
}
```

### 3. Marketplace Bilgileri
**GET** `/nft/marketplace-info`

Sadece marketplace temel bilgilerini döner.

**Response:**
```json
{
  "success": true,
  "data": {
    "admin": "7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe",
    "fee_bps": 500,
    "total_collections": 3,
    "bump": 252
  }
}
```

### 4. Kullanıcı NFT'leri
**GET** `/nft/user-nfts?wallet=<WALLET_ADDRESS>`

Belirtilen cüzdan adresine ait NFT'leri döner. Sadece marketplace koleksiyonlarından olan NFT'leri getirir.

**Parameters:**
- `wallet` (required): Solana wallet adresi

**Örnek Kullanım:**
```bash
curl "http://localhost:3001/nft/user-nfts?wallet=7ia7xqc8mLiPbPEfDKWo8xF2UZ8NkEJz7d7pd489rHFe"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "nfts": [
      {
        "mint": "GvoedJzb2RU3HeEsq4GzRHRy99auVqMeVCWkzhM7jg3N",
        "metadata": {
          "name": "Drakko",
          "symbol": "DRK",
          "description": "Tough One",
          "image": "https://gateway.pinata.cloud/ipfs/QmW1ifmgwG1EKgR72eZCCRuhxDxgo9LSc1Q5Sc2SuFD1zP",
          "attributes": [...]
        },
        "name": "Drakko #1",
        "image": "https://gateway.pinata.cloud/ipfs/QmW1ifmgwG1EKgR72eZCCRuhxDxgo9LSc1Q5Sc2SuFD1zP",
        "collectionName": "VYBE_SUPERHEROES_w89yuli8p3l"
      }
    ],
    "count": 15
  }
}
```

## Özellikler

- ✅ Veritabanı gerektirmez
- ✅ Doğrudan Solana blockchain'den veri çeker
- ✅ Website'deki ile aynı mantığı kullanır
- ✅ CORS desteği (frontend erişimi için)
- ✅ TypeScript desteği
- ✅ Error handling
- ✅ NestJS framework
- ✅ **Swagger API dokümantasyonu**
- ✅ **Kullanıcı NFT'leri çekme özelliği**
- ✅ Tam metadata desteği (resim, özellikler, vs.)

## Teknolojiler

- **NestJS**: Backend framework
- **@solana/web3.js**: Solana blockchain etkileşimi
- **@solana/spl-token**: SPL token işlemleri
- **TypeScript**: Tip güvenliği

## Yapılandırma

- **Port**: 3001 (varsayılan)
- **Solana Network**: Devnet
- **RPC Endpoint**: `https://api.devnet.solana.com`

## CORS

Frontend erişimi için aşağıdaki origin'lere izin verilmiştir:
- `http://localhost:3000`
- `http://localhost:3001`
- `https://localhost:3000`
- `https://localhost:3001`# gamefi-backend
