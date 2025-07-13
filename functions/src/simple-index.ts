import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "camlica-personnel-tracking"
  });
});

// Basic API endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "Firebase Functions is working!",
    timestamp: new Date().toISOString()
  });
});

// Export the Express app as a Firebase Function
export const api = functions.https.onRequest(app);