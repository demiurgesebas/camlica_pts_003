// Menü izinleri ve yapısı
export const MENU_PERMISSIONS = {
  // Dashboard - Ana sayfa
  dashboard: 'dashboard',
  
  // Personel Yönetimi
  personnel: 'personnel',
  personnel_create: 'personnel_create',
  personnel_edit: 'personnel_edit',
  personnel_delete: 'personnel_delete',
  personnel_view: 'personnel_view',
  
  // Şube Yönetimi
  branches: 'branches',
  branches_create: 'branches_create',
  branches_edit: 'branches_edit',
  branches_delete: 'branches_delete',
  
  // Departman Yönetimi
  departments: 'departments',
  departments_create: 'departments_create',
  departments_edit: 'departments_edit',
  departments_delete: 'departments_delete',
  
  // Ekip Yönetimi
  teams: 'teams',
  teams_create: 'teams_create',
  teams_edit: 'teams_edit',
  teams_delete: 'teams_delete',
  
  // Vardiya Yönetimi
  shifts: 'shifts',
  shifts_create: 'shifts_create',
  shifts_edit: 'shifts_edit',
  shifts_delete: 'shifts_delete',
  shifts_assign: 'shifts_assign',
  shifts_import: 'shifts_import',
  
  // Devamsızlık Takibi
  attendance: 'attendance',
  attendance_view: 'attendance_view',
  attendance_edit: 'attendance_edit',
  
  // İzin Yönetimi
  leave_management: 'leave_management',
  leave_approve: 'leave_approve',
  leave_reject: 'leave_reject',
  leave_create: 'leave_create',
  
  // QR Kod Yönetimi
  qr_management: 'qr_management',
  qr_create: 'qr_create',
  qr_view: 'qr_view',
  qr_display: 'qr_display',
  
  // Bildirimler
  notifications: 'notifications',
  
  // Raporlar
  reports: 'reports',
  reports_personnel: 'reports_personnel',
  reports_attendance: 'reports_attendance',
  reports_leaves: 'reports_leaves',
  
  // Görevler
  tasks: 'tasks',
  tasks_create: 'tasks_create',
  tasks_edit: 'tasks_edit',
  tasks_delete: 'tasks_delete',
  
  // Ayarlar
  settings: 'settings',
  
  // Kullanıcı Yönetimi (sadece süper admin)
  user_management: 'user_management',
  user_create: 'user_create',
  user_edit: 'user_edit',
  user_delete: 'user_delete',
  user_permissions: 'user_permissions',
} as const;

export type MenuPermission = typeof MENU_PERMISSIONS[keyof typeof MENU_PERMISSIONS];

