# API Architecture

## 1. Endpoint Conventions & Versioning
All backend endpoints are prefixed with the API version:
`/api/v1/...`

### IAM & Auth Endpoints
- `POST  /api/v1/auth/login`
- `POST  /api/v1/auth/logout`
- `GET   /api/v1/auth/me`
- `GET   /api/v1/organizations/current`
- `PATCH /api/v1/organizations/current`
- `GET   /api/v1/users` (supports `search`, `status`, `role_id`, `per_page`, `page`)
- `POST  /api/v1/users`
- `GET   /api/v1/users/{id}`
- `PUT   /api/v1/users/{id}`
- `DELETE /api/v1/users/{id}`
- `GET   /api/v1/users/{id}/roles`
- `PUT   /api/v1/users/{id}/roles`
- `GET   /api/v1/roles` (supports `search`)
- `POST  /api/v1/roles`
- `GET   /api/v1/roles/{id}`
- `PUT   /api/v1/roles/{id}`
- `DELETE /api/v1/roles/{id}`
- `GET   /api/v1/roles/{id}/permissions`
- `PUT   /api/v1/roles/{id}/permissions`
- `GET   /api/v1/permissions` (supports `module_key`, `search`, `grouped=true`)
- `GET   /api/v1/permissions/{id}`
- `GET   /api/v1/modules`
- `POST  /api/v1/modules/{key}/toggle`

## 2. Standardized Response Format
Every response returns a structured JSON payload:

### Success Response
```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "errors": null
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": {
    "field_name": ["Validation error message"]
  }
}
```

## 3. HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource created.
- `400 Bad Request`: General client request issue.
- `401 Unauthorized`: Unauthenticated / invalid or missing token.
- `403 Forbidden`: Authenticated user lacks permission or tries cross-tenant access.
- `404 Not Found`: Resource does not exist within the tenant scope.
- `422 Unprocessable Entity`: Form validation errors.
- `500 Internal Server Error`: Unhandled server exception.
