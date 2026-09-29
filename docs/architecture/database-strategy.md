# Database Strategy

## 1. Multi-Tenant Relational Schema
- **Database Engine**: MySQL (InnoDB, utf8mb4). SQLite is supported for testing.
- **Tenant Key**: Every tenant-owned table features `organization_id` foreign key with cascade deletion or explicit constraint.
- **Indexing**: Foreign keys (`organization_id`, `user_id`) and compound indices (e.g. `['organization_id', 'created_at']`, `['organization_id', 'slug']`) ensure fast query execution and strict isolation.

## 2. Phase 0 Schema Foundation
Tables initialized during Phase 0:
- `organizations`
- `users`
- `roles`
- `permissions`
- `permission_role`
- `role_user`
- `modules`
- `organization_modules`
- `audit_logs`
- `personal_access_tokens`
- `cache`
- `jobs`
