#!/usr/bin/env tsx
/**
 * OpenAPI Specification Generator
 * Automatically generates OpenAPI 3.0 specification from Zod schemas and API routes
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Generate OpenAPI specification
 * This script creates a comprehensive OpenAPI spec for all API endpoints
 *
 * MAINTENANCE GUIDE:
 * When adding new API endpoints:
 * 1. Add request/response schemas to the 'schemas' section below
 * 2. Add endpoint paths to the 'paths' section
 * 3. Run 'npm run docs:openapi' to regenerate openapi/spec.ts
 * 4. Verify the generated spec at http://localhost:3000/en/api-docs
 *
 * Schema Organization:
 * - Common Response Schemas: ApiSuccessResponse, ApiErrorResponse
 * - Entity Schemas: Project, WorkCategory, WorkLog, Team, etc.
 * - Request Schemas: Create*, Update* requests for each entity
 * - Dashboard Schemas: Statistics and aggregated data schemas
 */
function generateOpenApiSpec() {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "Work Management API",
      version: "1.0.0",
      description:
        "RESTful API for Work Management application - Task management, user collaboration, and project organization",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
      {
        url: "https://work-management-eosin.vercel.app",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT authentication token from NextAuth.js",
        },
      },
      schemas: {
        // Common Response Schemas
        ApiSuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {
              type: "object",
              description: "Response data payload",
            },
          },
          required: ["success", "data"],
        },
        ApiErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                code: { type: "string", description: "Error code" },
                message: { type: "string", description: "Error message" },
                details: {
                  type: "object",
                  description: "Additional error details",
                },
              },
              required: ["code", "message"],
            },
          },
          required: ["success", "error"],
        },

        // Project Schemas
        Project: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "isActive"],
        },
        CreateProjectRequest: {
          type: "object",
          properties: {
            name: {
              type: "string",
              maxLength: 255,
              description: "Project name",
            },
            description: {
              type: "string",
              nullable: true,
              description: "Optional project description",
            },
            isActive: {
              type: "boolean",
              default: true,
              description: "Whether the project is active",
            },
          },
          required: ["name"],
        },
        UpdateProjectRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            isActive: { type: "boolean" },
          },
        },

        // Work Category Schemas
        WorkCategory: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            displayOrder: { type: "integer", minimum: 0 },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "displayOrder", "isActive"],
        },
        CreateWorkCategoryRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            displayOrder: { type: "integer", minimum: 0, default: 0 },
            isActive: { type: "boolean", default: true },
          },
          required: ["name"],
        },
        UpdateWorkCategoryRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            displayOrder: { type: "integer", minimum: 0 },
            isActive: { type: "boolean" },
          },
        },

        // Work Log Schemas
        WorkLog: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            date: { type: "string", format: "date" },
            hours: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
            projectId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid" },
            details: { type: "string", maxLength: 1000, nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "userId",
            "date",
            "hours",
            "projectId",
            "categoryId",
          ],
        },
        CreateWorkLogRequest: {
          type: "object",
          properties: {
            date: { type: "string", format: "date" },
            hours: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
            projectId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid" },
            details: { type: "string", maxLength: 1000, nullable: true },
          },
          required: ["date", "hours", "projectId", "categoryId"],
        },
        UpdateWorkLogRequest: {
          type: "object",
          properties: {
            date: { type: "string", format: "date" },
            hours: { type: "string", pattern: "^\\d+(\\.\\d{1,2})?$" },
            projectId: { type: "string", format: "uuid" },
            categoryId: { type: "string", format: "uuid" },
            details: { type: "string", maxLength: 1000, nullable: true },
          },
        },

        // Team Schemas
        Team: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: ["id", "name", "isActive"],
        },
        CreateTeamRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
          },
          required: ["name"],
        },
        UpdateTeamRequest: {
          type: "object",
          properties: {
            name: { type: "string", maxLength: 255 },
            description: { type: "string", nullable: true },
            isActive: { type: "boolean" },
          },
        },
        AddTeamMemberRequest: {
          type: "object",
          properties: {
            userId: { type: "string", format: "uuid" },
            role: {
              type: "string",
              enum: ["member", "leader", "viewer"],
              default: "member",
            },
          },
          required: ["userId"],
        },

        // Dashboard Schemas
        PersonalStats: {
          type: "object",
          properties: {
            totalHours: { type: "number" },
            workDays: { type: "integer" },
            activeProjects: { type: "integer" },
            topCategories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  categoryId: { type: "string", format: "uuid" },
                  categoryName: { type: "string" },
                  hours: { type: "number" },
                },
              },
            },
          },
        },
      },
    },
    paths: {
      // Projects API
      "/api/projects": {
        get: {
          summary: "List all projects",
          description:
            "Retrieve a list of all projects, optionally filtered by active status",
          tags: ["Projects"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "active",
              in: "query",
              schema: { type: "boolean" },
              description: "Filter by active status",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved projects list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Project" },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a new project",
          description:
            "Create a new project with the provided details. Admin role required.",
          tags: ["Projects"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProjectRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Successfully created project",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            409: {
              description: "Project with this name already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/projects/{id}": {
        get: {
          summary: "Get project by ID",
          description: "Retrieve a specific project by its ID",
          tags: ["Projects"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Project ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved project",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Project not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update project",
          description: "Update an existing project. Admin role required.",
          tags: ["Projects"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Project ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateProjectRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Successfully updated project",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Project" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Project not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete project (soft delete)",
          description:
            "Soft delete a project by setting isActive to false. Admin role required.",
          tags: ["Projects"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Project ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully deleted project",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Project not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },

      // Work Categories API
      "/api/work-categories": {
        get: {
          summary: "List all work categories",
          description:
            "Retrieve a list of all work categories, optionally filtered by active status",
          tags: ["Work Categories"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "active",
              in: "query",
              schema: { type: "boolean" },
              description: "Filter by active status",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved work categories list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/WorkCategory" },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a new work category",
          description:
            "Create a new work category with the provided details. Admin role required.",
          tags: ["Work Categories"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateWorkCategoryRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Successfully created work category",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/WorkCategory" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            409: {
              description: "Work category with this name already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/work-categories/{id}": {
        get: {
          summary: "Get work category by ID",
          description: "Retrieve a specific work category by its ID",
          tags: ["Work Categories"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Work Category ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved work category",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/WorkCategory" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Work category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update work category",
          description: "Update an existing work category. Admin role required.",
          tags: ["Work Categories"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Work Category ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateWorkCategoryRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Successfully updated work category",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/WorkCategory" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Work category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete work category (soft delete)",
          description:
            "Soft delete a work category by setting isActive to false. Admin role required.",
          tags: ["Work Categories"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Work Category ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully deleted work category",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Work category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },

      // Work Logs API
      "/api/work-logs": {
        get: {
          summary: "List work logs",
          description:
            "Retrieve a list of work logs with optional filtering and pagination",
          tags: ["Work Logs"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "page",
              in: "query",
              schema: { type: "integer", minimum: 1, default: 1 },
              description: "Page number",
            },
            {
              name: "limit",
              in: "query",
              schema: {
                type: "integer",
                minimum: 1,
                maximum: 100,
                default: 20,
              },
              description: "Items per page",
            },
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter by start date (YYYY-MM-DD)",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Filter by end date (YYYY-MM-DD)",
            },
            {
              name: "projectId",
              in: "query",
              schema: { type: "string", format: "uuid" },
              description: "Filter by single project ID",
            },
            {
              name: "projectIds",
              in: "query",
              schema: { type: "string" },
              description:
                "Filter by multiple project IDs (comma-separated UUIDs)",
            },
            {
              name: "categoryId",
              in: "query",
              schema: { type: "string", format: "uuid" },
              description: "Filter by single category ID",
            },
            {
              name: "categoryIds",
              in: "query",
              schema: { type: "string" },
              description:
                "Filter by multiple category IDs (comma-separated UUIDs)",
            },
            {
              name: "userId",
              in: "query",
              schema: { type: "string", format: "uuid" },
              description: "Filter by user ID (admin only when scope=all)",
            },
            {
              name: "searchText",
              in: "query",
              schema: { type: "string" },
              description: "Search text to filter work logs by details content",
            },
            {
              name: "scope",
              in: "query",
              schema: {
                type: "string",
                enum: ["own", "team", "all"],
                default: "own",
              },
              description:
                "Scope for filtering (own: user's logs, team: team's logs, all: all logs - admin only)",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved work logs",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/WorkLog" },
                      },
                      pagination: {
                        type: "object",
                        properties: {
                          page: { type: "integer" },
                          limit: { type: "integer" },
                          total: { type: "integer" },
                          totalPages: { type: "integer" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a new work log",
          description: "Create a new work log entry for the authenticated user",
          tags: ["Work Logs"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateWorkLogRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Successfully created work log",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/WorkLog" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/work-logs/{id}": {
        get: {
          summary: "Get work log by ID",
          description: "Retrieve a specific work log by its ID",
          tags: ["Work Logs"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Work Log ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved work log",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/WorkLog" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Access denied - not your work log",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Work log not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update work log",
          description: "Update an existing work log. Must be owner or admin.",
          tags: ["Work Logs"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Work Log ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateWorkLogRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Successfully updated work log",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/WorkLog" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Access denied - not your work log",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Work log not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete work log",
          description: "Delete a work log. Must be owner or admin.",
          tags: ["Work Logs"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Work Log ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully deleted work log",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Access denied - not your work log",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Work log not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },

      // Teams API
      "/api/teams": {
        get: {
          summary: "List all teams",
          description:
            "Retrieve a list of all teams, optionally filtered by active status",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "active",
              in: "query",
              schema: { type: "boolean" },
              description: "Filter by active status",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved teams list",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Team" },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          summary: "Create a new team",
          description:
            "Create a new team with the provided details. Admin role required.",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTeamRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Successfully created team",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Team" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            409: {
              description: "Team with this name already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/teams/{id}": {
        get: {
          summary: "Get team by ID",
          description: "Retrieve a specific team by its ID",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Team ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved team",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Team" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Team not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          summary: "Update team",
          description: "Update an existing team. Admin role required.",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Team ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateTeamRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Successfully updated team",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/Team" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Team not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          summary: "Delete team (soft delete)",
          description:
            "Soft delete a team by setting isActive to false. Admin role required.",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Team ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully deleted team",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Team not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/teams/{id}/members": {
        post: {
          summary: "Add team member",
          description:
            "Add a new member to a team. Admin or team leader role required.",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Team ID",
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AddTeamMemberRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Successfully added team member",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin or team leader role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Team not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            409: {
              description: "User is already a team member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/teams/{id}/members/{userId}": {
        delete: {
          summary: "Remove team member",
          description:
            "Remove a member from a team. Admin or team leader role required.",
          tags: ["Teams"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Team ID",
            },
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "User ID",
            },
          ],
          responses: {
            200: {
              description: "Successfully removed team member",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Admin or team leader role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            404: {
              description: "Team or member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },

      // Dashboard API
      "/api/dashboard/personal": {
        get: {
          summary: "Get personal dashboard statistics",
          description:
            "Retrieve personal work statistics for the authenticated user",
          tags: ["Dashboard"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Start date for statistics (YYYY-MM-DD)",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "End date for statistics (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved personal statistics",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/PersonalStats" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/dashboard/projects": {
        get: {
          summary: "Get project dashboard statistics",
          description: "Retrieve work statistics grouped by projects",
          tags: ["Dashboard"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Start date for statistics (YYYY-MM-DD)",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "End date for statistics (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved project statistics",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            projectId: { type: "string", format: "uuid" },
                            projectName: { type: "string" },
                            totalHours: { type: "number" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/dashboard/team": {
        get: {
          summary: "Get team dashboard statistics",
          description:
            "Retrieve team work statistics. Team leader or admin role required.",
          tags: ["Dashboard"],
          security: [{ BearerAuth: [] }],
          parameters: [
            {
              name: "startDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "Start date for statistics (YYYY-MM-DD)",
            },
            {
              name: "endDate",
              in: "query",
              schema: { type: "string", format: "date" },
              description: "End date for statistics (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "Successfully retrieved team statistics",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          totalHours: { type: "number" },
                          memberCount: { type: "integer" },
                          topProjects: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                projectId: { type: "string", format: "uuid" },
                                projectName: { type: "string" },
                                totalHours: { type: "number" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            403: {
              description: "Team leader or admin role required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
            500: {
              description: "Internal server error",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ApiErrorResponse" },
                },
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Projects",
        description: "Project management endpoints",
      },
      {
        name: "Work Categories",
        description: "Work category management endpoints",
      },
      {
        name: "Work Logs",
        description: "Work log management endpoints",
      },
      {
        name: "Teams",
        description: "Team management endpoints",
      },
      {
        name: "Dashboard",
        description: "Dashboard statistics endpoints",
      },
    ],
  } as const;

  return spec;
}

/**
 * Main execution
 */
function main() {
  try {
    console.log("Generating OpenAPI specification...");

    const spec = generateOpenApiSpec();
    const outputPath = join(process.cwd(), "openapi", "spec.ts");

    // Generate TypeScript file
    const content = `/**
 * OpenAPI 3.0 Specification
 * Generated from scripts/generate-openapi.ts
 * Last updated: ${new Date().toISOString()}
 *
 * To add or modify API endpoints:
 * 1. Edit scripts/generate-openapi.ts to update the specification
 * 2. Run 'npm run docs:openapi' to regenerate this file
 *
 * See CLAUDE.md for detailed documentation update guidelines
 */
export const openApiSpec = ${JSON.stringify(spec, null, 2)} as const;
`;

    writeFileSync(outputPath, content, "utf-8");

    console.log(
      `✅ OpenAPI specification generated successfully: ${outputPath}`,
    );
    console.log(
      `📝 Generated specification for ${Object.keys(spec.paths).length} endpoints`,
    );
    console.log(
      `🏷️  Defined ${Object.keys(spec.components?.schemas || {}).length} schemas`,
    );
  } catch (error) {
    console.error("❌ Error generating OpenAPI specification:", error);
    process.exit(1);
  }
}

main();
