#!/usr/bin/env tsx
/**
 * Generate individual table documentation pages
 * Creates separate markdown files for each database table in docs/database/tables/
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { is } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../drizzle/schema";

/**
 * Get data type name from Drizzle column
 */
function getDataType(column: PgColumn): string {
  const dataType = column.dataType;

  switch (dataType) {
    case "string":
      if (column.columnType === "PgUUID") return "UUID";
      if (column.columnType === "PgText") return "TEXT";
      return "VARCHAR";
    case "number":
      return "INTEGER";
    case "boolean":
      return "BOOLEAN";
    case "date":
      return "TIMESTAMP";
    default:
      return dataType.toUpperCase();
  }
}

/**
 * Get column constraints description
 */
function getConstraints(column: PgColumn): string[] {
  const constraints: string[] = [];

  if (column.notNull) {
    constraints.push("必須");
  }
  if (column.hasDefault) {
    constraints.push("デフォルト値あり");
  }
  if (column.isUnique) {
    constraints.push("一意制約");
  }
  if (column.primary) {
    constraints.push("主キー");
  }

  return constraints;
}

/**
 * Get description for common column names
 */
function getColumnDescription(columnName: string, column: PgColumn): string {
  const constraints = getConstraints(column);
  const constraintText =
    constraints.length > 0 ? `（${constraints.join("、")}）` : "";

  const descriptions: Record<string, string> = {
    id: "主キー",
    createdAt: "作成日時",
    created_at: "作成日時",
    updatedAt: "更新日時",
    updated_at: "更新日時",
    name: "名前",
    email: "メールアドレス",
    emailVerified: "メール確認日時",
    email_verified: "メール確認日時",
    image: "画像URL",
    passwordHash: "パスワードハッシュ",
    password_hash: "パスワードハッシュ",
    role: "役割・権限",
    description: "説明",
    isActive: "有効状態",
    is_active: "有効状態",
    displayOrder: "表示順序",
    display_order: "表示順序",
    date: "日付",
    hours: "作業時間",
    details: "詳細",
    userId: "ユーザーID（外部キー）",
    user_id: "ユーザーID（外部キー）",
    projectId: "プロジェクトID（外部キー）",
    project_id: "プロジェクトID（外部キー）",
    categoryId: "カテゴリID（外部キー）",
    category_id: "カテゴリID（外部キー）",
    teamId: "チームID（外部キー）",
    team_id: "チームID（外部キー）",
    joinedAt: "参加日時",
    joined_at: "参加日時",
    type: "タイプ",
    provider: "プロバイダー",
    providerAccountId: "プロバイダーアカウントID",
    provider_account_id: "プロバイダーアカウントID",
    refreshToken: "リフレッシュトークン",
    refresh_token: "リフレッシュトークン",
    accessToken: "アクセストークン",
    access_token: "アクセストークン",
    expiresAt: "有効期限",
    expires_at: "有効期限",
    expires: "有効期限",
    tokenType: "トークンタイプ",
    token_type: "トークンタイプ",
    scope: "スコープ",
    idToken: "IDトークン",
    id_token: "IDトークン",
    sessionState: "セッション状態",
    session_state: "セッション状態",
    sessionToken: "セッショントークン",
    session_token: "セッショントークン",
    identifier: "識別子",
    token: "トークン",
  };

  const baseDescription = descriptions[columnName] || columnName;
  return `${baseDescription}${constraintText}`;
}

/**
 * Get table purpose description
 */
function getTablePurpose(tableName: string): string {
  const purposes: Record<string, string> = {
    users:
      "ユーザーアカウント情報を管理します。認証、プロフィール、権限などを保存します。",
    accounts:
      "OAuth認証プロバイダーのアカウント情報を管理します。NextAuth.jsで使用されます。",
    sessions:
      "ユーザーのセッション情報を管理します。NextAuth.jsで使用されます。",
    verificationTokens:
      "メール認証やパスワードリセット用のトークンを管理します。NextAuth.jsで使用されます。",
    projects:
      "プロジェクト情報を管理します。作業ログの分類や統計分析に使用されます。",
    workCategories:
      "作業カテゴリ情報を管理します。作業ログの分類や統計分析に使用されます。",
    workLogs:
      "日々の作業記録を管理します。プロジェクトとカテゴリに紐付けて作業時間を記録します。",
    teams:
      "チーム情報を管理します。メンバーのグループ化や権限管理に使用されます。",
    teamMembers:
      "チームメンバーの所属情報を管理します。ユーザーとチームの多対多の関係を表現します。",
  };

  return (
    purposes[tableName] ||
    "このテーブルはアプリケーションのデータ管理に使用されます。"
  );
}

