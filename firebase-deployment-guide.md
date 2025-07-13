# Firebase Deployment Guide - Çamlıca Personel Takip Sistemi

## Genel Bakış

Bu proje Firebase Functions + Firebase Hosting ile deploy edilecek şekilde yapılandırılmıştır. Backend Firebase Functions'da, frontend ise Firebase Hosting'de çalışacak.

## Dosya Yapısı

```
/
├── firebase.json                 # Firebase konfigürasyonu
├── .firebaserc                  # Firebase proje ayarları
├── functions/                   # Firebase Functions (Backend)
│   ├── src/
│   │   ├── index.ts            # Ana functions dosyası
│   │   ├── simple-index.ts     # Basit test fonksiyonu
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── client/                      # Frontend (React)
│   ├── dist/                   # Build edilmiş frontend
│   └── ...
└── ...
```

## Deployment Adımları

### 1. Hazırlık

```bash
# Firebase CLI yükleme
npm install -g firebase-tools

# Firebase'e giriş
firebase login

# Proje bağlantısı
firebase use camlica-pts-001
```

### 2. Frontend Build

```bash
# Ana dizinde frontend build
npm run build
```

### 3. Functions Test (Opsiyonel)

```bash
# Functions klasöründe
cd functions

# Test build
npm run build

# Local test
npm run serve
```

### 4. Deployment

```bash
# Ana dizinde - tam deployment
firebase deploy

# Sadece functions
firebase deploy --only functions

# Sadece hosting
firebase deploy --only hosting
```

## Konfigürasyon Dosyaları

### firebase.json
```json
{
  "hosting": {
    "public": "client/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs18",
    "predeploy": ["npm --prefix functions run build"]
  }
}
```

## Environment Variables

Firebase Functions için environment variables Firebase Console'dan ayarlanır:

```bash
# Firebase Console > Project Settings > Service Accounts
# Firebase Admin SDK private key bilgilerini environment variables olarak ayarla:

firebase functions:config:set firebase.project_id="camlica-pts-001"
firebase functions:config:set firebase.private_key="-----BEGIN PRIVATE KEY-----\n..."
firebase functions:config:set firebase.client_email="..."
```

## Deployment Sonrası

### URL'ler:
- Frontend: `https://camlica-pts-001.web.app`
- Functions: `https://us-central1-camlica-pts-001.cloudfunctions.net/api`

### Test Endpoints:
- Health Check: `https://us-central1-camlica-pts-001.cloudfunctions.net/api/health`
- Test API: `https://us-central1-camlica-pts-001.cloudfunctions.net/api/test`

## Güvenlik Ayarları

### Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Sadece kimlik doğrulaması yapılmış kullanıcılar
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Firebase Authentication
- Google Sign-In aktif
- Email/Password aktif
- Phone Authentication aktif

## Troubleshooting

### Common Issues:

1. **Functions build hatası**:
   ```bash
   cd functions
   npm install
   npm run build
   ```

2. **Hosting 404 hatası**:
   - `client/dist` klasörünün var olduğundan emin olun
   - `npm run build` komutunu çalıştırın

3. **CORS hatası**:
   - Functions'da CORS middleware'i aktif
   - Frontend'de API URL'lerini kontrol edin

## Monitoring

Firebase Console'dan:
- Functions logs: Functions > Logs
- Hosting analytics: Hosting > Usage
- Authentication: Authentication > Users

## Backup

Firebase projesi otomatik backup yapar, ancak:
- Firestore export/import için Firebase CLI kullanın
- Functions kodunu Git'te tutun
- Environment variables'ı güvenli bir yerde saklayın

## Rollback

Önceki versiyona dönmek için:
```bash
firebase hosting:clone SOURCE_SITE_ID TARGET_SITE_ID
```

## Support

Firebase Console > Support > Create Case