import * as fs from "node:fs";
import * as path from "node:path";
import { is } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../drizzle/schema";

/**
 * Get Japanese data type name from Drizzle column
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
 * Get column constraints description in Japanese
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
 * Get Japanese description for common column names
 */
function getColumnDescription(columnName: string, column: PgColumn): string {
  const constraints = getConstraints(column);
  const constraintText =
    constraints.length > 0 ? `（${constraints.join("、")}）` : "";

  // Common column patterns
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
 * Extract foreign key relationships from table config
 */
function extractRelationships(
  tables: [string, PgTable][],
): Map<string, string[]> {
  const relationships = new Map<string, string[]>();

  for (const [tableName, table] of tables) {
    const config = getTableConfig(table);

    // Check table-level foreign keys
    if (config.foreignKeys && config.foreignKeys.length > 0) {
      for (const fk of config.foreignKeys) {
        const referencedTableName = getTableConfig(
          fk.reference().foreignTable,
        ).name;

        if (!relationships.has(referencedTableName)) {
          relationships.set(referencedTableName, []);
        }
        relationships.get(referencedTableName)?.push(tableName);
      }
    }
  }

  return relationships;
}

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
      "このドキュメントは、Drizzle ORMスキーマから自動生成されたデータベース構造の詳細情報です。\n\n";

    // Get all tables from schema
    const tables = Object.entries(schema).filter(([_name, table]) =>
      is(table, PgTable),
    ) as [string, PgTable][];

    // Extract relationships
    const relationships = extractRelationships(tables);

    docsContent += "## 目次\n\n";
    for (const [tableName] of tables) {
      docsContent += `- [${tableName}](#${tableName.toLowerCase().replace(/_/g, "-")})\n`;
    }
    docsContent += "\n---\n\n";

    // Document each table
    for (const [tableName, table] of tables) {
      const config = getTableConfig(table);

      docsContent += `## ${tableName}\n\n`;
      docsContent += `テーブル名: \`${config.name}\`\n\n`;

      // Table columns
      docsContent += "### カラム一覧\n\n";
      docsContent += "| カラム名 | データ型 | 説明 |\n";
      docsContent += "|---------|---------|------|\n";

      for (const column of config.columns) {
        const dataType = getDataType(column);
        const description = getColumnDescription(column.name, column);
        docsContent += `| ${column.name} | ${dataType} | ${description} |\n`;
      }
      docsContent += "\n";

      // Indexes (if any)
      if (config.indexes && config.indexes.length > 0) {
        docsContent += "### インデックス\n\n";
        for (const index of config.indexes) {
          const indexColumns = index.config.columns
            .map((col) => {
              // Handle both SQL expressions and column objects
              if (col && typeof col === "object" && "name" in col) {
                return col.name;
              }
              return "expression";
            })
            .join(", ");
          const indexType = index.config.unique ? "UNIQUE INDEX" : "INDEX";
          docsContent += `- \`${index.config.name}\`: ${indexType} (${indexColumns})\n`;
        }
        docsContent += "\n";
      }

      // Foreign keys (from table-level configuration)
      const foreignKeys: Array<{ column: string; references: string }> = [];
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
          foreignKeys.push({
            column: localColumns,
            references: `${refTable.name}(${refColumns})`,
          });
        }
      }

      if (foreignKeys.length > 0) {
        docsContent += "### 外部キー制約\n\n";
        for (const fk of foreignKeys) {
          docsContent += `- \`${fk.column}\` → \`${fk.references}\`\n`;
        }
        docsContent += "\n";
      }

      docsContent += "---\n\n";
    }

    // Relationships Overview
    docsContent += "## テーブルリレーション\n\n";
    docsContent += "```mermaid\nerDiagram\n";

    for (const [tableName] of tables) {
      docsContent += `  ${tableName}\n`;
    }

    // Generate relationships from foreign keys
    const processedRelationships = new Set<string>();
    for (const [fromTable, toTables] of relationships.entries()) {
      for (const toTable of toTables) {
        const relationKey = `${fromTable}-${toTable}`;
        if (!processedRelationships.has(relationKey)) {
          docsContent += `  ${fromTable} ||--o{ ${toTable} : "references"\n`;
          processedRelationships.add(relationKey);
        }
      }
    }

    docsContent += "```\n\n";

    // Statistics
    docsContent += "## 統計情報\n\n";
    docsContent += `- テーブル総数: ${tables.length}\n`;
    let totalColumns = 0;
    let totalIndexes = 0;
    let totalForeignKeys = 0;

    for (const [, table] of tables) {
      const config = getTableConfig(table);
      totalColumns += config.columns.length;
      totalIndexes += config.indexes?.length || 0;
      totalForeignKeys += config.foreignKeys?.length || 0;
    }

    docsContent += `- カラム総数: ${totalColumns}\n`;
    docsContent += `- インデックス総数: ${totalIndexes}\n`;
    docsContent += `- 外部キー総数: ${totalForeignKeys}\n`;

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
    console.log(`   - ${totalColumns} columns`);
    console.log(`   - ${totalIndexes} indexes`);
    console.log(`   - ${totalForeignKeys} foreign keys`);
  } catch (error) {
    console.error("❌ Error generating database documentation:");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack) {
        console.error(`   Stack trace:\n${error.stack}`);
      }
    } else {
      console.error(`   Unknown error: ${String(error)}`);
    }
    console.error("\n💡 Troubleshooting tips:");
    console.error("   - Ensure drizzle/schema.ts is valid and can be imported");
    console.error("   - Verify all table configurations have proper structure");
    console.error("   - Check that foreign key references are valid");
    console.error("   - Ensure output directory docs/database/ is writable");
    console.error("   - Run 'npm run db:generate' if schema changes were made");
    process.exit(1);
  }
}

generateDatabaseDocs();
