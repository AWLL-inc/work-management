#!/usr/bin/env tsx
/**
 * Validate OpenAPI specification
 * Ensures the generated OpenAPI spec conforms to OpenAPI 3.0 schema
 */

import Ajv from "ajv";
import addFormats from "ajv-formats";
import { openApiSpec } from "../openapi/spec";

// OpenAPI 3.0 Schema (simplified version focusing on critical validations)
const openApiSchema = {
  type: "object",
  required: ["openapi", "info", "paths"],
  properties: {
    openapi: {
      type: "string",
      pattern: "^3\\.0\\.\\d+$",
      description: "OpenAPI version (3.0.x)",
    },
    info: {
      type: "object",
      required: ["title", "version"],
      properties: {
        title: { type: "string" },
        version: { type: "string" },
        description: { type: "string" },
      },
    },
    paths: {
      type: "object",
      patternProperties: {
        "^/": {
          type: "object",
          patternProperties: {
            "^(get|post|put|patch|delete|options|head)$": {
              type: "object",
              properties: {
                summary: { type: "string" },
                description: { type: "string" },
                operationId: { type: "string" },
                parameters: { type: "array" },
                requestBody: { type: "object" },
                responses: { type: "object" },
              },
            },
          },
        },
      },
    },
    components: {
      type: "object",
      properties: {
        schemas: { type: "object" },
        responses: { type: "object" },
        parameters: { type: "object" },
        securitySchemes: { type: "object" },
      },
    },
  },
};

async function validateOpenAPI() {
  try {
    console.log("🔍 Validating OpenAPI specification...");

    // Validate with Ajv
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      allowUnionTypes: true,
    });
    addFormats(ajv);

    const validate = ajv.compile(openApiSchema);
    const valid = validate(openApiSpec);

    if (!valid) {
      console.error("❌ OpenAPI validation failed:");
      console.error(JSON.stringify(validate.errors, null, 2));
      process.exit(1);
    }

    // Additional semantic checks
    const pathCount = Object.keys(openApiSpec.paths || {}).length;
    const schemaCount = Object.keys(
      openApiSpec.components?.schemas || {},
    ).length;

    console.log("✅ OpenAPI specification is valid");
    console.log(`   - Version: ${openApiSpec.openapi}`);
    console.log(`   - Title: ${openApiSpec.info.title}`);
    console.log(`   - API Version: ${openApiSpec.info.version}`);
    console.log(`   - Paths: ${pathCount}`);
    console.log(`   - Schemas: ${schemaCount}`);

    if (pathCount === 0) {
      console.warn("⚠️  Warning: No API paths defined");
    }
    if (schemaCount === 0) {
      console.warn("⚠️  Warning: No component schemas defined");
    }
  } catch (error) {
    console.error("❌ OpenAPI validation error:", error);
    process.exit(1);
  }
}

validateOpenAPI();
