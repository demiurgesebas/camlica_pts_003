# Çamlıca Personel Takip Sistemi

## Proje Hakkında

Bu proje, Türkçe arayüzlü web tabanlı personel takip sistemidir. React.js frontend ve Node.js backend kullanılarak geliştirilmiştir. Sistem, mevcut Flutter mobil uygulaması ile entegre çalışacak şekilde tasarlanmıştır.

## Teknolojiler

- **Frontend**: React.js, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: OpenID Connect (OIDC)
- **Build**: Vite

## Özellikler

- 🏢 Çok şubeli personel yönetimi
- 👥 Personel HR operasyonları
- 📅 Vardiya planlama ve atama
- 📱 QR kod tabanlı devam takibi
- 🏃 Dinamik çoklu ekran QR gösterimi
- 📝 İzin yönetimi ve otomatik dilekçe üretimi
- 📊 Raporlama yetenekleri
- 📁 Detaylı personel doküman yönetimi
- 📈 Excel tabanlı vardiya import
- 🔐 Rol tabanlı erişim kontrolü (Super Admin, Admin, Personel)
- 📱 NetGSM SMS entegrasyonu
- 🇹🇷 Türk İş Kanunu'na uygun yıllık izin hesaplama

## Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL 15+
- NPM veya Yarn

### Yerel Geliştirme

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd camlica-personnel-tracking
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Veritabanı kurulumu:
```bash
npm run db:push
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
```

## Prodüksiyon Deployment

### Docker ile Deployment

1. Docker image oluşturun:
```bash
docker build -t camlica-personnel-tracking .
```

2. Docker Compose ile çalıştırın:
```bash
docker-compose up -d
```

### EasyPanel Deployment

1. GitHub reposunu EasyPanel'e bağlayın
2. Aşağıdaki environment variables'ları ayarlayın:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
   - `PORT=5000`

3. Build komutları:
   - Build: `npm run build`
   - Start: `npm run start`

## Environment Variables

```env
DATABASE_URL=postgresql://username:password@localhost:5432/personnel_tracking
SESSION_SECRET=your-super-secret-session-key
NODE_ENV=production
PORT=5000
REPLIT_DOMAINS=your-domain.com
REPL_ID=your-repl-id
```

## API Endpoints

- `POST /api/auth/login` - Giriş yapma
- `GET /api/auth/user` - Kullanıcı bilgilerini getirme
- `GET /api/auth/logout` - Çıkış yapma
- `GET /api/personnel` - Personel listesi
- `GET /api/branches` - Şube listesi
- `GET /api/shifts` - Vardiya listesi
- `GET /api/qr-codes` - QR kod listesi
- `GET /api/attendance` - Devam kayıtları

## Güvenlik

- HTTPS zorunlu
- Session-based authentication
- Role-based access control (RBAC)
- SQL injection koruması
- XSS koruması
- CSRF token koruması

## Destek

Herhangi bir sorun veya öneriniz için lütfen GitHub Issues kullanın.

## Lisans

Bu proje özel lisans altındadır. Tüm hakları saklıdır.