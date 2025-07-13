# Personnel Tracking System

## Overview

This is a full-stack personnel tracking system built with React.js frontend and Node.js backend. The system is designed to integrate with an existing Flutter mobile application and provides comprehensive employee management, shift planning, leave management, and attendance tracking capabilities. The application is built with a Turkish interface and supports multi-branch operations.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript
- **UI Library**: Radix UI components with shadcn/ui
- **Styling**: Tailwind CSS with custom theme variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and build processes

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: OpenID Connect (OIDC) with Replit Auth
- **Session Management**: Express sessions with PostgreSQL store
- **API Design**: RESTful API with JSON responses
- **Validation**: Zod schemas shared between frontend and backend

## Key Components

### Database Schema
- **Users**: Authentication and role management (master_admin, branch_admin, personnel)
- **Branches**: Multi-branch support with manager assignments
- **Personnel**: Employee records with detailed profiles
- **Shifts**: Shift definitions and scheduling
- **Leave Requests**: Leave management with approval workflows
- **QR Codes**: Time-limited QR codes for attendance tracking
- **Attendance Records**: Check-in/check-out logging
- **Notifications**: System-wide notification management

### Authentication & Authorization
- **OpenID Connect**: Integration with Replit's authentication system
- **Role-Based Access Control**: Three-tier user system
- **Session Management**: Secure session handling with PostgreSQL storage
- **Route Protection**: Middleware-based authentication checks

### Core Features
- **Dashboard**: Real-time statistics and activity monitoring
- **Personnel Management**: Employee CRUD operations with branch assignment
- **Shift Planning**: Flexible shift creation and assignment
- **Leave Management**: Request submission and approval workflows
- **QR Code System**: Dynamic QR code generation for attendance
- **Attendance Tracking**: Automated time logging with QR codes
- **Notification System**: Multi-channel notification delivery

## Data Flow

1. **Authentication Flow**: Users authenticate via Replit OIDC, sessions stored in PostgreSQL
2. **API Requests**: Frontend makes authenticated requests to Express backend
3. **Data Persistence**: Drizzle ORM handles database operations with PostgreSQL
4. **Real-time Updates**: TanStack Query manages cache invalidation and refetching
5. **Form Validation**: Zod schemas ensure data integrity across frontend and backend

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Built-in connection management

### Authentication
- **Replit Auth**: OpenID Connect provider
- **Session Storage**: PostgreSQL-based session management

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Consistent icon library
- **Tailwind CSS**: Utility-first styling

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast bundling for production

## Deployment Strategy

### Development Environment
- **Hot Module Replacement**: Vite dev server with instant updates
- **Error Handling**: Runtime error overlay for debugging
- **Database Migrations**: Drizzle Kit for schema management

### Production Build
- **Static Assets**: Vite builds optimized client bundle
- **Server Bundle**: ESBuild creates Node.js production server
- **Environment Variables**: Secure configuration management

### Hosting Requirements
- **Node.js Runtime**: Server-side JavaScript execution
- **PostgreSQL Database**: Persistent data storage
- **Session Storage**: Database-backed session management
- **Static File Serving**: Client assets and public files

## Changelog

```
Changelog:
- July 05, 2025. Initial setup
- July 07, 2025. Excel dosyası analiz özelliği eklendi - personel vardiya bilgilerini Excel'den okuyabilme
- July 07, 2025. Excel vardiya yükleme sistemi tamamlandı - S/A/OF/Ç kodları ile aylık vardiya planı import edilebiliyor
- July 07, 2025. Teams (ekip) yönetim sistemi eklendi - ekip lideri atama, personel-ekip ilişkileri
- July 07, 2025. Personnel ekip alanı opsiyonel yapıldı - personel kaydında ekip seçimi zorunlu değil
- July 07, 2025. Excel import sistemi tamamen çalışır hale getirildi - personel eşleştirme, vardiya ataması oluşturma ve personel profillerinin otomatik güncellenmesi
- July 07, 2025. Personel profilindeki Excel yükleme özelliği kaldırıldı - vardiya planları merkezi olarak Vardiya Planları sayfasından yönetiliyor
- July 08, 2025. NetGSM SMS entegrasyonu tamamlandı
- July 08, 2025. Personel sayfasına SMS ve bildirim gönderme butonları eklendi
- July 08, 2025. Toplu SMS sistemi geliştirildi - ön izleme, onay mekanizması ve detaylı hedef listesi ile
- July 08, 2025. QR kod yönetimi ekranında ekran düzenleme özellikleri eklendi - ekran ID değiştirme, silme, ekleme
- July 08, 2025. QR ekranları için cihaz güvenlik sistemi eklendi - benzersiz erişim kodları, tek cihaz bağlama ve doğrulama sistemi
- July 08, 2025. QR kod ve ekran temizleme sistemi eklendi - tüm QR kodları ve QR ekranları toplu silme özellikleri
- July 09, 2025. Sistem branding "Çamlıca Personel Takip Sistemi" olarak güncellendi
- July 09, 2025. EasyPanel deployment için Docker ve configuration dosyaları eklendi
- July 09, 2025. Health check endpoint eklendi (/health)
- July 09, 2025. Detaylı deployment rehberi oluşturuldu (easypanel-deployment.md)
- July 11, 2025. Firebase Authentication sistem migrasyonu tamamlandı - PostgreSQL'den Firebase Firestore'a geçiş
- July 11, 2025. Çıkış butonu sorunu çözüldü - Firebase logout sistemi ve re-authentication engelleme
- July 11, 2025. Personnel rolü menü izinleri genişletildi - tüm sistem modüllerine erişim
- July 11, 2025. Süper admin yetkisi verildi - mebil538@gmail.com hesabı süper admin olarak güncellendi
- July 11, 2025. Telefon numarası ile giriş sistemi eklendi - Firebase SMS Authentication entegrasyonu tamamlandı
- July 11, 2025. Excel upload authentication sorunu çözüldü - Firebase token'ı header'a eklendi
- July 11, 2025. .env dosyasına Firebase Admin SDK bilgileri eklendi - JSON içeriği environment variables'a aktarıldı
- July 11, 2025. Excel upload performans sorunu çözüldü - batch işlem ve cache optimizasyonu eklendi
- July 11, 2025. Frontend timeout süresi 5 dakikaya çıkarıldı - büyük Excel dosyalar için yeterli süre
- July 11, 2025. Kullanıcı oluşturma sistemi Firebase Authentication entegrasyonu tamamlandı
- July 11, 2025. Personnel rolü kullanıcı yönetimi izinleri eklendi - tüm personel kullanıcı oluşturabilir
- July 11, 2025. Firebase veri depolama alanları: Authentication (kullanıcı hesapları) ve Firestore (veriler)
- July 11, 2025. Firebase Functions deployment hazırlığı tamamlandı - Express backend Firebase Functions'a dönüştürüldü
- July 11, 2025. Firebase deployment konfigürasyonu oluşturuldu - firebase.json, .firebaserc, functions klasör yapısı
- July 11, 2025. Firebase Functions TypeScript hatalarının çoğu düzeltildi - authentication, storage, routes modülleri
- July 11, 2025. Firebase Hosting + Functions birleşik deployment rehberi oluşturuldu
- July 11, 2025. Basit Firebase Functions test modülü oluşturuldu - deployment testi için
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```