// Rol bazlı varsayılan izinler
export const DEFAULT_ROLE_PERMISSIONS: Record<string, MenuPermission[]> = {
  super_admin: Object.values(MENU_PERMISSIONS), // Tüm izinler
  
  admin: [
    MENU_PERMISSIONS.dashboard,
    MENU_PERMISSIONS.personnel,
    MENU_PERMISSIONS.personnel_create,
    MENU_PERMISSIONS.personnel_edit,
    MENU_PERMISSIONS.personnel_delete,
    MENU_PERMISSIONS.personnel_view,
    MENU_PERMISSIONS.branches,
    MENU_PERMISSIONS.branches_create,
    MENU_PERMISSIONS.branches_edit,
    MENU_PERMISSIONS.departments,
    MENU_PERMISSIONS.departments_create,
    MENU_PERMISSIONS.departments_edit,
    MENU_PERMISSIONS.teams,
    MENU_PERMISSIONS.teams_create,
    MENU_PERMISSIONS.teams_edit,
    MENU_PERMISSIONS.shifts,
    MENU_PERMISSIONS.shifts_create,
    MENU_PERMISSIONS.shifts_edit,
    MENU_PERMISSIONS.shifts_assign,
    MENU_PERMISSIONS.shifts_import,
    MENU_PERMISSIONS.attendance,
    MENU_PERMISSIONS.attendance_view,
    MENU_PERMISSIONS.attendance_edit,
    MENU_PERMISSIONS.leave_management,
    MENU_PERMISSIONS.leave_approve,
    MENU_PERMISSIONS.leave_reject,
    MENU_PERMISSIONS.qr_management,
    MENU_PERMISSIONS.qr_create,
    MENU_PERMISSIONS.qr_view,
    MENU_PERMISSIONS.qr_display,
    MENU_PERMISSIONS.notifications,
    MENU_PERMISSIONS.reports,
    MENU_PERMISSIONS.reports_personnel,
    MENU_PERMISSIONS.reports_attendance,
    MENU_PERMISSIONS.reports_leaves,
    MENU_PERMISSIONS.tasks,
    MENU_PERMISSIONS.tasks_create,
    MENU_PERMISSIONS.tasks_edit,
    MENU_PERMISSIONS.settings,
  ],
  
  personnel: [
    MENU_PERMISSIONS.dashboard,
    MENU_PERMISSIONS.personnel_view,
    MENU_PERMISSIONS.personnel,
    MENU_PERMISSIONS.attendance_view,
    MENU_PERMISSIONS.leave_create,
    MENU_PERMISSIONS.leave_management,
    MENU_PERMISSIONS.qr_view,
    MENU_PERMISSIONS.qr_management,
    MENU_PERMISSIONS.notifications,
    MENU_PERMISSIONS.reports,
    MENU_PERMISSIONS.tasks,
    MENU_PERMISSIONS.shifts,
    MENU_PERMISSIONS.branches,
    MENU_PERMISSIONS.departments,
    MENU_PERMISSIONS.teams,
    MENU_PERMISSIONS.user_management,
    MENU_PERMISSIONS.user_create,
    MENU_PERMISSIONS.settings,
    MENU_PERMISSIONS.tasks,
    MENU_PERMISSIONS.attendance,
  ],
};

// Menü kategorileri
export const MENU_CATEGORIES = {
  main: {
    title: 'Ana Menü',
    permissions: [
      MENU_PERMISSIONS.dashboard,
    ]
  },
  personnel_management: {
    title: 'Personel Yönetimi',
    permissions: [
      MENU_PERMISSIONS.personnel,
      MENU_PERMISSIONS.personnel_create,
      MENU_PERMISSIONS.personnel_edit,
      MENU_PERMISSIONS.personnel_delete,
      MENU_PERMISSIONS.personnel_view,
    ]
  },
  organization: {
    title: 'Organizasyon',
    permissions: [
      MENU_PERMISSIONS.branches,
      MENU_PERMISSIONS.branches_create,
      MENU_PERMISSIONS.branches_edit,
      MENU_PERMISSIONS.branches_delete,
      MENU_PERMISSIONS.departments,
      MENU_PERMISSIONS.departments_create,
      MENU_PERMISSIONS.departments_edit,
      MENU_PERMISSIONS.departments_delete,
      MENU_PERMISSIONS.teams,
      MENU_PERMISSIONS.teams_create,
      MENU_PERMISSIONS.teams_edit,
      MENU_PERMISSIONS.teams_delete,
    ]
  },
  shift_management: {
    title: 'Vardiya Yönetimi',
    permissions: [
      MENU_PERMISSIONS.shifts,
      MENU_PERMISSIONS.shifts_create,
      MENU_PERMISSIONS.shifts_edit,
      MENU_PERMISSIONS.shifts_delete,
      MENU_PERMISSIONS.shifts_assign,
      MENU_PERMISSIONS.shifts_import,
    ]
  },
  attendance: {
    title: 'Devamsızlık Takibi',
    permissions: [
      MENU_PERMISSIONS.attendance,
      MENU_PERMISSIONS.attendance_view,
      MENU_PERMISSIONS.attendance_edit,
    ]
  },
  leave_management: {
    title: 'İzin Yönetimi',
    permissions: [
      MENU_PERMISSIONS.leave_management,
      MENU_PERMISSIONS.leave_approve,
      MENU_PERMISSIONS.leave_reject,
      MENU_PERMISSIONS.leave_create,
    ]
  },
  qr_system: {
    title: 'QR Kod Sistemi',
    permissions: [
      MENU_PERMISSIONS.qr_management,
      MENU_PERMISSIONS.qr_create,
      MENU_PERMISSIONS.qr_view,
      MENU_PERMISSIONS.qr_display,
    ]
  },
  communication: {
    title: 'İletişim',
    permissions: [
      MENU_PERMISSIONS.notifications,
    ]
  },
  reports: {
    title: 'Raporlar',
    permissions: [
      MENU_PERMISSIONS.reports,
      MENU_PERMISSIONS.reports_personnel,
      MENU_PERMISSIONS.reports_attendance,
      MENU_PERMISSIONS.reports_leaves,
    ]
  },
  tasks: {
    title: 'Görevler',
    permissions: [
      MENU_PERMISSIONS.tasks,
      MENU_PERMISSIONS.tasks_create,
      MENU_PERMISSIONS.tasks_edit,
      MENU_PERMISSIONS.tasks_delete,
    ]
  },
  system: {
    title: 'Sistem Yönetimi',
    permissions: [
      MENU_PERMISSIONS.settings,
      MENU_PERMISSIONS.user_management,
      MENU_PERMISSIONS.user_create,
      MENU_PERMISSIONS.user_edit,
      MENU_PERMISSIONS.user_delete,
      MENU_PERMISSIONS.user_permissions,
    ]
  }
};

