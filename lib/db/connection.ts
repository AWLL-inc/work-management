import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import * as schema from "@/drizzle/schema";

/**
 * Drizzle ORM database connection
 * Uses Vercel Postgres with connection pooling
 */
export const db = drizzle(sql, { schema });

/**
 * Type export for database instance
 */
export type Database = typeof db;
