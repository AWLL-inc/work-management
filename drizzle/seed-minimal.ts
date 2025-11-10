import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { hashPassword } from "@/lib/auth-helpers";
import * as schema from "./schema";

const {
  accounts,
  projects,
  sessions,
  teamMembers,
  teams,
  users,
  verificationTokens,
  workCategories,
  workLogs,
} = schema;

/**
 * Minimal seed: Create only system user
 * Run with: NODE_ENV=development tsx drizzle/seed-minimal.ts
 */
async function seedMinimal() {
  const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "POSTGRES_URL or DATABASE_URL environment variable is required",
    );
  }

  // Create dedicated connection for seeding
  const queryClient = postgres(connectionString, { max: 1 });
  const db = drizzle(queryClient, { schema });

  console.log("🌱 Minimal seeding - Creating system user only...");

  try {
    // Delete all existing data (in reverse order of dependencies)
    console.log("🗑️  Deleting existing data...");

    await db.delete(workLogs);
    await db.delete(teamMembers);
    await db.delete(teams);
    await db.delete(sessions);
    await db.delete(accounts);
    await db.delete(verificationTokens);
    await db.delete(workCategories);
    await db.delete(projects);
    await db.delete(users);

    console.log("✅ All existing data deleted");
    console.log("\n🌱 Creating system user...\n");

    // Create system user only
    const systemUser = {
      id: "00000000-0000-0000-0000-000000000000",
      name: "System Admin",
      email: "admin@example.com",
      passwordHash: await hashPassword("admin123"),
      role: "admin",
      emailVerified: new Date(),
    };

    const [createdUser] = await db.insert(users).values(systemUser).returning();
    console.log(
      `✓ Created system user: ${createdUser.email} (${createdUser.role})`,
    );

    console.log("\n✅ Minimal seeding completed successfully!");
    console.log("\n📝 Login credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("   👑 Admin: admin@example.com / admin123");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Close database connection
    await queryClient.end();
  } catch (error) {
    console.error("❌ Minimal seeding failed:", error);
    throw error;
  }
}

seedMinimal()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("\n👋 Seed process finished");
    process.exit(0);
  });
