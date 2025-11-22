import * as fs from "node:fs";
import * as path from "node:path";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../drizzle/schema";
import { getColumnDescription, getDataType } from "./utils/db-helpers";
import {
  DB_TROUBLESHOOTING_TIPS,
  handleScriptError,
} from "./utils/error-handler";

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
    docsContent +=
      "> **注意**: このファイルは `drizzle/schema.ts` から自動生成されます。直接編集しないでください。\n";
    docsContent += "> \n";
    docsContent += "> 再生成: `npm run docs:db:markdown`\n\n";
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
    handleScriptError(error, {
      scriptName: "generate-db-docs",
      troubleshootingTips: [
        ...DB_TROUBLESHOOTING_TIPS,
        "Ensure output directory docs/database/ is writable",
      ],
    });
  }
}

generateDatabaseDocs();
