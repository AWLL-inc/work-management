import * as fs from "node:fs";
import * as path from "node:path";
import { pgGenerate } from "drizzle-dbml-generator";
import * as schema from "../drizzle/schema";

/**
 * Generate DBML (Database Markup Language) file from Drizzle schema
 * DBML can be used with dbdiagram.io to visualize database structure
 */
async function generateDBML() {
  try {
    console.log("Generating DBML from Drizzle schema...");

    // Generate DBML content
    const dbml = pgGenerate({ schema });

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "docs", "database");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    // Write DBML file
    const outputPath = path.join(outputDir, "schema.dbml");
    fs.writeFileSync(outputPath, dbml, "utf-8");

    console.log(`✅ DBML file generated successfully: ${outputPath}`);
    console.log("📝 You can visualize this schema at: https://dbdiagram.io/d");
  } catch (error) {
    console.error("❌ Error generating DBML:", error);
    process.exit(1);
  }
}

generateDBML();