/**
 * Get related API endpoints for a table
 */
function getRelatedEndpoints(tableName: string): string[] {
  const endpoints: Record<string, string[]> = {
    projects: [
      "GET /api/projects - プロジェクト一覧取得",
      "POST /api/projects - プロジェクト作成",
      "GET /api/projects/{id} - プロジェクト詳細取得",
      "PUT /api/projects/{id} - プロジェクト更新",
      "DELETE /api/projects/{id} - プロジェクト削除（ソフトデリート）",
    ],
    workCategories: [
      "GET /api/work-categories - カテゴリ一覧取得",
      "POST /api/work-categories - カテゴリ作成",
      "GET /api/work-categories/{id} - カテゴリ詳細取得",
      "PUT /api/work-categories/{id} - カテゴリ更新",
      "DELETE /api/work-categories/{id} - カテゴリ削除（ソフトデリート）",
    ],
    workLogs: [
      "GET /api/work-logs - 作業ログ一覧取得",
      "POST /api/work-logs - 作業ログ作成",
      "GET /api/work-logs/{id} - 作業ログ詳細取得",
      "PUT /api/work-logs/{id} - 作業ログ更新",
      "DELETE /api/work-logs/{id} - 作業ログ削除",
      "PUT /api/work-logs/batch - 作業ログ一括更新",
    ],
    teams: [
      "GET /api/teams - チーム一覧取得",
      "POST /api/teams - チーム作成",
      "GET /api/teams/{id} - チーム詳細取得",
      "PUT /api/teams/{id} - チーム更新",
      "DELETE /api/teams/{id} - チーム削除（ソフトデリート）",
      "POST /api/teams/{id}/members - チームメンバー追加",
      "DELETE /api/teams/{id}/members/{userId} - チームメンバー削除",
    ],
    users: [
      "認証エンドポイント - NextAuth.jsによる認証",
      "GET /api/dashboard/personal - 個人統計（ユーザー情報を使用）",
    ],
  };

  return endpoints[tableName] || [];
}

/**
 * Generate documentation for a single table
 */
