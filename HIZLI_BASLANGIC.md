# Hızlı Başlangıç Kılavuzu (Türkçe)

## Sorun Çözüldü ✅

IPFS dosya yükleme hatası ("Multipart: Unexpected end of form") düzeltildi.

## Değişiklikler

### 1. Axios Kütüphanesi Eklendi

Native `fetch` yerine `axios` kullanılarak multipart form-data düzgün şekilde işleniyor.

### 2. Ortam Konfigürasyonları

Artık geliştirme ve prodüksiyon için ayrı ortam dosyaları var:

- `.env.development` - Yerel geliştirme (localhost:3001)
- `.env.production` - Prodüksiyon (Railway)

## Kullanım

### 1. API Anahtarını Ayarla

QuickNode IPFS API anahtarınızı `.env.development` dosyasına ekleyin:

```env
QUICKNODE_IPFS_API_KEY=qn_gerçek_api_anahtarınız_buraya
```

### 2. Geliştirme Sunucusunu Çalıştır

```bash
cd gamefi-backend
npm run start:dev
```

Sunucu http://localhost:3001 adresinde çalışacak.

### 3. Test Et

#### Swagger UI ile Test

1. Tarayıcıda aç: http://localhost:3001/api
2. **nft-admin** bölümüne git
3. **POST /nft-admin/collection** seç
4. Formu doldur:
   - `adminPublicKey`: Solana cüzdan adresiniz
   - `name`: Koleksiyon adı (örn: "VYBE_TEST")
   - `symbol`: Sembol (örn: "VTEST")
   - `royalty`: Royalty oranı (örn: 5)
   - `description`: Açıklama
   - `image`: Test resmi yükle (PNG/JPEG)
5. "Execute" butonuna tıkla

#### Beklenen Sonuç

✅ Başarılı yanıt:
```json
{
  "success": true,
  "data": {
    "collection": {...},
    "metadataUri": "ipfs://QmXxx..."
  }
}
```

## Komutlar

### Geliştirme Ortamı
```bash
npm run start:dev      # Geliştirme sunucusu (hot reload, port 3001)
npm run start:debug    # Debug modu
```

### Prodüksiyon Ortamı
```bash
npm run build          # Derleme
npm run start:prod     # Prodüksiyon sunucusu
```

## Port Yapılandırması

- **Geliştirme**: localhost:3001
- **Prodüksiyon**: https://gamefi-backend-production.up.railway.app

## Değişen Dosyalar

### Değiştirilen
- `src/nft/nft-admin.service.ts` - IPFS upload metodları düzeltildi
- `package.json` - Axios eklendi, scriptler güncellendi

### Eklenen
- `.env.development` - Geliştirme ortam ayarları
- `.env.production` - Prodüksiyon ortam ayarları
- `ENV_SETUP.md` - Detaylı İngilizce döküman
- `BUGFIX_SUMMARY.md` - Detaylı hata düzeltme özeti
- `HIZLI_BASLANGIC.md` - Bu dosya

## Önemli Notlar

⚠️ **API Anahtarı Gerekli**: QuickNode IPFS API anahtarı olmadan IPFS yükleme çalışmaz.

📝 **Ortam Dosyaları**: `.env.development` ve `.env.production` dosyalarını gerçek kimlik bilgilerinizle güncelleyin.

🔒 **Güvenlik**: Gerçek API anahtarlarını Git'e commit etmeyin!

## Sorun Giderme

### "QUICKNODE_IPFS_API_KEY is not configured" Hatası

1. `.env.development` dosyasını kontrol edin
2. API anahtarını ekleyin
3. Sunucuyu yeniden başlatın: `npm run start:dev`

### Port Kullanımda Hatası

`.env.development` dosyasında `PORT` değerini değiştirin:
```env
PORT=3002
```

### Database Bağlantı Hatası

1. PostgreSQL'in çalıştığından emin olun
2. `.env.development` içindeki kimlik bilgilerini kontrol edin
3. Veritabanını oluşturun: `createdb vybe_gamefi`

## API Endpoints

### NFT Admin
- `POST /nft-admin/collection` - Koleksiyon oluştur (dosya yükleme ile)
- `POST /nft-admin/type` - NFT tipi oluştur
- `GET /nft-admin/collections` - Tüm koleksiyonları listele
- `GET /nft-admin/types?collection=ADI` - Koleksiyona göre tipleri listele

### Store Konfigürasyonu
- `POST /nft-admin/store-config` - Store tab konfigürasyonu oluştur/güncelle
- `GET /nft-admin/store-configs` - Tüm konfigürasyonları listele

## Swagger Dokümantasyonu

Geliştirme: http://localhost:3001/api
Prodüksiyon: https://gamefi-backend-production.up.railway.app/api

## Destek

Daha fazla bilgi için:
- `ENV_SETUP.md` - Detaylı kurulum kılavuzu (İngilizce)
- `BUGFIX_SUMMARY.md` - Hata düzeltmesi özeti (İngilizce)
- `CLAUDE.md` - Genel proje dokümantasyonu
