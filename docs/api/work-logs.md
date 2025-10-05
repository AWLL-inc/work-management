# Work Logs API

## Overview

The Work Logs API provides CRUD operations for managing daily work time entries. Users can log hours worked on specific projects and categories with detailed descriptions using rich text formatting.

## Authentication & Authorization

All endpoints require authentication via NextAuth.js session. Users can only access their own work logs unless they have admin role.

## Base URL

```
/api/work-logs
```

## Endpoints

### List Work Logs

Retrieve work logs for the current user (or all logs for admins).

**Endpoint:** `GET /api/work-logs`

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "user-uuid",
      "date": "2024-10-05T00:00:00Z",
      "hours": "8.0",
      "projectId": "project-uuid",
      "categoryId": "category-uuid",
      "details": "<p>Implemented user authentication module</p>",
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

### Get Work Log by ID

Retrieve a single work log by ID.

**Endpoint:** `GET /api/work-logs/[id]`

**Authentication:** Required

**Path Parameters:**
- `id` (required): Work Log UUID

**Authorization:**
- Users can only access their own work logs
- Admins can access all work logs

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "date": "2024-10-05T00:00:00Z",
    "hours": "8.0",
    "projectId": "project-uuid",
    "categoryId": "category-uuid",
    "details": "<p>Implemented user authentication module</p>",
    "createdAt": "2024-10-05T10:00:00Z",
    "updatedAt": "2024-10-05T10:00:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to access this work log
- `404 Not Found` - Work log not found
- `500 Internal Server Error` - Server error

---

### Create Work Log

Create a new work log entry.

**Endpoint:** `POST /api/work-logs`

**Authentication:** Required

**Request Body:**
```json
{
  "date": "2024-10-05T00:00:00Z",
  "hours": "7.5",
  "projectId": "project-uuid",
  "categoryId": "category-uuid",
  "details": "<p>Completed API documentation</p>"
}
```

**Validation Rules:**
- `date`: Required, valid date
- `hours`: Required, string representing positive decimal number (e.g., "8.0", "7.5")
- `projectId`: Required, valid project UUID (must exist)
- `categoryId`: Required, valid category UUID (must exist)
- `details`: Optional, HTML string (sanitized for XSS prevention)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "current-user-uuid",
    "date": "2024-10-05T00:00:00Z",
    "hours": "7.5",
    "projectId": "project-uuid",
    "categoryId": "category-uuid",
    "details": "<p>Completed API documentation</p>",
    "createdAt": "2024-10-05T10:00:00Z",
    "updatedAt": "2024-10-05T10:00:00Z"
  }
}
```

**Status Codes:**
- `201 Created` - Success
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST 'http://localhost:3000/api/work-logs' \
  -H 'Content-Type: application/json' \
  -H 'Cookie: next-auth.session-token=...' \
  -d '{
    "date": "2024-10-05T00:00:00Z",
    "hours": "8.0",
    "projectId": "project-uuid",
    "categoryId": "category-uuid",
    "details": "<p>Fixed bug in login flow</p>"
  }'
```

---

### Update Work Log

Update an existing work log entry.

**Endpoint:** `PUT /api/work-logs/[id]`

**Authentication:** Required

**Path Parameters:**
- `id` (required): Work Log UUID

**Authorization:**
- Users can only update their own work logs
- Admins can update all work logs

**Request Body:**
```json
{
  "date": "2024-10-05T00:00:00Z",
  "hours": "8.5",
  "projectId": "project-uuid",
  "categoryId": "category-uuid",
  "details": "<p>Updated implementation details</p>"
}
```

**Validation Rules:**
- All fields are optional
- Same validation rules as create endpoint for provided fields

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "date": "2024-10-05T00:00:00Z",
    "hours": "8.5",
    "projectId": "project-uuid",
    "categoryId": "category-uuid",
    "details": "<p>Updated implementation details</p>",
    "createdAt": "2024-10-05T10:00:00Z",
    "updatedAt": "2024-10-05T11:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to update this work log
- `404 Not Found` - Work log not found
- `500 Internal Server Error` - Server error

---

### Delete Work Log

Delete a work log entry (hard delete).

**Endpoint:** `DELETE /api/work-logs/[id]`

**Authentication:** Required

**Path Parameters:**
- `id` (required): Work Log UUID

**Authorization:**
- Users can only delete their own work logs
- Admins can delete all work logs

**Response:**
```json
{
  "success": true
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not authorized to delete this work log
- `404 Not Found` - Work log not found
- `500 Internal Server Error` - Server error

---

## Rich Text Details

The `details` field supports rich text formatting using HTML. The API automatically sanitizes the HTML to prevent XSS attacks.

### Supported HTML Tags

- Paragraphs: `<p>`
- Text formatting: `<strong>`, `<em>`, `<u>`, `<s>`
- Lists: `<ul>`, `<ol>`, `<li>`
- Links: `<a href="...">`
- Headings: `<h1>` through `<h6>`
- Code: `<code>`, `<pre>`
- Line breaks: `<br>`

### Security

- Script tags and event handlers are automatically removed
- `javascript:` and `data:` protocols in links are blocked
- Maximum content length: 10,000 characters (plain text equivalent)

---

## TypeScript Types

```typescript
interface WorkLog {
  id: string;
  userId: string;
  date: Date;
  hours: string; // Decimal string, e.g., "8.0", "7.5"
  projectId: string;
  categoryId: string;
  details: string | null; // HTML string
  createdAt: Date;
  updatedAt: Date;
}

interface CreateWorkLogData {
  date: Date;
  hours: string;
  projectId: string;
  categoryId: string;
  details?: string | null;
}

interface UpdateWorkLogData {
  date?: Date;
  hours?: string;
  projectId?: string;
  categoryId?: string;
  details?: string | null;
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// List all work logs for current user
const response = await fetch('/api/work-logs');
const result: ApiResponse<WorkLog[]> = await response.json();

// Create a new work log
const newLog = {
  date: new Date('2024-10-05'),
  hours: '8.0',
  projectId: 'project-uuid',
  categoryId: 'category-uuid',
  details: '<p>Implemented new feature</p>',
};

const createResponse = await fetch('/api/work-logs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(newLog),
});

// Update work log
const updateResponse = await fetch(`/api/work-logs/${logId}`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    hours: '7.5',
    details: '<p>Updated time entry</p>',
  }),
});

// Delete work log
const deleteResponse = await fetch(`/api/work-logs/${logId}`, {
  method: 'DELETE',
});
```

---

## Database Indexes

For optimal query performance, the following indexes are used:

- `(user_id, date)` - User's work logs by date range
- `project_id` - Work logs by project
- `category_id` - Work logs by category

---

## Notes

- Work logs are associated with the current user (`userId` is automatically set from session)
- The `hours` field is stored as a string to maintain precision (e.g., "7.5" for 7 hours 30 minutes)
- Work logs are hard-deleted (not soft-deleted)
- All dates are stored in UTC and should be converted to local timezone on the client
- The `details` field HTML is sanitized on the server to prevent XSS attacks
- Plain text extraction is performed when displaying in table views
