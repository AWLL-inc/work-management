import * as fs from "node:fs";
import * as path from "node:path";
import { is } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import * as schema from "../drizzle/schema";

/**
 * Generate Mermaid ER diagram from Drizzle schema
 * GitHub and many markdown renderers support Mermaid diagrams natively
 */
async function generateMermaidERD() {
  try {
    console.log("Generating Mermaid ER diagram from Drizzle schema...");

    let mermaidContent = "```mermaid\nerDiagram\n";

    // Process all tables in the schema
    const tables = Object.entries(schema).filter(([_name, table]) =>
      is(table, PgTable),
    ) as [string, PgTable][];

    for (const [tableName, _table] of tables) {
      // Add table definition with basic info
      mermaidContent += `\n  ${tableName} {\n`;
      mermaidContent += `    uuid id PK\n`;
      mermaidContent += `    timestamp createdAt\n`;
      mermaidContent += `    timestamp updatedAt\n`;
      mermaidContent += "  }\n";
    }

    // Add basic relationships (manual mapping based on known schema)
    const relationships = [
      ["users", "workLogs", "has many"],
      ["projects", "workLogs", "has many"],
      ["workCategories", "workLogs", "has many"],
      ["teams", "teamMembers", "has many"],
      ["users", "teamMembers", "has many"],
      ["projects", "projectMembers", "has many"],
      ["users", "projectMembers", "has many"],
    ];

    for (const [fromTable, toTable, _relation] of relationships) {
      mermaidContent += `\n  ${fromTable} ||--o{ ${toTable} : "references"`;
    }

    mermaidContent += "\n```\n";

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "docs", "database");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    // Write Mermaid file
    const outputPath = path.join(outputDir, "erd.md");
    fs.writeFileSync(
      outputPath,
      `# Database Entity Relationship Diagram\n\n${mermaidContent}\n`,
      "utf-8",
    );

    console.log(`✅ Mermaid ER diagram generated successfully: ${outputPath}`);
    console.log("📝 This diagram will render automatically on GitHub");
  } catch (error) {
    console.error("❌ Error generating Mermaid ER diagram:", error);
    process.exit(1);
  }
}

generateMermaidERD();
