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

    let mermaidContent = "# Database Entity Relationship Diagram\n\n";
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
        const fkNotation =
          column.name.endsWith("_id") && !column.primary ? " FK" : "";

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
    console.error("❌ Error generating Mermaid ER diagram:", error);
    process.exit(1);
  }
}

generateMermaidERD();
