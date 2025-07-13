const admin = require('firebase-admin');

// Firebase Admin SDK'yı başlat
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./attached_assets/camlica-pts-001-firebase-adminsdk-fbsvc-6f90c8c585_1752234279603.json')),
    projectId: 'camlica-pts-001'
  });
}

async function setSuperAdmin() {
  try {
    const uid = 'PvsPgLkmOjhmOjjoP5OuZCLMcPf1'; // mebil538@gmail.com kullanıcısının UID'si
    const email = 'mebil538@gmail.com';
    
    console.log(`Setting super admin permissions for user: ${email} (UID: ${uid})`);
    
    // Set super admin custom claims
    await admin.auth().setCustomUserClaims(uid, {
      role: 'super_admin',
      permissions: [
        'dashboard',
        'personnel',
        'personnel_create',
        'personnel_edit',
        'personnel_delete',
        'personnel_view',
        'branches',
        'branches_create',
        'branches_edit',
        'branches_delete',
        'departments',
        'departments_create',
        'departments_edit',
        'departments_delete',
        'teams',
        'teams_create',
        'teams_edit',
        'teams_delete',
        'shifts',
        'shifts_create',
        'shifts_edit',
        'shifts_delete',
        'shifts_assign',
        'shifts_import',
        'attendance',
        'attendance_view',
        'attendance_edit',
        'leave_management',
        'leave_approve',
        'leave_reject',
        'leave_create',
        'qr_management',
        'qr_create',
        'qr_view',
        'qr_display',
        'notifications',
        'reports',
        'reports_personnel',
        'reports_attendance',
        'reports_leaves',
        'tasks',
        'tasks_create',
        'tasks_edit',
        'tasks_delete',
        'settings',
        'user_management',
        'user_create',
        'user_edit',
        'user_delete',
        'user_permissions'
      ]
    });
    
    console.log('✅ Super admin permissions set successfully!');
    console.log('User will need to sign out and sign in again for changes to take effect.');
    
    // Verify the changes
    const userRecord = await admin.auth().getUser(uid);
    console.log('User custom claims:', userRecord.customClaims);
    
  } catch (error) {
    console.error('❌ Error setting super admin permissions:', error);
  }
}

setSuperAdmin(); 