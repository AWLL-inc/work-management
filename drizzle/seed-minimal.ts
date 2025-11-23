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

    // Create minimal projects
    console.log("\n🌱 Creating minimal projects...\n");
    const minimalProjects = [
      {
        name: "サンプルプロジェクト A",
        description: "開発用サンプルプロジェクト",
        isActive: true,
      },
      {
        name: "サンプルプロジェクト B",
        description: "テスト用サンプルプロジェクト",
        isActive: true,
      },
      {
        name: "サンプルプロジェクト C",
        description: "デモ用サンプルプロジェクト",
        isActive: true,
      },
    ];

    for (const project of minimalProjects) {
      const [createdProject] = await db
        .insert(projects)
        .values(project)
        .returning();
      console.log(`✓ Created project: ${createdProject.name}`);
    }

    // Create minimal work categories
    console.log("\n🌱 Creating minimal work categories...\n");
    const minimalCategories = [
      {
        name: "コーディング",
        description: "プログラミング・実装作業",
        displayOrder: 1,
        isActive: true,
      },
      {
        name: "テスト",
        description: "テスト・品質保証作業",
        displayOrder: 2,
        isActive: true,
      },
      {
        name: "会議",
        description: "ミーティング・打ち合わせ",
        displayOrder: 3,
        isActive: true,
      },
      {
        name: "その他",
        description: "その他の業務",
        displayOrder: 4,
        isActive: true,
      },
    ];

    for (const category of minimalCategories) {
      const [createdCategory] = await db
        .insert(workCategories)
        .values(category)
        .returning();
      console.log(`✓ Created category: ${createdCategory.name}`);
    }

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