function generateTableDoc(
  tableName: string,
  table: PgTable,
  allTables: [string, PgTable][],
): string {
  const config = getTableConfig(table);
  let content = `# ${tableName}\n\n`;
  content += `**テーブル名**: \`${config.name}\`\n\n`;

  // Purpose
  content += "## 概要\n\n";
  content += `${getTablePurpose(tableName)}\n\n`;

  // Columns
  content += "## カラム一覧\n\n";
  content += "| カラム名 | データ型 | 説明 |\n";
  content += "|---------|---------|------|\n";

  for (const column of config.columns) {
    const dataType = getDataType(column);
    const description = getColumnDescription(column.name, column);
    content += `| ${column.name} | ${dataType} | ${description} |\n`;
  }
  content += "\n";

  // Foreign keys
  const foreignKeys: Array<{
    column: string;
    references: string;
    table: string;
  }> = [];
  if (config.foreignKeys && config.foreignKeys.length > 0) {
    for (const fk of config.foreignKeys) {
      const refTable = getTableConfig(fk.reference().foreignTable);
      const localColumns = fk
        .reference()
        .columns.map((col) => col.name)
        .join(", ");
      const refColumns = fk
        .reference()
        .foreignColumns.map((col) => col.name)
        .join(", ");

      // Find the schema variable name for the referenced table
      const refTableVarName = allTables.find(
        ([, t]) => getTableConfig(t).name === refTable.name,
      )?.[0];

      foreignKeys.push({
        column: localColumns,
        references: `${refTable.name}(${refColumns})`,
        table: refTableVarName || refTable.name,
      });
    }
  }

  if (foreignKeys.length > 0) {
    content += "## 外部キー制約\n\n";
    for (const fk of foreignKeys) {
      content += `- \`${fk.column}\` → [\`${fk.references}\`](${fk.table}.md)\n`;
    }
    content += "\n";
  }

  // Indexes
  if (config.indexes && config.indexes.length > 0) {
    content += "## インデックス\n\n";
    content += "| インデックス名 | タイプ | カラム |\n";
    content += "|---------------|--------|--------|\n";

    for (const index of config.indexes) {
      const indexColumns = index.config.columns
        .map((col) => {
          if (col && typeof col === "object" && "name" in col) {
            return col.name;
          }
          return "expression";
        })
        .join(", ");
      const indexType = index.config.unique ? "UNIQUE INDEX" : "INDEX";
      content += `| ${index.config.name} | ${indexType} | ${indexColumns} |\n`;
    }
    content += "\n";
  }

  // Related API endpoints
  const endpoints = getRelatedEndpoints(tableName);
  if (endpoints.length > 0) {
    content += "## 関連APIエンドポイント\n\n";
    for (const endpoint of endpoints) {
      content += `- ${endpoint}\n`;
    }
    content += "\n";
    content +=
      "詳細は[API Documentation](../../api/README.md)を参照してください。\n\n";
  }

  // Related tables (reverse relationships)
  const relatedTables: string[] = [];
  for (const [otherTableName, otherTable] of allTables) {
    if (otherTableName === tableName) continue;

    const otherConfig = getTableConfig(otherTable);
    if (otherConfig.foreignKeys && otherConfig.foreignKeys.length > 0) {
      for (const fk of otherConfig.foreignKeys) {
        const refTable = getTableConfig(fk.reference().foreignTable);
        if (refTable.name === config.name) {
          relatedTables.push(otherTableName);
        }
      }
    }
  }

  if (relatedTables.length > 0) {
    content += "## このテーブルを参照しているテーブル\n\n";
    for (const relTable of relatedTables) {
      content += `- [${relTable}](${relTable}.md)\n`;
    }
    content += "\n";
  }

  // Footer
  content += "---\n\n";
  content += `生成日時: ${new Date().toISOString()}\n\n`;
  content += "[← スキーマ概要に戻る](../schema.md)\n";

  return content;
}

/**
 * Main execution
 */
async function generateTableDocs() {
  try {
    console.log("Generating individual table documentation...");

    // Get all tables from schema
    const tables = Object.entries(schema).filter(([_name, table]) =>
      is(table, PgTable),
    ) as [string, PgTable][];

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "docs", "database", "tables");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    // Generate documentation for each table
    let generatedCount = 0;
    for (const [tableName, table] of tables) {
      const docContent = generateTableDoc(tableName, table, tables);
      const outputPath = path.join(outputDir, `${tableName}.md`);
      fs.writeFileSync(outputPath, docContent, "utf-8");
      console.log(`  ✓ Generated: ${tableName}.md`);
      generatedCount++;
    }

    // Generate index file
    let indexContent = "# データベーステーブル詳細ドキュメント\n\n";
    indexContent += `生成日時: ${new Date().toISOString()}\n\n`;
    indexContent += "## テーブル一覧\n\n";

    for (const [tableName, table] of tables) {
      const config = getTableConfig(table);
      const purpose = getTablePurpose(tableName);
      indexContent += `### [${tableName}](${tableName}.md)\n\n`;
      indexContent += `**物理テーブル名**: \`${config.name}\`\n\n`;
      indexContent += `${purpose}\n\n`;
    }

    indexContent += "---\n\n";
    indexContent += "[← スキーマ概要に戻る](../schema.md)\n";

    const indexPath = path.join(outputDir, "README.md");
    fs.writeFileSync(indexPath, indexContent, "utf-8");
    console.log("  ✓ Generated: README.md (index)");

    console.log(
      `\n✅ Successfully generated documentation for ${generatedCount} tables`,
    );
    console.log(`📂 Output directory: ${outputDir}`);
  } catch (error) {
    console.error("❌ Error generating table documentation:", error);
    process.exit(1);
  }
}

generateTableDocs();
