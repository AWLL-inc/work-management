import * as fs from "node:fs";
import * as path from "node:path";
import { is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "../drizzle/schema";

/**
 * Generate comprehensive markdown documentation from Drizzle schema
 */
async function generateDatabaseDocs() {
  try {
    console.log("Generating database documentation...");

    let docsContent = "# データベーススキーマドキュメント\n\n";
    docsContent += `生成日時: ${new Date().toISOString()}\n\n`;
    docsContent += "## 概要\n\n";
    docsContent +=
      "このドキュメントは、データベーススキーマの詳細情報（テーブル構造とリレーション）を提供します。\n\n";

    // Get all tables from schema
    const tables = Object.entries(schema).filter(([_name, table]) =>
      is(table, PgTable),
    );

    docsContent += "## 目次\n\n";
    for (const [tableName] of tables) {
      docsContent += `- [${tableName}](#${tableName.toLowerCase().replace(/_/g, "-")})\n`;
    }
    docsContent += "\n---\n\n";

    // Document each table
    for (const [tableName] of tables) {
      docsContent += `## ${tableName}\n\n`;
      docsContent += `テーブル: \`${tableName}\`\n\n`;

      // Standard columns (most tables have these)
      docsContent += "### 共通カラム\n\n";
      docsContent += "| カラム名 | データ型 | 説明 |\n";
      docsContent += "|---------|---------|------|\n";
      docsContent += "| id | UUID | 主キー |\n";
      docsContent += "| createdAt | TIMESTAMP | 作成日時 |\n";
      docsContent += "| updatedAt | TIMESTAMP | 更新日時 |\n";
      docsContent += "\n";

      // Table-specific documentation
      switch (tableName) {
        case "users":
          docsContent += "### 追加カラム\n\n";
          docsContent += "- email: ユーザーのメールアドレス（一意制約）\n";
          docsContent += "- name: ユーザーの表示名\n";
          docsContent += "- password: ハッシュ化されたパスワード\n";
          docsContent += "- role: ユーザーの役割（admin, manager, user）\n";
          break;
        case "projects":
          docsContent += "### 追加カラム\n\n";
          docsContent += "- name: プロジェクト名\n";
          docsContent += "- description: プロジェクトの説明（任意）\n";
          docsContent += "- isActive: 有効状態フラグ\n";
          break;
        case "workCategories":
          docsContent += "### 追加カラム\n\n";
          docsContent += "- name: カテゴリ名\n";
          docsContent += "- description: カテゴリの説明（任意）\n";
          docsContent += "- displayOrder: 表示順序\n";
          docsContent += "- isActive: 有効状態フラグ\n";
          break;
        case "workLogs":
          docsContent += "### 追加カラム\n\n";
          docsContent += "- date: 作業日\n";
          docsContent += "- hours: 作業時間（時間単位）\n";
          docsContent += "- description: 作業内容の説明（任意）\n";
          docsContent += "- userId: ユーザーテーブルへの参照\n";
          docsContent += "- projectId: プロジェクトテーブルへの参照\n";
          docsContent += "- categoryId: 作業カテゴリテーブルへの参照\n";
          break;
        case "teams":
          docsContent += "### 追加カラム\n\n";
          docsContent += "- name: チーム名\n";
          docsContent += "- description: チームの説明（任意）\n";
          docsContent += "- isActive: 有効状態フラグ\n";
          break;
        case "teamMembers":
          docsContent += "### 追加カラム\n\n";
          docsContent += "- teamId: チームテーブルへの参照\n";
          docsContent += "- userId: ユーザーテーブルへの参照\n";
          docsContent += "- role: チームメンバーの役割\n";
          break;
      }

      docsContent += "\n---\n\n";
    }

    // Relationships Overview
    docsContent += "## テーブルリレーション\n\n";
    docsContent += "```mermaid\nerDiagram\n";

    for (const [tableName] of tables) {
      docsContent += `  ${tableName}\n`;
    }

    // Define relationships
    const relationships = [
      ["users", "workLogs"],
      ["projects", "workLogs"],
      ["workCategories", "workLogs"],
      ["teams", "teamMembers"],
      ["users", "teamMembers"],
    ];

    for (const [fromTable, toTable] of relationships) {
      docsContent += `  ${fromTable} ||--o{ ${toTable} : "references"\n`;
    }

    docsContent += "```\n\n";

    // Statistics
    docsContent += "## 統計情報\n\n";
    docsContent += `- テーブル総数: ${tables.length}\n`;

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "docs", "database");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    // Write documentation file
    const outputPath = path.join(outputDir, "schema.md");
    fs.writeFileSync(outputPath, docsContent, "utf-8");

    console.log(
      `✅ Database documentation generated successfully: ${outputPath}`,
    );
    console.log(`📊 Generated documentation for ${tables.length} tables`);
  } catch (error) {
    console.error("❌ Error generating database documentation:", error);
    process.exit(1);
  }
}

generateDatabaseDocs();
