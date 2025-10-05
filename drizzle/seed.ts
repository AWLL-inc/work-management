import "dotenv/config";
import { hashPassword } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import {
  accounts,
  projects,
  sessions,
  users,
  verificationTokens,
  workCategories,
  workLogs,
} from "./schema";

/**
 * Seed database with initial test data
 * Run with: npm run db:seed
 */
async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Delete all existing data (in reverse order of dependencies)
    console.log("🗑️  Deleting existing data...");

    await db.delete(workLogs);
    console.log("✓ Deleted work logs");

    await db.delete(sessions);
    console.log("✓ Deleted sessions");

    await db.delete(accounts);
    console.log("✓ Deleted accounts");

    await db.delete(verificationTokens);
    console.log("✓ Deleted verification tokens");

    await db.delete(workCategories);
    console.log("✓ Deleted work categories");

    await db.delete(projects);
    console.log("✓ Deleted projects");

    await db.delete(users);
    console.log("✓ Deleted users");

    console.log("\n✅ All existing data deleted");
    console.log("\n🌱 Creating new data...\n");

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
      const [createdUser] = await db.insert(users).values(user).returning();

      console.log(`✓ Created user: ${createdUser.email} (${createdUser.role})`);
    }

    // Create sample projects
    const sampleProjects = [
      {
        name: "Project Alpha",
        description: "First sample project for testing",
        isActive: true,
      },
      {
        name: "Project Beta",
        description: "Second sample project for testing",
        isActive: true,
      },
      {
        name: "Project Gamma",
        description: "Third sample project for testing",
        isActive: true,
      },
      {
        name: "Archived Project",
        description: "An archived project",
        isActive: false,
      },
    ];

    console.log("\nCreating sample projects...");
    for (const project of sampleProjects) {
      const [createdProject] = await db
        .insert(projects)
        .values(project)
        .returning();

      console.log(
        `✓ Created project: ${createdProject.name} (${createdProject.isActive ? "active" : "inactive"})`,
      );
    }

    // Create work categories
    const categories = [
      {
        name: "設計",
        description: "Design and architecture work",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "開発",
        description: "Development and coding work",
        displayOrder: 2,
        isActive: true,
      },
      {
        name: "テスト",
        description: "Testing and QA work",
        displayOrder: 3,
        isActive: true,
      },
      {
        name: "レビュー",
        description: "Code review and documentation review",
        displayOrder: 4,
        isActive: true,
      },
      {
        name: "会議",
        description: "Meetings and discussions",
        displayOrder: 5,
        isActive: true,
      },
    ];

    console.log("\nCreating work categories...");
    for (const category of categories) {
      const [createdCategory] = await db
        .insert(workCategories)
        .values(category)
        .returning();

      console.log(`✓ Created category: ${createdCategory.name}`);
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
