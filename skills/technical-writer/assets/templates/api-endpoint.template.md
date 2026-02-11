# [HTTP METHOD] /api/endpoint/path

Brief one-sentence description of what this endpoint does.

## Overview

Detailed explanation of the endpoint's purpose, when to use it, and how it fits into the larger system. Include information about:
- What problem it solves
- Who should use it (frontend, admin, external integrations)
- Any prerequisites or setup required

## Endpoint Details

- **Method**: GET | POST | PUT | DELETE | PATCH
- **Path**: `/api/endpoint/path`
- **Authentication**: Required | Optional | Not Required
- **Authorization**: Admin only | User only | Public
- **Rate Limit**: X requests per Y seconds
- **Content-Type**: `application/json` | `multipart/form-data`

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Content-Type` | Yes | Must be `application/json` |
| `Authorization` | Yes | Bearer token: `Bearer <token>` |
| `X-Custom-Header` | No | Optional custom header |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | number | No | 1 | Page number for pagination |
| `limit` | number | No | 10 | Number of items per page (max: 100) |
| `sort` | string | No | 'createdAt' | Sort field ('createdAt', 'name', 'status') |
| `order` | string | No | 'desc' | Sort order ('asc', 'desc') |

### Body Parameters

| Parameter | Type | Required | Constraints | Description |
|-----------|------|----------|-------------|-------------|
| `field1` | string | Yes | 1-255 chars | Description of field1 |
| `field2` | number | No | 0-100 | Description of field2 |
| `field3` | boolean | No | - | Description of field3 |
| `nested` | object | No | - | Nested object structure |
| `nested.subfield` | string | No | - | Subfield description |

### Request Body Example

```json
{
  "field1": "example value",
  "field2": 42,
  "field3": true,
  "nested": {
    "subfield": "nested value"
  }
}
```

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "data": {
    "id": "unique-id-123",
    "field1": "example value",
    "field2": 42,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success indicator |
| `data` | object/array | Response payload |
| `data.id` | string | Unique identifier |
| `meta` | object | Metadata (for paginated responses) |
| `meta.page` | number | Current page number |
| `meta.total` | number | Total number of items |

### Error Responses

#### 400 Bad Request

Invalid request parameters or malformed body.

```json
{
  "error": "Invalid request",
  "code": "INVALID_INPUT",
  "details": [
    {
      "field": "field1",
      "message": "Field1 is required"
    }
  ]
}
```

#### 401 Unauthorized

Missing or invalid authentication token.

```json
{
  "error": "Unauthorized",
  "code": "UNAUTHORIZED",
  "message": "Valid authentication token required"
}
```

#### 403 Forbidden

Authenticated but not authorized to access this resource.

```json
{
  "error": "Forbidden",
  "code": "FORBIDDEN",
  "message": "Insufficient permissions"
}
```

#### 404 Not Found

Resource not found.

```json
{
  "error": "Not found",
  "code": "NOT_FOUND",
  "message": "Resource with id 'xyz' not found"
}
```

#### 429 Too Many Requests

Rate limit exceeded.

```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 60 seconds",
  "retryAfter": 60
}
```

#### 500 Internal Server Error

Server-side error occurred.

```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR",
  "message": "An unexpected error occurred"
}
```

### Error Codes Summary

| Status | Code | Description | Solution |
|--------|------|-------------|----------|
| 400 | `INVALID_INPUT` | Missing or invalid parameters | Check request body against schema |
| 400 | `VALIDATION_ERROR` | Data validation failed | Review field constraints |
| 401 | `UNAUTHORIZED` | Missing/invalid auth token | Provide valid Bearer token |
| 403 | `FORBIDDEN` | Insufficient permissions | Check user role/permissions |
| 404 | `NOT_FOUND` | Resource doesn't exist | Verify resource ID |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry after delay |
| 500 | `INTERNAL_ERROR` | Server error | Contact support if persists |

## Examples

### Example 1: Basic Request

```typescript
const response = await fetch('/api/endpoint/path', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({
    field1: 'example value',
    field2: 42
  })
})

const data = await response.json()

if (data.success) {
  console.log('Success:', data.data)
} else {
  console.error('Error:', data.error)
}
```

### Example 2: With Query Parameters

```typescript
const params = new URLSearchParams({
  page: '2',
  limit: '20',
  sort: 'name',
  order: 'asc'
})

const response = await fetch(`/api/endpoint/path?${params}`, {
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
})

const data = await response.json()
```

### Example 3: With Error Handling

```typescript
try {
  const response = await fetch('/api/endpoint/path', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(requestData)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Request failed')
  }

  const data = await response.json()
  return data
} catch (error) {
  console.error('API Error:', error)
  // Handle error appropriately
}
```

### Example 4: Using Next.js API Route Handler

```typescript
// src/app/api/endpoint/path/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.field1) {
      return NextResponse.json(
        { error: 'field1 is required', code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // Implementation
    const result = { id: '123', ...body }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

## Related Endpoints

- [GET /api/related](./related.md) - Related endpoint
- [DELETE /api/endpoint/:id](./delete.md) - Delete operation

## Related Documentation

- [Authentication Guide](../../docs/auth.md)
- [Rate Limiting](../../docs/rate-limiting.md)
- [Error Handling](../../docs/errors.md)

## Notes

### Performance Considerations

- This endpoint implements caching with 5-minute TTL
- Paginated responses limit max items to 100 per page
- Uses database indexes on `field1` for fast queries

### Security Considerations

- Requires authentication via Bearer token
- Validates all input parameters
- Sanitizes user input to prevent injection attacks
- Rate limited to prevent abuse

### Changelog

- **v1.1.0** (2024-01-15): Added `field3` parameter
- **v1.0.0** (2024-01-01): Initial release
