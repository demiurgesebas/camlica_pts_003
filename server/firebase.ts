import { initializeApp as initializeAdminApp, cert, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
let adminApp;
try {
  // Check if already initialized
  if (getApps().length === 0) {
    // Read service account key from file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || 
      './attached_assets/camlica-pts-001-firebase-adminsdk-fbsvc-6f90c8c585_1752234279603.json';
    
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    adminApp = initializeAdminApp({
      credential: cert(serviceAccount),
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
    
    console.log('✅ Firebase Admin initialized successfully');
  } else {
    adminApp = getApps()[0];
    console.log('✅ Firebase Admin already initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error);
  throw error;
}

// Export Firebase Admin services
export const adminAuth = getAdminAuth(adminApp);
export const adminDb = getAdminFirestore(adminApp);

// Helper function to verify Firebase ID tokens
export async function verifyFirebaseToken(idToken: string) {
  try {
    console.log('Verifying Firebase token...');
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    console.log('Token verified successfully for user:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    console.error('Token preview:', idToken.substring(0, 20) + '...');
    throw error;
  }
}

// Helper function to get user by UID
export async function getFirebaseUser(uid: string) {
  try {
    const userRecord = await adminAuth.getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Get user failed:', error);
    throw error;
  }
}

// Helper function to create custom claims
export async function setCustomClaims(uid: string, claims: Record<string, any>) {
  try {
    await adminAuth.setCustomUserClaims(uid, claims);
    return true;
  } catch (error) {
    console.error('Set custom claims failed:', error);
    throw error;
  }
}

// Helper function to create a new user with Firebase Authentication
export async function createFirebaseUser(userData: {
  email: string;
  password: string;
  displayName?: string;
  role: string;
  permissions: string[];
}) {
  try {
    console.log('Creating Firebase user with email:', userData.email);
    
    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName || `${userData.email.split('@')[0]}`,
      emailVerified: false,
    });
    
    console.log('Firebase user created successfully:', userRecord.uid);
    
    // Set custom claims for role and permissions
    await setCustomClaims(userRecord.uid, {
      role: userData.role,
      permissions: userData.permissions,
    });
    
    console.log('Custom claims set for user:', userRecord.uid);
    
    return userRecord;
  } catch (error) {
    console.error('Firebase user creation failed:', error);
    throw error;
  }
}

// Helper function to update user email and password
export async function updateFirebaseUser(uid: string, updateData: {
  email?: string;
  password?: string;
  displayName?: string;
  role?: string;
  permissions?: string[];
}) {
  try {
    console.log('Updating Firebase user:', uid);
    
    // Update user in Firebase Auth
    const updatePayload: any = {};
    if (updateData.email) updatePayload.email = updateData.email;
    if (updateData.password) updatePayload.password = updateData.password;
    if (updateData.displayName) updatePayload.displayName = updateData.displayName;
    
    if (Object.keys(updatePayload).length > 0) {
      await adminAuth.updateUser(uid, updatePayload);
    }
    
    // Update custom claims if needed
    if (updateData.role || updateData.permissions) {
      await setCustomClaims(uid, {
        role: updateData.role,
        permissions: updateData.permissions,
      });
    }
    
    console.log('Firebase user updated successfully:', uid);
    
    return await getFirebaseUser(uid);
  } catch (error) {
    console.error('Firebase user update failed:', error);
    throw error;
  }
}

// Helper function to delete Firebase user
export async function deleteFirebaseUser(uid: string) {
  try {
    console.log('Deleting Firebase user:', uid);
    await adminAuth.deleteUser(uid);
    console.log('Firebase user deleted successfully:', uid);
    return true;
  } catch (error) {
    console.error('Firebase user deletion failed:', error);
    throw error;
  }
}

export default adminApp;