// Menü izinlerinin Türkçe açıklamaları
export const PERMISSION_LABELS: Record<MenuPermission, string> = {
  dashboard: 'Dashboard Görüntüleme',
  
  personnel: 'Personel Modülü Erişimi',
  personnel_create: 'Personel Ekleme',
  personnel_edit: 'Personel Düzenleme',
  personnel_delete: 'Personel Silme',
  personnel_view: 'Personel Görüntüleme',
  
  branches: 'Şube Modülü Erişimi',
  branches_create: 'Şube Ekleme',
  branches_edit: 'Şube Düzenleme',
  branches_delete: 'Şube Silme',
  
  departments: 'Departman Modülü Erişimi',
  departments_create: 'Departman Ekleme',
  departments_edit: 'Departman Düzenleme',
  departments_delete: 'Departman Silme',
  
  teams: 'Ekip Modülü Erişimi',
  teams_create: 'Ekip Ekleme',
  teams_edit: 'Ekip Düzenleme',
  teams_delete: 'Ekip Silme',
  
  shifts: 'Vardiya Modülü Erişimi',
  shifts_create: 'Vardiya Ekleme',
  shifts_edit: 'Vardiya Düzenleme',
  shifts_delete: 'Vardiya Silme',
  shifts_assign: 'Vardiya Atama',
  shifts_import: 'Vardiya Excel İçe Aktarma',
  
  attendance: 'Devamsızlık Modülü Erişimi',
  attendance_view: 'Devamsızlık Görüntüleme',
  attendance_edit: 'Devamsızlık Düzenleme',
  
  leave_management: 'İzin Modülü Erişimi',
  leave_approve: 'İzin Onaylama',
  leave_reject: 'İzin Reddetme',
  leave_create: 'İzin Talep Oluşturma',
  
  qr_management: 'QR Kod Modülü Erişimi',
  qr_create: 'QR Kod Oluşturma',
  qr_view: 'QR Kod Görüntüleme',
  qr_display: 'QR Kod Ekran Görüntüleme',
  
  notifications: 'Bildirimler Modülü',
  
  reports: 'Raporlar Modülü Erişimi',
  reports_personnel: 'Personel Raporları',
  reports_attendance: 'Devamsızlık Raporları',
  reports_leaves: 'İzin Raporları',
  
  tasks: 'Görevler Modülü Erişimi',
  tasks_create: 'Görev Ekleme',
  tasks_edit: 'Görev Düzenleme',
  tasks_delete: 'Görev Silme',
  
  settings: 'Ayarlar Modülü',
  
  user_management: 'Kullanıcı Yönetimi Modülü',
  user_create: 'Kullanıcı Ekleme',
  user_edit: 'Kullanıcı Düzenleme',
  user_delete: 'Kullanıcı Silme',
  user_permissions: 'Kullanıcı İzin Yönetimi',
};