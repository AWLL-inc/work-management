# API Documentation

This directory contains API documentation for the Work Management application.

## OpenAPI/Swagger Documentation

### Viewing the Documentation

The API documentation is available through Swagger UI:

**Development**: http://localhost:3000/api-docs

**Production**: https://your-domain.vercel.app/api-docs

### OpenAPI Schema

The OpenAPI 3.0 schema is available at:

**Development**: http://localhost:3000/api/openapi

**Production**: https://your-domain.vercel.app/api/openapi

### Configuration

The OpenAPI specification is automatically generated from `scripts/generate-openapi.ts`.

#### Updating the Schema

1. Edit `scripts/generate-openapi.ts` to add or modify API endpoints:
   - Add request/response schemas to `components.schemas`
   - Add endpoint definitions to `paths`
2. Run `npm run docs:openapi` to regenerate the specification
3. Verify at http://localhost:3000/en/api-docs

See CLAUDE.md "Documentation Maintenance > API Documentation" for detailed guidelines.

### Adding New Endpoints

To document a new API endpoint:

1. Edit `scripts/generate-openapi.ts`
2. Add the endpoint definition to the `paths` object
3. Define request/response schemas in `components.schemas`
4. Include authentication requirements if needed
5. Add appropriate tags for organization
6. Run `npm run docs:openapi` to regenerate the specification

Example:

```typescript
// In scripts/generate-openapi.ts
paths: {
  "/api/example": {
    get: {
      summary: "Get example data",
      tags: ["Example"],
      responses: {
        200: {
          description: "Success",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ExampleResponse",
              },
            },
          },
        },
      },
    },
  },
}
```

## Available Endpoints

### Projects API
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/[id]` - Get project by ID
- `PUT /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project

### Work Categories API
- `GET /api/work-categories` - List all work categories
- `POST /api/work-categories` - Create a new work category
- `GET /api/work-categories/[id]` - Get work category by ID
- `PUT /api/work-categories/[id]` - Update work category
- `DELETE /api/work-categories/[id]` - Delete work category

### Work Logs API
- `GET /api/work-logs` - List work logs
- `POST /api/work-logs` - Create a new work log
- `GET /api/work-logs/[id]` - Get work log by ID
- `PUT /api/work-logs/[id]` - Update work log
- `DELETE /api/work-logs/[id]` - Delete work log

### Teams API
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create a new team
- `GET /api/teams/[id]` - Get team by ID
- `PUT /api/teams/[id]` - Update team
- `DELETE /api/teams/[id]` - Delete team
- `POST /api/teams/[id]/members` - Add team member
- `DELETE /api/teams/[id]/members/[userId]` - Remove team member

### Dashboard API
- `GET /api/dashboard/personal` - Get personal statistics
- `GET /api/dashboard/projects` - Get project statistics
- `GET /api/dashboard/team` - Get team statistics

## Authentication

Most API endpoints require authentication using NextAuth.js JWT tokens.

### Authentication Header

```
Authorization: Bearer <jwt-token>
```

### Getting a Token

Authenticate through the login page to receive a session cookie. The JWT token is automatically included in authenticated requests.

## Response Format

All API responses follow a consistent format:

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { ... }
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Testing the API

### Using Swagger UI

1. Navigate to `/api-docs`
2. Click on an endpoint to expand details
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

### Using curl

```bash
# GET request
curl -X GET 'http://localhost:3000/api/projects?active=true'

# POST request
curl -X POST 'http://localhost:3000/api/projects' \
  -H 'Content-Type: application/json' \
  -d '{"name":"New Project","description":"Test","isActive":true}'
```

### Using Postman

1. Import the OpenAPI schema: http://localhost:3000/api/openapi
2. Postman will automatically generate a collection with all endpoints
3. Set up authentication in the collection settings

## Additional Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
