import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// PostgreSQL artık kullanılmıyor - Firebase Firestore kullanılıyor
// DATABASE_URL opsiyonel hale getirildi
if (!process.env.DATABASE_URL) {
  console.warn("Warning: DATABASE_URL not set. Using Firebase Firestore instead.");
  // Mock database URL for compatibility
  process.env.DATABASE_URL = "postgresql://dummy:dummy@localhost:5432/dummy";
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });