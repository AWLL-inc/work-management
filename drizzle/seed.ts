import "dotenv/config";
import { db } from "@/lib/db/connection";
import { users } from "./schema";
import { hashPassword } from "@/lib/auth-helpers";

/**
 * Seed database with initial test users
 * Run with: npm run db:seed
 */
async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create test users
    const testUsers = [
      {
        name: "Admin User",
        email: "admin@example.com",
        passwordHash: await hashPassword("admin123"),
        role: "admin",
        emailVerified: new Date(),
      },
      {
        name: "Manager User",
        email: "manager@example.com",
        passwordHash: await hashPassword("manager123"),
        role: "manager",
        emailVerified: new Date(),
      },
      {
        name: "Regular User",
        email: "user@example.com",
        passwordHash: await hashPassword("user123"),
        role: "user",
        emailVerified: new Date(),
      },
    ];

    console.log("Creating test users...");
    for (const user of testUsers) {
      const [createdUser] = await db
        .insert(users)
        .values(user)
        .returning({ id: users.id, email: users.email, role: users.role });

      console.log(
        `✓ Created user: ${createdUser.email} (${createdUser.role})`
      );
    }

    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📝 Test credentials:");
    console.log("   Admin:   admin@example.com / admin123");
    console.log("   Manager: manager@example.com / manager123");
    console.log("   User:    user@example.com / user123");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    console.log("\n👋 Seed process finished");
    process.exit(0);
  });
