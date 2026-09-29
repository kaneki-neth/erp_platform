# Authorization Architecture

## 1. Hierarchy
Authorization is role- and permission-based, strictly bounded by the tenant organization:

```
Organization
    │
    ├── User
    │     └── Role (Organization-scoped or System)
    │           └── Permissions (e.g. users.create, modules.manage)
    │
    └── Enabled Modules
```

## 2. Organization Ownership
The `is_owner` flag on the `User` model bypasses granular permission checks for that specific tenant organization.

## 3. Server-Side Enforcement
Frontend UI elements may hide or disable buttons based on user permissions, but the backend is the authoritative gatekeeper. All state-mutating controller actions verify permissions explicitly.
