import * as fs from "node:fs";
import * as path from "node:path";
import { is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "../drizzle/schema";

/**
 * Generate Mermaid ER diagram from Drizzle schema
 * GitHub and many markdown renderers support Mermaid diagrams natively
 */
async function generateMermaidERD() {
  try {
    console.log("Generating Mermaid ER diagram from Drizzle schema...");

    const timestamp = new Date().toISOString();
    let mermaidContent = "# Database Entity Relationship Diagram\n\n";
    mermaidContent += `> **自動生成日時**: ${timestamp}\n`;
    mermaidContent += "> **注意**: このファイルは `drizzle/schema.ts` から自動生成されます。直接編集しないでください。\n";
    mermaidContent += "> \n";
    mermaidContent += "> 再生成: `npm run docs:db:mermaid`\n\n";
    mermaidContent += "```mermaid\nerDiagram\n";

    // Process all tables in the schema
    const tables = Object.entries(schema).filter(([_name, table]) =>
      is(table, PgTable),
    ) as [string, PgTable][];

    // Create a mapping from physical table name to schema variable name
    const tableNameMap = new Map<string, string>();
    for (const [varName, table] of tables) {
      const config = getTableConfig(table);
      tableNameMap.set(config.name, varName);
    }

    // Generate table definitions with actual columns
    for (const [tableName, table] of tables) {
      const config = getTableConfig(table);

      // Build a set of foreign key column names from actual FK definitions
      const foreignKeyColumns = new Set<string>();
      if (config.foreignKeys && config.foreignKeys.length > 0) {
        for (const fk of config.foreignKeys) {
          const fkColumns = fk.reference().columns;
          for (const fkCol of fkColumns) {
            foreignKeyColumns.add(fkCol.name);
          }
        }
      }

      mermaidContent += `\n  ${tableName} {\n`;

      // Add all columns from schema
      for (const column of config.columns) {
        let columnType = "string";

        // Map Drizzle data types to Mermaid types
        switch (column.dataType) {
          case "string":
            if (column.columnType === "PgUUID") {
              columnType = "uuid";
            } else if (column.columnType === "PgText") {
              columnType = "text";
            } else {
              columnType = "varchar";
            }
            break;
          case "number":
            columnType = "integer";
            break;
          case "boolean":
            columnType = "boolean";
            break;
          case "date":
            columnType = "timestamp";
            break;
          default:
            columnType = column.dataType;
        }

        // Add primary key notation
        const pkNotation = column.primary ? " PK" : "";
        // Use actual FK definitions instead of naming conventions
        const fkNotation = foreignKeyColumns.has(column.name) ? " FK" : "";

        mermaidContent += `    ${columnType} ${column.name}${pkNotation}${fkNotation}\n`;
      }

      mermaidContent += "  }\n";
    }

    // Generate relationships from foreign keys
    const relationships = new Map<string, Set<string>>();

    for (const [varName, table] of tables) {
      const config = getTableConfig(table);

      if (config.foreignKeys && config.foreignKeys.length > 0) {
        for (const fk of config.foreignKeys) {
          const refTableConfig = getTableConfig(fk.reference().foreignTable);
          const refVarName = tableNameMap.get(refTableConfig.name);

          if (refVarName) {
            if (!relationships.has(refVarName)) {
              relationships.set(refVarName, new Set());
            }
            relationships.get(refVarName)?.add(varName);
          }
        }
      }
    }

    // Add relationships to diagram
    for (const [fromTable, toTables] of relationships.entries()) {
      for (const toTable of toTables) {
        mermaidContent += `  ${fromTable} ||--o{ ${toTable} : "references"\n`;
      }
    }

    mermaidContent += "```\n";

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "docs", "database");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    // Write Mermaid file
    const outputPath = path.join(outputDir, "erd.md");
    fs.writeFileSync(outputPath, mermaidContent, "utf-8");

    console.log(`✅ Mermaid ER diagram generated successfully: ${outputPath}`);
    console.log("📝 This diagram will render automatically on GitHub");
    console.log(`   - ${tables.length} tables documented`);
    console.log(`   - ${relationships.size} relationships mapped`);
  } catch (error) {
    console.error("❌ Error generating Mermaid ER diagram:");
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
    console.error(
      "   - Verify all foreign key definitions are correctly configured",
    );
    console.error("   - Check that table relationships are properly defined");
    console.error("   - Ensure output directory docs/database/ is writable");
    console.error(
      "   - Verify Mermaid syntax is compatible with your renderer",
    );
    process.exit(1);
  }
}

generateMermaidERD();
