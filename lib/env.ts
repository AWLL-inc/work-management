import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  POSTGRES_URL: z.string().url(),
  POSTGRES_URL_NON_POOLING: z.string().url(),
  DISABLE_AUTH: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  DEV_USER_ID: z
    .string()
    .uuid()
    .optional()
    .default("00000000-0000-0000-0000-000000000000"),
});

export const env = envSchema.parse(process.env);
