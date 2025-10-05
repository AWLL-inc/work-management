# Projects API

## Overview

The Projects API provides CRUD operations for managing project master data. Projects are used to categorize work logs and track time spent on different initiatives.

## Authentication & Authorization

All endpoints require authentication via NextAuth.js session. Admin role is required for create, update, and delete operations.

## Base URL

```
/api/projects
```

## Endpoints

### List Projects

Retrieve all projects or filter by active status.

**Endpoint:** `GET /api/projects`

**Authentication:** Required

**Query Parameters:**
- `active` (optional): Filter by active status
  - `true` - Return only active projects
  - Default: Return all projects

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project Name",
      "description": "Project description",
      "isActive": true,
      "createdAt": "2024-10-05T10:00:00Z",
      "updatedAt": "2024-10-05T10:00:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X GET 'http://localhost:3000/api/projects?active=true' \
  -H 'Cookie: next-auth.session-token=...'
```

---

### Get Project by ID

Retrieve a single project by ID.

**Endpoint:** `GET /api/projects/[id]`

**Authentication:** Required

**Path Parameters:**
- `id` (required): Project UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "description": "Project description",
    "isActive": true,
    "createdAt": "2024-10-05T10:00:00Z",
    "updatedAt": "2024-10-05T10:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

---

### Create Project

Create a new project. Admin role required.

**Endpoint:** `POST /api/projects`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description (optional)",
  "isActive": true
}
```

**Validation Rules:**
- `name`: Required, string, must be unique
- `description`: Optional, string
- `isActive`: Optional, boolean, default: `true`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Project",
    "description": "Project description",
    "isActive": true,
    "createdAt": "2024-10-05T10:00:00Z",
    "updatedAt": "2024-10-05T10:00:00Z"
  }
}
```

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin user
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST 'http://localhost:3000/api/projects' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{
    "name": "Website Redesign",
    "description": "Complete overhaul of company website",
    "isActive": true
  }'
```

---

### Update Project

Update an existing project. Admin role required.

**Endpoint:** `PUT /api/projects/[id]`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (required): Project UUID

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "isActive": false
}
```

**Validation Rules:**
- All fields are optional
- `name`: If provided, must be unique
- `description`: String or null
- `isActive`: Boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Project Name",
    "description": "Updated description",
    "isActive": false,
    "createdAt": "2024-10-05T10:00:00Z",
    "updatedAt": "2024-10-05T11:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin user
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

---

### Delete Project

Soft delete a project (sets `isActive` to false). Admin role required.

**Endpoint:** `DELETE /api/projects/[id]`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (required): Project UUID

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin user
- `404 Not Found` - Project not found
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X DELETE 'http://localhost:3000/api/projects/uuid' \
  -H 'Cookie: next-auth.session-token=...'
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | User not authenticated | 401 |
| `FORBIDDEN` | User lacks required permissions | 403 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `DUPLICATE_NAME` | Project name already exists | 400 |
| `NOT_FOUND` | Project not found | 404 |
| `INTERNAL_ERROR` | Server error | 500 |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_NAME",
    "message": "A project with this name already exists",
    "details": {
      "name": "Website Redesign"
    }
  }
}
```

---

## TypeScript Types

```typescript
interface Project {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateProjectData {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

interface UpdateProjectData {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// List all active projects
const response = await fetch('/api/projects?active=true');
const result: ApiResponse<Project[]> = await response.json();

if (result.success && result.data) {
  console.log('Projects:', result.data);
}

// Create a new project
const newProject = {
  name: 'Mobile App',
  description: 'New mobile application project',
  isActive: true,
};

const createResponse = await fetch('/api/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newProject),
});

const createResult: ApiResponse<Project> = await createResponse.json();

// Update a project
const updateData = {
  isActive: false,
};

const updateResponse = await fetch(`/api/projects/${projectId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(updateData),
});

// Delete a project
const deleteResponse = await fetch(`/api/projects/${projectId}`, {
  method: 'DELETE',
});
```

---

## Notes

- Projects are soft-deleted (logical deletion) by setting `isActive` to `false`
- Project names must be unique across all projects (active and inactive)
- Use the `active=true` query parameter to filter for active projects in select lists
- All timestamps are in ISO 8601 format with UTC timezone
