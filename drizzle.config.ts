import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// Load .env.local file
config({ path: ".env.local" });

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL || "",
  },
  verbose: true,
  strict: true,
});
