import { describe, expect, it } from "vitest";
import { openApiSpec } from "../openapi/spec";

describe("OpenAPI Specification", () => {
  describe("Basic Structure", () => {
    it("should have required top-level fields", () => {
      expect(openApiSpec).toHaveProperty("openapi");
      expect(openApiSpec).toHaveProperty("info");
      expect(openApiSpec).toHaveProperty("servers");
      expect(openApiSpec).toHaveProperty("paths");
      expect(openApiSpec).toHaveProperty("components");
    });

    it("should use OpenAPI version 3.0.0 or higher", () => {
      expect(openApiSpec.openapi).toMatch(/^3\.\d+\.\d+$/);
    });

    it("should have valid info object", () => {
      expect(openApiSpec.info).toHaveProperty("title");
      expect(openApiSpec.info).toHaveProperty("version");
      expect(openApiSpec.info).toHaveProperty("description");
      expect(openApiSpec.info.title).toBe("Work Management API");
      expect(openApiSpec.info.version).toBe("1.0.0");
    });
  });

  describe("Servers", () => {
    it("should have at least one server defined", () => {
      expect(Array.isArray(openApiSpec.servers)).toBe(true);
      expect(openApiSpec.servers.length).toBeGreaterThan(0);
    });

    it("should have valid server objects", () => {
      openApiSpec.servers.forEach(
        (server: { url: string; description: string }) => {
          expect(server).toHaveProperty("url");
          expect(server).toHaveProperty("description");
        },
      );
    });
  });

  describe("Security", () => {
    it("should have security schemes defined", () => {
      expect(openApiSpec.components).toHaveProperty("securitySchemes");
      expect(
        Object.keys(openApiSpec.components.securitySchemes || {}).length,
      ).toBeGreaterThan(0);
    });

    it("should have BearerAuth security scheme", () => {
      expect(openApiSpec.components.securitySchemes).toHaveProperty(
        "BearerAuth",
      );
      const bearerAuth = openApiSpec.components.securitySchemes?.BearerAuth as {
        type: string;
        scheme: string;
      };
      expect(bearerAuth.type).toBe("http");
      expect(bearerAuth.scheme).toBe("bearer");
    });
  });

  describe("API Paths", () => {
    it("should have API paths defined", () => {
      expect(Object.keys(openApiSpec.paths).length).toBeGreaterThan(0);
    });

    it("should have Projects API endpoints", () => {
      expect(openApiSpec.paths).toHaveProperty("/api/projects");
      expect(openApiSpec.paths).toHaveProperty("/api/projects/{id}");
    });

    it("should have Work Categories API endpoints", () => {
      expect(openApiSpec.paths).toHaveProperty("/api/work-categories");
      expect(openApiSpec.paths).toHaveProperty("/api/work-categories/{id}");
    });

    it("should have Work Logs API endpoints", () => {
      expect(openApiSpec.paths).toHaveProperty("/api/work-logs");
      expect(openApiSpec.paths).toHaveProperty("/api/work-logs/{id}");
    });

    it("should have Teams API endpoints", () => {
      expect(openApiSpec.paths).toHaveProperty("/api/teams");
      expect(openApiSpec.paths).toHaveProperty("/api/teams/{id}");
      expect(openApiSpec.paths).toHaveProperty("/api/teams/{id}/members");
      expect(openApiSpec.paths).toHaveProperty(
        "/api/teams/{id}/members/{userId}",
      );
    });

    it("should have Dashboard API endpoints", () => {
      expect(openApiSpec.paths).toHaveProperty("/api/dashboard/personal");
      expect(openApiSpec.paths).toHaveProperty("/api/dashboard/projects");
      expect(openApiSpec.paths).toHaveProperty("/api/dashboard/team");
    });

    it("should have valid HTTP methods for each path", () => {
      const validMethods = ["get", "post", "put", "patch", "delete"];

      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        const pathMethods = Object.keys(methods as Record<string, unknown>);
        pathMethods.forEach((method) => {
          expect(validMethods).toContain(method.toLowerCase());
        });
      });
    });

    it("should have summary for each operation", () => {
      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        Object.entries(methods as Record<string, any>).forEach(
          ([_method, operation]) => {
            expect(operation).toHaveProperty("summary");
            expect(typeof operation.summary).toBe("string");
            expect(operation.summary.length).toBeGreaterThan(0);
          },
        );
      });
    });

    it("should have responses defined for each operation", () => {
      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        Object.entries(methods as Record<string, any>).forEach(
          ([_method, operation]) => {
            expect(operation).toHaveProperty("responses");
            expect(Object.keys(operation.responses).length).toBeGreaterThan(0);
          },
        );
      });
    });
  });

  describe("Components - Schemas", () => {
    it("should have schemas defined", () => {
      expect(openApiSpec.components).toHaveProperty("schemas");
      expect(
        Object.keys(openApiSpec.components.schemas || {}).length,
      ).toBeGreaterThan(0);
    });

    it("should have Project schema", () => {
      expect(openApiSpec.components.schemas).toHaveProperty("Project");
      const project = openApiSpec.components.schemas?.Project as {
        type: string;
        properties: Record<string, unknown>;
      };
      expect(project.type).toBe("object");
      expect(project.properties).toHaveProperty("id");
      expect(project.properties).toHaveProperty("name");
      expect(project.properties).toHaveProperty("description");
      expect(project.properties).toHaveProperty("isActive");
    });

    it("should have WorkCategory schema", () => {
      expect(openApiSpec.components.schemas).toHaveProperty("WorkCategory");
      const category = openApiSpec.components.schemas?.WorkCategory as {
        type: string;
        properties: Record<string, unknown>;
      };
      expect(category.type).toBe("object");
      expect(category.properties).toHaveProperty("id");
      expect(category.properties).toHaveProperty("name");
      expect(category.properties).toHaveProperty("displayOrder");
    });

    it("should have WorkLog schema", () => {
      expect(openApiSpec.components.schemas).toHaveProperty("WorkLog");
      const workLog = openApiSpec.components.schemas?.WorkLog as {
        type: string;
        properties: Record<string, unknown>;
      };
      expect(workLog.type).toBe("object");
      expect(workLog.properties).toHaveProperty("id");
      expect(workLog.properties).toHaveProperty("userId");
      expect(workLog.properties).toHaveProperty("date");
      expect(workLog.properties).toHaveProperty("hours");
      expect(workLog.properties).toHaveProperty("projectId");
      expect(workLog.properties).toHaveProperty("categoryId");
    });

    it("should have Team schema", () => {
      expect(openApiSpec.components.schemas).toHaveProperty("Team");
      const team = openApiSpec.components.schemas?.Team as {
        type: string;
        properties: Record<string, unknown>;
      };
      expect(team.type).toBe("object");
      expect(team.properties).toHaveProperty("id");
      expect(team.properties).toHaveProperty("name");
      expect(team.properties).toHaveProperty("description");
      expect(team.properties).toHaveProperty("isActive");
    });

    it("should have ApiSuccessResponse schema", () => {
      expect(openApiSpec.components.schemas).toHaveProperty(
        "ApiSuccessResponse",
      );
      const response = openApiSpec.components.schemas?.ApiSuccessResponse as {
        type: string;
        properties: Record<string, unknown>;
      };
      expect(response.type).toBe("object");
      expect(response.properties).toHaveProperty("success");
      expect(response.properties).toHaveProperty("data");
    });

    it("should have ApiErrorResponse schema", () => {
      expect(openApiSpec.components.schemas).toHaveProperty("ApiErrorResponse");
      const error = openApiSpec.components.schemas?.ApiErrorResponse as {
        type: string;
        properties: Record<string, unknown>;
      };
      expect(error.type).toBe("object");
      expect(error.properties).toHaveProperty("success");
      expect(error.properties).toHaveProperty("error");
    });
  });

  describe("Work Logs Advanced Query Parameters", () => {
    it("should have projectIds query parameter", () => {
      const workLogsGet = (openApiSpec.paths as any)["/api/work-logs"]?.get;
      expect(workLogsGet).toBeDefined();

      const projectIdsParam = workLogsGet?.parameters?.find(
        (p: { name: string }) => p.name === "projectIds",
      );
      expect(projectIdsParam).toBeDefined();
      expect(projectIdsParam).toHaveProperty("in", "query");
      expect(projectIdsParam).toHaveProperty("schema");
    });

    it("should have categoryIds query parameter", () => {
      const workLogsGet = (openApiSpec.paths as any)["/api/work-logs"]?.get;
      expect(workLogsGet).toBeDefined();

      const categoryIdsParam = workLogsGet?.parameters?.find(
        (p: { name: string }) => p.name === "categoryIds",
      );
      expect(categoryIdsParam).toBeDefined();
      expect(categoryIdsParam).toHaveProperty("in", "query");
      expect(categoryIdsParam).toHaveProperty("schema");
    });

    it("should have userId query parameter", () => {
      const workLogsGet = (openApiSpec.paths as any)["/api/work-logs"]?.get;
      expect(workLogsGet).toBeDefined();

      const userIdParam = workLogsGet?.parameters?.find(
        (p: { name: string }) => p.name === "userId",
      );
      expect(userIdParam).toBeDefined();
      expect(userIdParam).toHaveProperty("in", "query");
      expect(userIdParam?.schema).toHaveProperty("format", "uuid");
    });

    it("should have searchText query parameter", () => {
      const workLogsGet = (openApiSpec.paths as any)["/api/work-logs"]?.get;
      expect(workLogsGet).toBeDefined();

      const searchTextParam = workLogsGet?.parameters?.find(
        (p: { name: string }) => p.name === "searchText",
      );
      expect(searchTextParam).toBeDefined();
      expect(searchTextParam).toHaveProperty("in", "query");
      expect(searchTextParam).toHaveProperty("schema");
    });
  });

  describe("Response Schemas", () => {
    it("should have 200 responses with proper content type", () => {
      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        Object.entries(methods as Record<string, any>).forEach(
          ([_method, operation]) => {
            if (operation.responses["200"]) {
              expect(operation.responses["200"]).toHaveProperty("content");
              expect(operation.responses["200"].content).toHaveProperty(
                "application/json",
              );
            }
          },
        );
      });
    });

    it("should have error responses defined", () => {
      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        Object.entries(methods as Record<string, any>).forEach(
          ([_method, operation]) => {
            // At least one error response should be defined
            const hasErrorResponse =
              operation.responses["400"] ||
              operation.responses["401"] ||
              operation.responses["403"] ||
              operation.responses["404"] ||
              operation.responses["500"];
            expect(hasErrorResponse).toBeTruthy();
          },
        );
      });
    });
  });

  describe("Tags", () => {
    it("should have operations tagged", () => {
      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        Object.entries(methods as Record<string, any>).forEach(
          ([_method, operation]) => {
            expect(operation).toHaveProperty("tags");
            expect(Array.isArray(operation.tags)).toBe(true);
            expect(operation.tags.length).toBeGreaterThan(0);
          },
        );
      });
    });

    it("should have consistent tags", () => {
      const validTags = [
        "Projects",
        "Work Categories",
        "Work Logs",
        "Teams",
        "Dashboard",
      ];

      Object.entries(openApiSpec.paths).forEach(([_path, methods]) => {
        Object.entries(methods as Record<string, any>).forEach(
          ([_method, operation]) => {
            operation.tags.forEach((tag: string) => {
              expect(validTags).toContain(tag);
            });
          },
        );
      });
    });
  });
});
