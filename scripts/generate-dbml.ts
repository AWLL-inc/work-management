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

    // Add generation metadata header
    const timestamp = new Date().toISOString();
    const dbmlWithHeader = `// Database Markup Language (DBML) Schema
// 自動生成日時: ${timestamp}
// 注意: このファイルは drizzle/schema.ts から自動生成されます。直接編集しないでください。
// 再生成: npm run docs:db:dbml
// 可視化: https://dbdiagram.io/d

${dbml}`;

    // Ensure output directory exists
    const outputDir = path.join(process.cwd(), "docs", "database");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }

    // Write DBML file
    const outputPath = path.join(outputDir, "schema.dbml");
    fs.writeFileSync(outputPath, dbmlWithHeader, "utf-8");

    console.log(`✅ DBML file generated successfully: ${outputPath}`);
    console.log("📝 You can visualize this schema at: https://dbdiagram.io/d");
  } catch (error) {
    console.error("❌ Error generating DBML:");
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
    console.error("   - Check that all table definitions are correct");
    console.error("   - Verify drizzle-dbml-generator package is installed");
    console.error(
      "   - Run 'npm install' to ensure dependencies are up to date",
    );
    process.exit(1);
  }
}

generateDBML();
