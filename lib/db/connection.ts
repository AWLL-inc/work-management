import { sql as vercelSql } from "@vercel/postgres";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

/**
 * Drizzle ORM database connection
 * Automatically selects the correct driver based on environment:
 * - Vercel production: Uses @vercel/postgres
 * - Local/Docker: Uses postgres driver
 */

// Check if we're in Vercel environment or using Vercel Postgres
const isVercel =
  process.env.VERCEL || process.env.POSTGRES_URL?.includes("vercel-storage");

let db: ReturnType<typeof drizzleVercel> | ReturnType<typeof drizzlePostgres>;

if (isVercel) {
  // Vercel production environment - use Vercel Postgres
  db = drizzleVercel(vercelSql, { schema });
} else {
  // Local or Docker environment - use standard postgres driver
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Database connection string not found. Please set POSTGRES_URL or DATABASE_URL environment variable.",
    );
  }

  // Create postgres connection
  const queryClient = postgres(connectionString, {
    max: 10, // Maximum connections in pool
    idle_timeout: 20,
    connect_timeout: 10,
  });

  db = drizzlePostgres(queryClient, { schema });
}

export { db };

/**
 * Type export for database instance
 */
export type Database = typeof db;
