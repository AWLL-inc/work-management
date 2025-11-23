import "dotenv/config";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/auth-helpers";
import { db } from "@/lib/db/connection";
import {
  accounts,
  projects,
  sessions,
  teamMembers,
  teams,
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

    await db.delete(teamMembers);
    console.log("✓ Deleted team members");

    await db.delete(teams);
    console.log("✓ Deleted teams");

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
        id: "00000000-0000-0000-0000-000000000000",
        name: "Development User",
        email: "dev@example.com",
        passwordHash: await hashPassword("dev123"),
        role: "admin",
        emailVerified: new Date(),
      },
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
      // Additional users for testing user selection
      {
        name: "田中 太郎",
        email: "tanaka@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "佐藤 花子",
        email: "sato@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "鈴木 一郎",
        email: "suzuki@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "高橋 美咲",
        email: "takahashi@example.com",
        passwordHash: await hashPassword("test123"),
        role: "manager",
        emailVerified: new Date(),
      },
      {
        name: "伊藤 健太",
        email: "ito@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "渡辺 由美",
        email: "watanabe@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "山本 誠",
        email: "yamamoto@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "中村 愛",
        email: "nakamura@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "小林 翔太",
        email: "kobayashi@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "加藤 麻衣",
        email: "kato@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
      {
        name: "吉田 大輔",
        email: "yoshida@example.com",
        passwordHash: await hashPassword("test123"),
        role: "user",
        emailVerified: new Date(),
      },
    ];

    console.log("Creating test users...");
    const createdUsers = [];
    for (const user of testUsers) {
      const [createdUser] = await db.insert(users).values(user).returning();
      createdUsers.push(createdUser);
      console.log(`✓ Created user: ${createdUser.email} (${createdUser.role})`);
    }

    // Create sample projects (realistic Japanese project names)
    const sampleProjects = [
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
      {
        name: "新規ECサイト構築",
        description: "新規ECサイト立ち上げプロジェクト",
        isActive: true,
      },
      {
        name: "レガシーシステム刷新",
        description: "旧システムのモダナイゼーション",
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

    // Create work categories (realistic work categories)
    const categories = [
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
        name: "Salesforce実装",
        description: "Salesforce開発・カスタマイズ作業",
        displayOrder: 8,
        isActive: true,
      },
      {
        name: "保守・運用",
        description: "障害対応・メンテナンス・監視",
        displayOrder: 9,
        isActive: true,
      },
      {
        name: "その他",
        description: "その他の業務",
        displayOrder: 10,
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

    // Create teams
    const sampleTeams = [
      {
        name: "開発チーム",
        description: "アプリケーション開発を担当するチーム",
        isActive: true,
      },
      {
        name: "デザインチーム",
        description: "UI/UXデザインを担当するチーム",
        isActive: true,
      },
      {
        name: "QAチーム",
        description: "品質保証を担当するチーム",
        isActive: true,
      },
    ];

    console.log("\nCreating teams...");
    const createdTeams = [];
    for (const team of sampleTeams) {
      const [createdTeam] = await db.insert(teams).values(team).returning();
      createdTeams.push(createdTeam);
      console.log(`✓ Created team: ${createdTeam.name}`);
    }

    // Create team members
    console.log("\nCreating team members...");

    // 開発チーム (Development Team)
    const devTeam = createdTeams[0];
    const devTeamMembers = [
      { userId: createdUsers[2].id, role: "leader" }, // Manager User as leader
      { userId: createdUsers[4].id, role: "member" }, // 田中
      { userId: createdUsers[5].id, role: "member" }, // 佐藤
      { userId: createdUsers[6].id, role: "member" }, // 鈴木
      { userId: createdUsers[8].id, role: "member" }, // 伊藤
    ];

    for (const member of devTeamMembers) {
      await db.insert(teamMembers).values({
        teamId: devTeam.id,
        userId: member.userId,
        role: member.role,
      });
    }
    console.log(`✓ Added ${devTeamMembers.length} members to ${devTeam.name}`);

    // デザインチーム (Design Team)
    const designTeam = createdTeams[1];
    const designTeamMembers = [
      { userId: createdUsers[7].id, role: "leader" }, // 高橋 as leader
      { userId: createdUsers[9].id, role: "member" }, // 渡辺
      { userId: createdUsers[11].id, role: "member" }, // 中村
      { userId: createdUsers[13].id, role: "member" }, // 加藤
    ];

    for (const member of designTeamMembers) {
      await db.insert(teamMembers).values({
        teamId: designTeam.id,
        userId: member.userId,
        role: member.role,
      });
    }
    console.log(
      `✓ Added ${designTeamMembers.length} members to ${designTeam.name}`,
    );

    // QAチーム (QA Team)
    const qaTeam = createdTeams[2];
    const qaTeamMembers = [
      { userId: createdUsers[3].id, role: "leader" }, // Regular User as leader
      { userId: createdUsers[10].id, role: "member" }, // 山本
      { userId: createdUsers[12].id, role: "member" }, // 小林
      { userId: createdUsers[14].id, role: "member" }, // 吉田
    ];

    for (const member of qaTeamMembers) {
      await db.insert(teamMembers).values({
        teamId: qaTeam.id,
        userId: member.userId,
        role: member.role,
      });
    }
    console.log(`✓ Added ${qaTeamMembers.length} members to ${qaTeam.name}`);

    // Create sample work logs for the last 7 days
    const allUsers = await db.select().from(users);
    const allProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.isActive, true));
    const allCategories = await db.select().from(workCategories);

    console.log("\nCreating sample work logs...");
    const workLogsData = [];

    // Generate work logs for the last 7 days
    for (let i = 0; i < 7; i++) {
      const logDate = new Date();
      logDate.setDate(logDate.getDate() - i);

      // Create 2-3 work logs per day across different users
      for (let j = 0; j < Math.floor(Math.random() * 3) + 2; j++) {
        const randomUser =
          allUsers[Math.floor(Math.random() * allUsers.length)];
        const randomProject =
          allProjects[Math.floor(Math.random() * allProjects.length)];
        const randomCategory =
          allCategories[Math.floor(Math.random() * allCategories.length)];

        workLogsData.push({
          date: logDate,
          hours: String(Math.floor(Math.random() * 6) + 2), // 2-8 hours (as string)
          details: `Sample work on ${randomProject.name} - ${randomCategory.name}`,
          userId: randomUser.id,
          projectId: randomProject.id,
          categoryId: randomCategory.id,
        });
      }
    }

    for (const workLog of workLogsData) {
      await db.insert(workLogs).values(workLog);
    }

    console.log(`✓ Created ${workLogsData.length} sample work logs`);

    console.log("\n✅ Seeding completed successfully!");
    console.log("\n📝 Test credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔑 Primary Test Accounts:");
    console.log("   👑 Admin:   admin@example.com / admin123");
    console.log("   👔 Manager: manager@example.com / manager123");
    console.log("   👤 User:    user@example.com / user123");
    console.log("\n🔑 Additional Test Users (all with password: test123):");
    console.log("   📧 tanaka@example.com    - 田中 太郎");
    console.log("   📧 sato@example.com      - 佐藤 花子");
    console.log("   📧 suzuki@example.com    - 鈴木 一郎");
    console.log("   📧 takahashi@example.com - 高橋 美咲 (Manager)");
    console.log("   📧 ito@example.com       - 伊藤 健太");
    console.log("   📧 watanabe@example.com  - 渡辺 由美");
    console.log("   📧 yamamoto@example.com  - 山本 誠");
    console.log("   📧 nakamura@example.com  - 中村 愛");
    console.log("   📧 kobayashi@example.com - 小林 翔太");
    console.log("   📧 kato@example.com      - 加藤 麻衣");
    console.log("   📧 yoshida@example.com   - 吉田 大輔");
    console.log("\n👥 Teams:");
    console.log("   🏢 開発チーム    - Manager User (leader) + 4 members");
    console.log("   🎨 デザインチーム - 高橋 美咲 (leader) + 3 members");
    console.log("   ✅ QAチーム      - Regular User (leader) + 3 members");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
