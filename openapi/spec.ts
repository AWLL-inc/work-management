/**
 * OpenAPI 3.0 Specification
 * Manually defined for reliability and full control
 */
export const openApiSpec = {
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
      ApiSuccessResponse: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
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
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "Error code",
              },
              message: {
                type: "string",
                description: "Error message",
              },
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
      Project: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          name: {
            type: "string",
            maxLength: 255,
          },
          description: {
            type: "string",
            nullable: true,
          },
          isActive: {
            type: "boolean",
          },
          createdAt: {
            type: "string",
            format: "date-time",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
          },
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
    },
  },
  paths: {
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
            schema: {
              type: "boolean",
            },
            description: "Filter by active status",
          },
        ],
        responses: {
          "200": {
            description: "Successfully retrieved projects list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Project",
                      },
                    },
                  },
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
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
              schema: {
                $ref: "#/components/schemas/CreateProjectRequest",
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Successfully created project",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: {
                      type: "boolean",
                      example: true,
                    },
                    data: {
                      $ref: "#/components/schemas/Project",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Validation error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
              },
            },
          },
          "401": {
            description: "Authentication required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
              },
            },
          },
          "403": {
            description: "Admin role required",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
              },
            },
          },
          "409": {
            description: "Project with this name already exists",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
              },
            },
          },
          "500": {
            description: "Internal server error",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ApiErrorResponse",
                },
              },
            },
          },
        },
      },
    },
  },
} as const;
