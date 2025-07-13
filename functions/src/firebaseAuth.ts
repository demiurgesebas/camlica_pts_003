import { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";

// Firebase Auth middleware
export async function authenticateFirebase(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No valid authorization header" });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Add user info to request
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Role-based middleware
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

// Admin middleware
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (user.role !== "admin" && user.role !== "super_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}

// Super Admin middleware
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (user.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }

  next();
}

// Personnel middleware
export function requirePersonnel(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (!["personnel", "admin", "super_admin"].includes(user.role)) {
    return res.status(403).json({ error: "Personnel access required" });
  }

  next();
}

// Setup Firebase Auth for Express app
export async function setupFirebaseAuth(app: any) {
  // Add authentication middleware to all API routes
  app.use("/api", authenticateFirebase);
  
  console.log("✅ Firebase Auth middleware configured");
} 