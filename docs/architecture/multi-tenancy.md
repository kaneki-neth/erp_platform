# Multi-Tenancy & Organization Management Architecture

## 1. Single-Database Strategy with Dynamic Contexts
The platform implements single-database multi-tenancy. All tenant-scoped records reference `organization_id`.

```
organizations
     │
     ├── organization_memberships (users with roles and statuses per organization)
     ├── organization_invitations (token-based invitations with expiration)
     ├── users (global accounts with primary and multi-org memberships)
     ├── roles & permissions (scoped by organization_id)
     ├── module activations (organization_modules)
     └── business entities (future POS, inventory, branches, orders)
```

## 2. Multi-Organization Memberships
Users can belong to multiple organizations with different roles and statuses in each tenant:
- **`OrganizationMembership`**: Bridges `User`, `Organization`, and `Role` with status (`active`, `invited`, `suspended`, `removed`).
- **`OrganizationInvitation`**: Secure token-based invitation link mechanism with validity periods and automated activation upon acceptance.

## 3. Dynamic Context Switching & Resolution
Requests resolve tenant context through three hierarchical mechanisms:
1. **`X-Organization-Id` / `X-Tenant-Id` HTTP Header**: Explicit context sent by frontend clients.
2. **Explicit Switch API (`POST /api/v1/organizations/switch`)**: Switches active tenant in state/storage.
3. **Default / Fallback**: User's primary `organization_id` or first active `organization_membership`.

### Security Verification in `TenantMiddleware`:
- Checks if the user has an active membership in the target organization.
- Ensures target organization is in `active` status.
- Rejects unauthorized cross-tenant requests with `403 Forbidden`.
- Sets `TenantContext::setTenant($targetOrg)`.

## 4. Global Scoping via Eloquent Traits
Models implementing `App\Traits\BelongsToTenant` automatically apply `App\Scopes\TenantScope`:
- **Read Operations**: Appends `WHERE organization_id = ?` based on resolved tenant context.
- **Write Operations**: Automatically assigns `organization_id = TenantContext::getTenantId()`.

## 5. Frontend Multi-Tenancy Support
- **Header Switcher**: Real-time dropdown to switch organizations dynamically without re-logging in.
- **Automatic Interceptor**: `apps/admin/src/api/client.ts` automatically attaches `X-Organization-Id` header from local storage.
- **Organizations Directory**: Comprehensive directory and creation modal (`/organizations`).
- **Team Members & Invitations**: Manage roster, invite new users via link/email, change member roles, and suspend/activate memberships (`/organization/members`).
- **Tenant Settings**: Configure organization profile, registered name, contact details, and localization preferences (`/organization/settings`).
