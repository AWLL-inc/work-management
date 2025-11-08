/**
 * Create a test user with passwordResetRequired flag
 * Usage: pnpm tsx scripts/create-test-user.ts [email] [password]
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { users } from "@/drizzle/schema";
import { hashPassword } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

async function createTestUser() {
  const email = process.argv[2] || "testuser@example.com";
  const password = process.argv[3] || "TempPass123";
  const name = process.argv[4] || "Test User";

  console.log("Creating test user...");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log(`Name: ${name}`);

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const [newUser] = await db
    .insert(users)
    .values({
      email,
      name,
      role: "user",
      passwordHash,
      passwordResetRequired: true,
      lastPasswordChange: new Date(),
    })
    .returning();

  console.log("\n✅ User created successfully!");
  console.log(`ID: ${newUser.id}`);
  console.log(`Email: ${newUser.email}`);
  console.log(`Password Reset Required: ${newUser.passwordResetRequired}`);
  console.log(
    `\n🔐 Login credentials:\nEmail: ${email}\nPassword: ${password}`,
  );
  console.log(
    "\n📝 This user will be forced to change password on first login.",
  );

  process.exit(0);
}

createTestUser().catch((error) => {
  console.error("❌ Error creating user:", error);
  process.exit(1);
});
