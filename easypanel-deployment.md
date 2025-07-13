# EasyPanel Deployment Rehberi

## Adım 1: Projeyi GitHub'a Yükleme

### 1.1 Proje Dosyalarını Hazırlama
1. Replit'ten projeyi ZIP olarak indirin
2. Bilgisayarınıza çıkarın
3. VS Code ile açın

### 1.2 GitHub Repository Oluşturma
1. GitHub hesabınızda yeni repository oluşturun
2. Repository adı: `camlica-personnel-tracking`
3. Public veya Private seçebilirsiniz (önerilen: Private)

### 1.3 Dosyaları GitHub'a Yükleme
```bash
# VS Code terminali açın ve şu komutları çalıştırın:
git init
git add .
git commit -m "Initial commit: Çamlıca Personnel Tracking System"
git branch -M main
git remote add origin https://github.com/KULLANICI-ADI/camlica-personnel-tracking.git
git push -u origin main
```

## Adım 2: EasyPanel Kurulumu

### 2.1 EasyPanel Hesabı
1. EasyPanel hesabınızı hazırlayın
2. Server bağlantınızı kontrol edin

### 2.2 Veritabanı Hazırlama
1. EasyPanel'de PostgreSQL servisi oluşturun
2. Database bilgilerini not edin:
   - Database URL
   - Host
   - Port
   - Username
   - Password
   - Database Name

## Adım 3: Uygulama Deployment

### 3.1 App Oluşturma
1. EasyPanel'de "New App" tıklayın
2. "From GitHub" seçeneğini seçin
3. GitHub repository'nizi seçin (`camlica-personnel-tracking`)
4. Branch: `main`

### 3.2 Build Configuration
**Build Settings:**
- Build Command: `npm run build`
- Install Command: `npm install`
- Start Command: `npm run start`
- Port: `5000`

### 3.3 Environment Variables
Aşağıdaki environment variables'ları ekleyin:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-super-secret-session-key-here-change-this
PGHOST=your-postgres-host
PGPORT=5432
PGUSER=your-postgres-username
PGPASSWORD=your-postgres-password
PGDATABASE=your-database-name
```

### 3.4 Domain Configuration
1. Domain ayarlarını yapın
2. SSL sertifikası otomatik olarak oluşturulacaktır

## Adım 4: Veritabanı Migrasyonu

### 4.1 Database Schema Oluşturma
Deployment sonrası, veritabanını başlatmak için:

1. EasyPanel'de app console'u açın
2. Şu komutu çalıştırın:
```bash
npm run db:push
```

### 4.2 İlk Kullanıcı Oluşturma
Sistem başlatıldıktan sonra, ilk Super Admin kullanıcısı otomatik olarak oluşturulacaktır:
- Username: `5434989203`
- Password: `Onur-12345`
- Role: `super_admin`

## Adım 5: Sistem Yapılandırması

### 5.1 NetGSM SMS Yapılandırması
SMS özelliklerini aktif etmek için:

1. Sistem ayarlarından NetGSM bilgilerini girin
2. Test bağlantısını yapın

### 5.2 Sistem Ayarları
- Sistem adı: "Çamlıca Personel Takip Sistemi"
- Zaman dilimi: Europe/Istanbul
- Dil: Türkçe

## Adım 6: Test ve Doğrulama

### 6.1 Health Check
Sistem çalışıp çalışmadığını kontrol edin:
```
https://your-domain.com/health
```

### 6.2 Giriş Testi
1. Ana sayfaya gidin
2. Giriş bilgilerini kullanarak test edin
3. Tüm özellikler çalışıyor mu kontrol edin

## Adım 7: Backup ve Güvenlik

### 7.1 Veritabanı Backup
- Düzenli PostgreSQL backup'ları alın
- EasyPanel'in backup özelliklerini kullanın

### 7.2 Güvenlik Kontrolleri
- HTTPS zorunlu
- Güçlü SESSION_SECRET kullanın
- Firewall ayarlarını kontrol edin

## Sorun Giderme

### Build Hataları
- `npm install` başarısız olursa Node.js versiyonunu kontrol edin
- Dependencies eksikse `package.json` dosyasını kontrol edin

### Database Connection
- PostgreSQL bağlantı bilgilerini kontrol edin
- Firewall ayarlarını kontrol edin
- Database permissions'ları kontrol edin

### App Crashes
- Logs'ları kontrol edin
- Environment variables'ları kontrol edin
- Memory limitlerini kontrol edin

## Destek
Sorunlarınız için:
1. EasyPanel logs'larını kontrol edin
2. GitHub Issues kullanın
3. Sistem yöneticisine başvurun

---

**Not:** Bu rehber, temel deployment için hazırlanmıştır. Üretim ortamında ek güvenlik ve performans optimizasyonları gerekebilir.