import type { Express, Request, Response, NextFunction } from "express";
import { adminAuth, verifyFirebaseToken } from "./firebase";
import { firebaseStorage } from "./firebaseStorage";
import { DEFAULT_ROLE_PERMISSIONS } from "@shared/menuPermissions";

// Extend Request interface to include Firebase user
declare global {
  namespace Express {
    interface Request {
      firebaseUser?: any;
      user?: any;
    }
  }
}

// Firebase Authentication middleware
export const authenticateFirebase = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authentication token provided' });
    }

    const idToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify Firebase ID token
    console.log('Authenticating user with Firebase token...');
    const decodedToken = await verifyFirebaseToken(idToken);
    
    // Get or create user in our database - always fresh from Firebase
    let user = await firebaseStorage.getUser(decodedToken.uid);
    
    if (!user) {
      // Create new user if doesn't exist
      const newUserData = {
        id: decodedToken.uid,
        email: decodedToken.email || '',
        firstName: decodedToken.name?.split(' ')[0] || '',
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
        role: 'personnel', // Default role
        permissions: DEFAULT_ROLE_PERMISSIONS.personnel,
        isActive: true,
        lastLogin: new Date(),
      };
      
      // Only add profileImageUrl if it exists
      if (decodedToken.picture) {
        newUserData.profileImageUrl = decodedToken.picture;
      }
      
      user = await firebaseStorage.upsertUser(newUserData);
    } else {
      // Force refresh user data from Firebase to get latest role/permissions
      console.log('User found, refreshing data from Firebase...');
      user = await firebaseStorage.getUser(decodedToken.uid);
    }

    // Attach user to request
    req.firebaseUser = decodedToken;
    req.user = {
      ...user,
      claims: decodedToken,
    };

    next();
  } catch (error) {
    console.error('Firebase authentication error:', error);
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Role-based authorization middleware
export const requireRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    
    // Super admin has access to everything
    if (userRole === 'super_admin') {
      return next();
    }

    // Check if user has required role
    if (userRole !== requiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = req.user.permissions || [];
    
    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check if user has required permission
    if (!userPermissions.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Convenience middleware functions
export const isAuthenticated = authenticateFirebase;

export const requireSuperAdmin = [
  authenticateFirebase,
  requireRole('super_admin')
];

export const requireAdmin = [
  authenticateFirebase,
  (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }
    return res.status(403).json({ error: 'Admin access required' });
  }
];

export const requirePersonnel = [
  authenticateFirebase,
  (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (['super_admin', 'admin', 'personnel'].includes(userRole)) {
      return next();
    }
    return res.status(403).json({ error: 'Personnel access required' });
  }
];

// Helper function to get current user
export const getCurrentUser = (req: Request) => {
  return req.user;
};

// Helper function to check if user has permission
export const hasPermission = (user: any, permission: string): boolean => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  
  const userPermissions = user.permissions || [];
  return userPermissions.includes(permission);
};

// Helper function to get user session info
export const getSession = (req: Request) => {
  return {
    user: req.user,
    firebaseUser: req.firebaseUser,
    isAuthenticated: !!req.user,
  };
};

// Setup Firebase authentication
export async function setupFirebaseAuth(app: Express) {
  // Health check endpoint
  app.get('/api/auth/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      auth: 'firebase',
      timestamp: new Date().toISOString() 
    });
  });

  // Get current user endpoint
  app.get('/api/auth/user', authenticateFirebase, (req, res) => {
    res.json({
      user: req.user,
      session: getSession(req),
    });
  });

  // Update user profile endpoint
  app.put('/api/auth/user', authenticateFirebase, async (req, res) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      // Don't allow role/permission changes through this endpoint
      delete updateData.role;
      delete updateData.permissions;
      delete updateData.id;
      
      const updatedUser = await firebaseStorage.upsertUser({
        ...req.user,
        ...updateData,
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });

  // Logout endpoint (client-side will handle Firebase signOut)
  app.post('/api/auth/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
  });

  console.log('✅ Firebase Authentication setup complete');
}

export default {
  setupFirebaseAuth,
  authenticateFirebase,
  requireRole,
  requirePermission,
  isAuthenticated,
  requireSuperAdmin,
  requireAdmin,
  requirePersonnel,
  getCurrentUser,
  hasPermission,
  getSession,
};