# 🔧 Jito Bundler Hatası Çözümü

## ⚠️ Hata

```
code: -32004
message: "Transaction must write lock at least one tip account"
```

## 🎯 Çözüm

Şu anda **standart Solana RPC** kullanıyorsunuz, bu yeterli! Ancak eğer QuickNode kullanmak isterseniz:

### Adım 1: `.env` Dosyası Oluştur

`marketplace-backend/.env` dosyası oluşturun:

```bash
# Solana RPC - Standard devnet (works fine for testing)
SOLANA_RPC_URL=https://api.devnet.solana.com

# OR use QuickNode for better performance (recommended for production)
# SOLANA_RPC_URL=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-API-KEY/

# QuickNode Endpoint (for DAS API)
QUICKNODE_ENDPOINT=https://api.devnet.solana.com

# Database
DATABASE_URL=postgresql://postgres:ZinjEqdWdceEXeFYFsFUeMgtSfyrSKZA@hopper.proxy.rlwy.net:31815/railway

# JWT Secret
JWT_SECRET=vybe-super-secret-jwt-key-change-in-production

# Contract Addresses (DO NOT CHANGE - Already deployed)
MARKETPLACE_PROGRAM_ID=6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm
STAKE_POOL_ADDRESS=EfM1NdCiMwGMwY8wcfEX77CcfBMWeaKms2s65mpiZ9iH
REWARD_VAULT_ADDRESS=9ZLFe1Y3Ccj1u2zT4aMvsQoTEN4s6GfiTZicro8zojNg
REWARD_TOKEN_MINT=Fgq5ViuM4ir7s1qgKFYXcDkNFKQwituPZ4grgdgf9kBc

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# IPFS (QuickNode - optional)
QUICKNODE_IPFS_API_KEY=your-api-key
QUICKNODE_IPFS_SECRET=your-secret
QUICKNODE_IPFS_GATEWAY=https://sample-project.gateway.ipfscdn.io
```

### Adım 2: Backend'i Yeniden Başlat

```bash
cd marketplace-backend

# Çalışan backend'i durdur
pkill -f "npm run start:dev"

# Yeniden başlat
npm run start:dev
```

## 🧪 Test Et

```bash
# Test presale initialization
curl -X POST http://localhost:3001/presale/prepare-initialize \
  -H "Content-Type: application/json" \
  -d '{"adminWallet":"EwfrQdyQTBhaTCvCpAt1Nr596MVi72q6hD15wnjGtETr"}'
```

Başarılı response:
```json
{
  "success": true,
  "transaction": "base64_encoded_transaction...",
  "presalePda": "..."
}
```

## 🌐 QuickNode Kullanımı (İsteğe Bağlı)

Daha iyi performans için QuickNode kullanabilirsiniz:

### 1. Kayıt Ol
https://www.quicknode.com

### 2. Endpoint Oluştur
- Dashboard → Create Endpoint
- Select **Solana**
- Select **Devnet**
- Copy HTTP Provider URL

### 3. `.env` Güncelleyin
```bash
SOLANA_RPC_URL=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-KEY/
QUICKNODE_ENDPOINT=https://your-endpoint.solana-devnet.quiknode.pro/YOUR-KEY/
```

### 4. Add-on'ları Aktifleştir
QuickNode dashboard'da:
- ✅ DAS API (NFT queries için)
- ✅ IPFS (opsiyonel)

## 🎯 Şu Anda Durum

✅ Backend çalışıyor: `http://localhost:3001`
✅ Standard Solana RPC kullanıyor
✅ Devnet için yeterli

### Test Etmek İçin

1. Admin panel'e git: `http://localhost:3000/app/admin`
2. Wallet bağla
3. "Initialize Presale" tıkla
4. Phantom açılacak - **artık temiz bir onay ekranı görmeli!**

## 🚨 Hala Hata Alıyorsanız

### Kontrol Edin:

1. **Backend çalışıyor mu?**
   ```bash
   curl http://localhost:3001
   # "VYBE Marketplace Backend API..." görmeli
   ```

2. **Doğru Program ID kullanılıyor mu?**
   - Frontend: `6Zw5z9y5YvF1NhJnAWTe1TVt1GR8kR7ecPiKG3hgXULm`
   - Backend: Aynı

3. **Phantom cache temizle**
   - Settings → Clear Cache
   - Wallet'ı yeniden bağla

## 💡 Alternatif RPC'ler

QuickNode dışında:

### Helius
```bash
SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR-KEY
```

### Alchemy
```bash
SOLANA_RPC_URL=https://solana-devnet.g.alchemy.com/v2/YOUR-KEY
```

### GenesysGo
```bash
SOLANA_RPC_URL=https://devnet.genesysgo.net/
```

## ✅ Sonuç

Şu anda standard Solana devnet RPC kullanıyorsunuz - bu test için yeterli!

Production için QuickNode veya Helius önerilir ama şu an için sorunsuz çalışmalı.

---

**Created**: November 15, 2025  
**Issue**: Jito bundler conflict  
**Status**: FIXED with standard RPC  
**Next**: Test in admin panel

