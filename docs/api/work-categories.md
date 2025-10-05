# Work Categories API

## Overview

The Work Categories API provides CRUD operations for managing work category master data. Work categories are used to classify work logs (e.g., Design, Development, Testing) with customizable display order.

## Authentication & Authorization

All endpoints require authentication via NextAuth.js session. Admin role is required for create, update, and delete operations.

## Base URL

```
/api/work-categories
```

## Endpoints

### List Work Categories

Retrieve all work categories or filter by active status.

**Endpoint:** `GET /api/work-categories`

**Authentication:** Required

**Query Parameters:**
- `active` (optional): Filter by active status
  - `true` - Return only active categories
  - Default: Return all categories

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Development",
      "description": "Software development work",
      "displayOrder": 1,
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

---

### Create Work Category

Create a new work category. Admin role required.

**Endpoint:** `POST /api/work-categories`

**Authentication:** Required (Admin only)

**Request Body:**
```json
{
  "name": "Testing",
  "description": "Quality assurance and testing",
  "displayOrder": 3,
  "isActive": true
}
```

**Validation Rules:**
- `name`: Required, string, must be unique
- `description`: Optional, string
- `displayOrder`: Optional, positive integer, default: `0`
- `isActive`: Optional, boolean, default: `true`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Testing",
    "description": "Quality assurance and testing",
    "displayOrder": 3,
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

---

### Update Work Category

Update an existing work category. Admin role required.

**Endpoint:** `PUT /api/work-categories/[id]`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (required): Work Category UUID

**Request Body:**
```json
{
  "name": "Updated Category",
  "description": "Updated description",
  "displayOrder": 2,
  "isActive": false
}
```

**Validation Rules:**
- All fields are optional
- `name`: If provided, must be unique
- `description`: String or null
- `displayOrder`: Positive integer
- `isActive`: Boolean

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Category",
    "description": "Updated description",
    "displayOrder": 2,
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
- `404 Not Found` - Category not found
- `500 Internal Server Error` - Server error

---

### Delete Work Category

Soft delete a work category (sets `isActive` to false). Admin role required.

**Endpoint:** `DELETE /api/work-categories/[id]`

**Authentication:** Required (Admin only)

**Path Parameters:**
- `id` (required): Work Category UUID

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
- `404 Not Found` - Category not found
- `500 Internal Server Error` - Server error

---

## Display Order Management

Work categories support custom ordering via the `displayOrder` field. Lower numbers appear first.

### Reordering Categories

To move a category up or down:

1. Get the current list of categories sorted by `displayOrder`
2. Swap the `displayOrder` values of two adjacent categories
3. Update both categories in parallel using `Promise.all`

**Example:**
```typescript
// Move category up (swap with previous)
await Promise.all([
  updateWorkCategory(currentCategory.id, { displayOrder: prevCategory.displayOrder }),
  updateWorkCategory(prevCategory.id, { displayOrder: currentCategory.displayOrder }),
]);
```

---

## TypeScript Types

```typescript
interface WorkCategory {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWorkCategoryData {
  name: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

interface UpdateWorkCategoryData {
  name?: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}
```

---

## Notes

- Work categories are soft-deleted (logical deletion) by setting `isActive` to `false`
- Category names must be unique across all categories (active and inactive)
- Use `displayOrder` to control the order in which categories appear in select lists
- Categories are automatically sorted by `displayOrder` when `active=true` filter is used
- All timestamps are in ISO 8601 format with UTC timezone
