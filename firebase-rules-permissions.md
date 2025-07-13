# Firebase Firestore Security Rules - Yetki Detayları

## Kullanıcı Rolleri

### 1. **super_admin** (Süper Admin)
- **Tüm yetkiler**: Sistemdeki her şeye tam erişim
- **Kullanıcı yönetimi**: Kullanıcı oluşturma, düzenleme, silme
- **Sistem ayarları**: Sistem yapılandırması
- **Tüm collections**: Okuma, yazma, güncelleme, silme

### 2. **admin** (Admin)
- **Personel yönetimi**: Personel ekleme, düzenleme, silme
- **Organizasyon yönetimi**: Şube, departman, ekip yönetimi
- **Vardiya yönetimi**: Vardiya oluşturma, atama, düzenleme
- **İzin yönetimi**: İzin onaylama, reddetme
- **QR yönetimi**: QR kod ve ekran yönetimi
- **Raporlar**: Tüm raporlara erişim

### 3. **personnel** (Personel)
- **Kendi verilerini görme**: Kendi personel bilgileri
- **İzin talebi**: Kendi izin taleplerini oluşturma
- **QR kod okuma**: Devamsızlık için QR kod okuma
- **Genel bilgiler**: Şube, departman, ekip bilgilerini görme

## Collection Bazlı Yetkiler

### 📋 **users** (Kullanıcı Hesapları)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: Sadece super_admin
- **Kendi profili**: Kendi profilini güncelleme (rol/yetki hariç)

### 👥 **personnel** (Personel Bilgileri)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 🏢 **branches** (Şubeler)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 🏬 **departments** (Departmanlar)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 👨‍👩‍👧‍👦 **teams** (Ekipler)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 🕐 **shifts** (Vardiyalar)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 📅 **shift_assignments** (Vardiya Atamaları)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 🏖️ **leave_requests** (İzin Talepleri)
- **Okuma**: Tüm authenticated kullanıcılar
- **Kendi talebini oluşturma**: Herkes kendi izin talebini oluşturabilir
- **Onay/Red**: admin + super_admin

### 📱 **qr_codes** (QR Kodları)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### 🖥️ **qr_screens** (QR Ekranları)
- **Okuma**: Herkese açık (kimlik doğrulama gerekmez)
- **Yazma**: admin + super_admin

### 📋 **attendance_records** (Devamsızlık Kayıtları)
- **Okuma**: Tüm authenticated kullanıcılar
- **Check-in/out**: Herkes QR kod ile kayıt oluşturabilir
- **Düzenleme**: admin + super_admin

### 🔔 **notifications** (Bildirimler)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### ⚙️ **system_settings** (Sistem Ayarları)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: Sadece super_admin

### 📊 **reports** (Raporlar)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

### ✅ **tasks** (Görevler)
- **Okuma**: Tüm authenticated kullanıcılar
- **Yazma**: admin + super_admin

## Güvenlik Özellikleri

### 🔐 **Authentication Kontrolü**
- Tüm işlemler için Firebase Authentication gerekli
- Token'daki rol bilgisi kontrol ediliyor
- Kullanıcı kimlik doğrulaması zorunlu

### 🛡️ **Rol Bazlı Erişim**
- Her rol için farklı yetki seviyeleri
- Hiyerarşik yetki sistemi
- Kendi verilerine özel erişim

### 🚫 **Kısıtlamalar**
- Varsayılan olarak erişim yok
- Rol değiştirme koruması
- Yetki escalation koruması

## Kullanım Talimatları

Bu rules kodunu Firebase Console'da **Database > Rules** bölümüne yapıştırın:
1. https://console.firebase.google.com/project/camlica-pts-001/firestore/rules
2. Mevcut rules'ı silin
3. Yeni rules kodunu yapıştırın
4. "Yayımla" butonuna tıklayın

**Not**: Rules değişikliği birkaç dakika sürebilir.