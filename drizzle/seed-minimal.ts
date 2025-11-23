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

    // Create minimal projects (production-like names)
    console.log("\n🌱 Creating minimal projects...\n");
    const minimalProjects = [
      {
        name: "Croro (アイメッドオンライン)",
        description: "医療システム開発プロジェクト",
        isActive: true,
      },
      {
        name: "Miletos (SMCC VPA)",
        description: "VPA基盤システム開発",
        isActive: true,
      },
      {
        name: "estrics",
        description: "不動産管理システム開発",
        isActive: true,
      },
      {
        name: "テラスホールディングス",
        description: "グループ統合基盤システム",
        isActive: true,
      },
      {
        name: "Himalayan",
        description: "決済システム開発プロジェクト",
        isActive: true,
      },
      {
        name: "社内業務効率化",
        description: "社内業務システムの改善プロジェクト",
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

    // Create minimal work categories (production-like categories)
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
        description: "単体テスト・結合テスト・システムテスト",
        displayOrder: 2,
        isActive: true,
      },
      {
        name: "設計",
        description: "要件定義・基本設計・詳細設計",
        displayOrder: 3,
        isActive: true,
      },
      {
        name: "レビュー",
        description: "コードレビュー・ドキュメントレビュー",
        displayOrder: 4,
        isActive: true,
      },
      {
        name: "会議",
        description: "定例会議・打ち合わせ・ミーティング",
        displayOrder: 5,
        isActive: true,
      },
      {
        name: "調査",
        description: "技術調査・問題解析・原因究明",
        displayOrder: 6,
        isActive: true,
      },
      {
        name: "ドキュメント作成",
        description: "仕様書作成・マニュアル作成・議事録作成",
        displayOrder: 7,
        isActive: true,
      },
      {
        name: "その他",
        description: "その他の業務",
        displayOrder: 8,
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
