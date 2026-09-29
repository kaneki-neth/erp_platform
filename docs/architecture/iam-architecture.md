# Identity & Access Management (IAM) Architecture

## 1. Overview
The Identity & Access Management (IAM) system provides a centralized, reusable, and tenant-scoped authorization and authentication foundation for the ERP platform. It decouples core security and identity from future business modules (e.g., POS, Inventory, Purchasing, Accounting).

```
┌─────────────────────────────────────────────────────────────┐
│                     Tenant Organization                     │
│                                                             │
│   ┌───────────────┐           ┌─────────────────────────┐   │
│   │     User      │ ◄───────► │          Role           │   │
│   │ (is_owner /   │ (role_    │ (System or Custom per   │   │
│   │  active /     │  user)    │  tenant organization)   │   │
│   │  inactive)    │           └───────────┬─────────────┘   │
│   └───────────────┘                       │ (permission_    │
│                                           │  role)          │
│                                           ▼                 │
│                               ┌─────────────────────────┐   │
│                               │       Permissions       │   │
│                               │  (users.create,         │   │
│                               │   roles.manage, etc.)   │   │
│                               └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Entities & Relationships

### `users`
- **Fields**: `id`, `organization_id`, `name`, `email`, `password`, `is_owner`, `status` (`active`, `inactive`, `suspended`), timestamps.
- **Tenancy**: Scoped via `organization_id` using `BelongsToTenant` and `TenantScope`.
- **Ownership**: `is_owner: true` grants super-administrator bypass for tenant resources.

### `roles`
- **Fields**: `id`, `organization_id`, `name`, `slug`, `description`, `is_system`, timestamps.
- **System Roles**: Default roles (e.g., `admin`, `staff`) flagged with `is_system: true` cannot be deleted.
- **Custom Roles**: Organizations can create custom roles with tailored permission subsets.

### `permissions`
- **Fields**: `id`, `name`, `slug`, `module_key`, `description`, timestamps.
- **Standardized Naming**: `<module>.<action>` (e.g. `users.view`, `users.create`, `roles.manage`, `modules.view`).
- **Extensibility**: Future business modules register their permissions in the global registry without modifying IAM core code.

### Pivot Tables
- `role_user`: Many-to-many relationship between users and roles.
- `permission_role`: Many-to-many relationship between roles and permissions.

---

## 3. Authentication & Lifecycle
- **Tokens**: Laravel Sanctum Bearer tokens.
- **Validation**:
  1. Password hash verification via `Hash::check`.
  2. User status verification (`status === 'active'`).
  3. Organization status verification (`organization.status === 'active'`).
- **Audit Logging**: Successful logins, logouts, and security modifications are recorded in `audit_logs`.

---

## 4. Authorization Enforcement
1. **Backend Authoritative Rule**: Controller actions verify permissions directly (`$user->hasPermission(...)` or `$user->is_owner`).
2. **Frontend Adaptation**: UI elements hide/disable actions using the `hasPermission(...)` hook in `AuthContext`, but backend strictly enforces status `403 Forbidden` on unauthorized requests.
3. **Tenant Isolation**: Cross-tenant querying, editing, or deleting is strictly prevented at the global scope level.

---

## 5. IAM REST Endpoints

### Authentication
- `POST /api/v1/auth/login` - Authenticate user credentials, check status, return token.
- `POST /api/v1/auth/logout` - Revoke current access token and audit.
- `GET /api/v1/auth/me` - Retrieve authenticated user profile with roles and permissions.

### Users
- `GET /api/v1/users` - List tenant users (supports `search`, `status`, `role_id`, pagination).
- `POST /api/v1/users` - Create new user in tenant organization.
- `GET /api/v1/users/{id}` - Retrieve user details.
- `PUT /api/v1/users/{id}` - Update user attributes, status, and assigned roles.
- `DELETE /api/v1/users/{id}` - Delete user (guarded against self/owner deletion).
- `GET /api/v1/users/{id}/roles` - Retrieve user's assigned roles.
- `PUT /api/v1/users/{id}/roles` - Sync user's assigned roles.

### Roles
- `GET /api/v1/roles` - List organization roles with user and permission counts.
- `POST /api/v1/roles` - Create custom organization role with initial permissions.
- `GET /api/v1/roles/{id}` - Retrieve role details and assigned permissions.
- `PUT /api/v1/roles/{id}` - Update role name, description, and permissions.
- `DELETE /api/v1/roles/{id}` - Delete custom role (guarded against system roles and assigned roles).
- `GET /api/v1/roles/{id}/permissions` - Get permissions for a role.
- `PUT /api/v1/roles/{id}/permissions` - Sync permissions assigned to a role.

### Permissions
- `GET /api/v1/permissions` - List available platform permissions (supports `grouped=true`).
- `GET /api/v1/permissions/{id}` - Retrieve permission details.

---

## 6. Seed Data & Defaults
- **System Roles**:
  - `Administrator`: Full organization management privileges.
  - `Staff Member`: Standard operational read/view access.
- **Default IAM Permissions**:
  - `users.view`, `users.create`, `users.update`, `users.delete`
  - `roles.view`, `roles.create`, `roles.update`, `roles.delete`, `roles.manage`
  - `permissions.view`
  - `organizations.view`, `organizations.update`
  - `modules.view`, `modules.manage`
