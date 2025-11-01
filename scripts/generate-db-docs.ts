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

    let docsContent = "# Database Schema Documentation\n\n";
    docsContent += `Generated: ${new Date().toISOString()}\n\n`;
    docsContent += "## Overview\n\n";
    docsContent +=
      "This document provides information about the database schema, including tables and relationships.\n\n";

    // Get all tables from schema
    const tables = Object.entries(schema).filter(([_name, table]) =>
      is(table, PgTable),
    );

    docsContent += "## Table of Contents\n\n";
    for (const [tableName] of tables) {
      docsContent += `- [${tableName}](#${tableName.toLowerCase().replace(/_/g, "-")})\n`;
    }
    docsContent += "\n---\n\n";

    // Document each table
    for (const [tableName] of tables) {
      docsContent += `## ${tableName}\n\n`;
      docsContent += `Table: \`${tableName}\`\n\n`;

      // Standard columns (most tables have these)
      docsContent += "### Common Columns\n\n";
      docsContent += "| Column Name | Data Type | Description |\n";
      docsContent += "|-------------|-----------|-------------|\n";
      docsContent += "| id | UUID | Primary key |\n";
      docsContent += "| createdAt | TIMESTAMP | Creation timestamp |\n";
      docsContent += "| updatedAt | TIMESTAMP | Last update timestamp |\n";
      docsContent += "\n";

      // Table-specific documentation
      switch (tableName) {
        case "users":
          docsContent += "### Additional Columns\n\n";
          docsContent += "- email: User email address (unique)\n";
          docsContent += "- name: User display name\n";
          docsContent += "- password: Hashed password\n";
          docsContent += "- role: User role (admin, manager, user)\n";
          break;
        case "projects":
          docsContent += "### Additional Columns\n\n";
          docsContent += "- name: Project name\n";
          docsContent += "- description: Project description (optional)\n";
          docsContent += "- isActive: Active status flag\n";
          break;
        case "workCategories":
          docsContent += "### Additional Columns\n\n";
          docsContent += "- name: Category name\n";
          docsContent += "- description: Category description (optional)\n";
          docsContent += "- displayOrder: Sort order for display\n";
          docsContent += "- isActive: Active status flag\n";
          break;
        case "workLogs":
          docsContent += "### Additional Columns\n\n";
          docsContent += "- date: Work date\n";
          docsContent += "- hours: Hours worked (decimal)\n";
          docsContent += "- description: Work description (optional)\n";
          docsContent += "- userId: Reference to users table\n";
          docsContent += "- projectId: Reference to projects table\n";
          docsContent += "- categoryId: Reference to workCategories table\n";
          break;
        case "teams":
          docsContent += "### Additional Columns\n\n";
          docsContent += "- name: Team name\n";
          docsContent += "- description: Team description (optional)\n";
          docsContent += "- isActive: Active status flag\n";
          break;
        case "teamMembers":
          docsContent += "### Additional Columns\n\n";
          docsContent += "- teamId: Reference to teams table\n";
          docsContent += "- userId: Reference to users table\n";
          docsContent += "- role: Team member role\n";
          break;
      }

      docsContent += "\n---\n\n";
    }

    // Relationships Overview
    docsContent += "## Relationships Overview\n\n";
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
    docsContent += "## Statistics\n\n";
    docsContent += `- Total Tables: ${tables.length}\n`;

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
