import { Router } from "express";

const router = Router();

router.get("/health", async (req, res) => {
  try {
    // Basic health check
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development"
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

export default router;