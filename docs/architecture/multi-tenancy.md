# Multi-Tenancy Architecture

## 1. Single-Database Strategy
During Phase 0, the platform implements single-database multi-tenancy. All tenant records contain a tenant identifier (`organization_id`).

```
organizations
     │
     ├── users (scoped by organization_id)
     ├── roles (scoped by organization_id)
     ├── module activations (organization_modules)
     └── business data (future inventory, sales, products)
```

## 2. Global Scoping via Eloquent Traits
Tenant models implement the `App\Traits\BelongsToTenant` trait, which automatically applies `App\Scopes\TenantScope`.

- **Read Operations**: All `SELECT` queries append `WHERE organization_id = ?` based on the authenticated context.
- **Write Operations**: Model creation automatically assigns `organization_id` from `TenantContext::getTenantId()`.

## 3. Strict Security Rules
1. **Never trust client-supplied tenant IDs**: The client cannot override tenant scoping by passing `organization_id` in request payloads.
2. **Context Resolution**: The `TenantMiddleware` sets `TenantContext::setTenant($request->user()->organization)`.
3. **Cross-Tenant Prevention**: If User A requests a record belonging to Organization B, the query returns `404 Not Found` (or `403 Forbidden`) because the record is invisible to User A's tenant scope.
