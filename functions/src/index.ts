import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { setupAllRoutes, setupExcelImportRoutes, setupAdvancedExcelImportRoutes } from "./routes";
import { setupFirebaseAuth } from "./firebaseAuth";

// Firebase Admin will be initialized in firebase.ts

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// --- EXCEL UPLOAD ENDPOINTLERİNİ BURADA EKLE ---
setupExcelImportRoutes(app);
setupAdvancedExcelImportRoutes(app);
// ---------------------------------------------

// Parse JSON bodies
app.use(express.json());

// Setup Firebase Auth middleware
setupFirebaseAuth(app);

// Setup all API routes (Excel upload endpointleri hariç)
setupAllRoutes(app);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "camlica-personnel-tracking",
    environment: "firebase-functions"
  });
});

// Basic API endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Firebase Functions is working!",
    timestamp: new Date().toISOString(),
    user: (req as any).user || "No user authenticated"
  });
});

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message 
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl 
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);
