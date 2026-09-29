PHASE 2 — ORGANIZATION & TENANT MANAGEMENT
===========================================

You are implementing Phase 2 of the enterprise platform.

The platform currently contains:

PHASE 0
- Platform Core
- Project foundation
- Shared infrastructure
- Configuration
- Database foundation
- API foundation
- UI foundation
- Shared services

PHASE 1
- Identity & Access Management
- Authentication
- Users
- Roles
- Permissions
- Authorization
- Audit/Security

PHASE 2
- Organization / Tenant Management
- Business/Company Management
- Organizational structure
- User-to-organization relationships
- Organization-level access control
- Organization settings

Your task is to implement Phase 2 on top of the existing Phase 0 and Phase 1 architecture.

==================================================
IMPORTANT
==================================================

Before writing any code:

1. Inspect the entire Phase 0 repository.
2. Inspect the entire Phase 1 implementation.
3. Understand the existing architecture.
4. Understand the authentication system.
5. Understand the user/role/permission system.
6. Identify existing database conventions.
7. Identify existing API conventions.
8. Identify existing frontend conventions.
9. Identify existing UI components.
10. Identify existing audit/logging infrastructure.

Do NOT recreate Phase 0 or Phase 1.

Do NOT create a second authentication system.

Do NOT create a second user system.

Do NOT create business-specific modules yet.

Phase 2 should establish the organization/tenant layer that future business modules can use.

==================================================
PHASE 2 OBJECTIVE
==================================================

Build a reusable organization and tenant-management foundation.

The platform should support multiple organizations/businesses using the same platform infrastructure.

Conceptually:

                    PLATFORM
                       │
        ┌──────────────┼──────────────┐
        │              │              │
   Organization A  Organization B  Organization C
        │              │              │
      Users          Users          Users
        │              │              │
      Roles          Roles          Roles
        │              │              │
    Permissions    Permissions    Permissions
        │              │              │
      Modules        Modules        Modules

The organization layer must be generic.

Do NOT assume a specific business type.

It should support organizations such as:

- Retail business
- Restaurant
- School
- Logistics company
- Service company
- Government office
- Other future business types

The organization itself should not contain business-specific functionality.

==================================================
MULTI-TENANCY
==================================================

Implement the platform so that organizations are logically isolated from one another.

A user belonging to Organization A must not automatically have access to Organization B.

Organization context must be established before accessing organization-scoped resources.

The architecture should support:

USER
 ↓
ORGANIZATION MEMBERSHIP
 ↓
ORGANIZATION
 ↓
MODULES / DATA

==================================================
ORGANIZATION ENTITY
==================================================

Create an organization entity.

Suggested fields:

- id
- name
- legal_name
- slug
- code
- description
- email
- phone
- website
- address
- status
- timezone
- locale
- currency
- created_at
- updated_at

Only include fields that make sense for the existing architecture.

Do not overpopulate the organization model with future business-specific fields.

==================================================
ORGANIZATION STATUS
==================================================

Support organization lifecycle states.

At minimum:

ACTIVE
INACTIVE

Optionally support:

PENDING
SUSPENDED
ARCHIVED

Only implement additional states if they are useful to the platform architecture.

Inactive/suspended organizations must not be able to use protected organization-level functionality.

==================================================
ORGANIZATION MEMBERSHIP
==================================================

Users must be associated with organizations through a membership relationship.

Do NOT simply put organization_id directly on the users table if the architecture is intended to support users belonging to multiple organizations.

Preferred conceptual structure:

users
    │
    └── user_organizations
            │
            └── organizations

A user may belong to:

Organization A
Organization B
Organization C

depending on permissions and platform rules.

==================================================
MEMBERSHIP ENTITY
==================================================

Create a membership model/table.

Suggested fields:

- id
- user_id
- organization_id
- status
- joined_at
- created_at
- updated_at

Additional fields may be added if required.

Possible membership statuses:

ACTIVE
INVITED
SUSPENDED
REMOVED

==================================================
ORGANIZATION ROLES
==================================================

Integrate organization membership with the Phase 1 role/permission system.

Do NOT create a completely separate authorization system.

The relationship should conceptually be:

USER
 ↓
ORGANIZATION MEMBERSHIP
 ↓
ROLE
 ↓
PERMISSIONS

A role may be assigned within an organization.

Example:

User: John

Organization A
    Role: Manager

Organization B
    Role: Staff

John's permissions therefore depend on the organization context.

==================================================
ROLE SCOPE
==================================================

Extend Phase 1 authorization so that roles can be scoped appropriately.

Support the distinction between:

PLATFORM-LEVEL ROLE

and

ORGANIZATION-LEVEL ROLE

Example:

Platform:

Super Administrator

Organization:

Owner
Administrator
Manager
Staff

Do not hard-code these roles if Phase 1 was designed to make roles configurable.

The system should allow organizations to use configurable roles.

==================================================
PLATFORM ADMINISTRATOR
==================================================

A platform-level administrator should be able to manage organizations.

Platform administrators may:

- Create organizations
- View organizations
- Update organizations
- Activate organizations
- Deactivate organizations
- Manage organization memberships
- View organization users
- View organization information

Platform administrators should not automatically be treated as ordinary organization members unless explicitly assigned.

==================================================
ORGANIZATION OWNER
==================================================

Support an organization-level owner/administrator concept.

An organization owner should be able to manage their organization according to their assigned permissions.

Potential capabilities:

- View organization
- Update organization
- Manage members
- Assign organization roles
- Remove members
- View organization settings

Use the Phase 1 permission system to control these actions.

Do not bypass authorization simply because a user is marked as an owner.

==================================================
ORGANIZATION SETTINGS
==================================================

Create a generic organization settings area.

Settings may include:

- Organization name
- Contact information
- Address
- Timezone
- Locale
- Currency
- Date format
- Time format
- Other platform-level preferences

Do not add business-specific settings.

For example:

Do NOT add:

- Restaurant table settings
- Inventory settings
- School grading settings
- Delivery settings

Those belong to future modules.

==================================================
ORGANIZATION SWITCHING
==================================================

If a user belongs to multiple organizations, implement organization switching.

Example:

Current Organization:
    Organization A

Available Organizations:

    Organization A
    Organization B
    Organization C

When the user switches organizations:

1. Current organization context changes.
2. Permissions are recalculated for that organization.
3. Organization-scoped data changes accordingly.
4. API requests use the selected organization context.

The selected organization must never override server-side authorization.

==================================================
ORGANIZATION CONTEXT
==================================================

Implement a centralized organization-context mechanism.

The backend must know which organization the request is operating against.

Possible approaches include:

- organization ID in URL
- authenticated organization context
- request header
- token/session context

Follow the architecture established by Phase 0 and Phase 1.

Do not invent a completely separate context mechanism if one already exists.

==================================================
TENANT ISOLATION
==================================================

Tenant isolation is a critical security requirement.

Every organization-scoped resource must be checked against the authenticated user's organization membership.

Example:

User belongs to:

Organization A

Request:

GET /organizations/B/users

The request must be rejected unless the user has appropriate platform-level access.

Never rely solely on frontend organization filtering.

==================================================
DATA ACCESS
==================================================

Future organization-scoped modules should be able to follow a consistent pattern.

Conceptually:

Organization
    ↓
Business Module
    ↓
Module Data

For example, a future POS module could use:

organization_id
    ↓
products
sales
inventory

Phase 2 does NOT implement those business entities.

Instead, establish the architecture that allows them to be organization-scoped later.

==================================================
API
==================================================

Create organization management APIs following the conventions from Phase 0/1.

Conceptual endpoints:

Organizations:

GET    /organizations
POST   /organizations
GET    /organizations/{id}
PUT    /organizations/{id}
PATCH  /organizations/{id}/status
DELETE /organizations/{id}

Current organization:

GET    /organization/current
GET    /organization/current/settings
PUT    /organization/current/settings

Memberships:

GET    /organizations/{id}/members
POST   /organizations/{id}/members
GET    /organizations/{id}/members/{userId}
PUT    /organizations/{id}/members/{userId}
DELETE /organizations/{id}/members/{userId}

Roles:

GET    /organizations/{id}/roles
PUT    /organizations/{id}/members/{userId}/roles

Organization switching:

POST   /organization/switch

These are conceptual routes.

Adapt them to the actual API structure already established.

==================================================
ORGANIZATION CREATION
==================================================

When creating an organization, support the ability to establish its initial administrator/owner.

Example flow:

Create Organization
        ↓
Create/Select Owner
        ↓
Create Membership
        ↓
Assign Organization Role
        ↓
Organization becomes usable

The operation should be transactional.

If any required step fails, do not leave the organization in an inconsistent state.

==================================================
MEMBER MANAGEMENT
==================================================

Organization administrators should be able to:

- View members
- Invite/add users
- Activate members
- Suspend members
- Remove members
- Assign roles
- Change roles

Do not automatically give a newly-added member excessive permissions.

The assigned role determines access.

==================================================
INVITATION SYSTEM
==================================================

If the existing architecture supports email or invitation infrastructure, implement organization invitations.

An invitation should contain appropriate information such as:

- organization
- invited user/email
- role
- invitation status
- expiration
- created date
- accepted date

Possible statuses:

PENDING
ACCEPTED
EXPIRED
CANCELLED

If email infrastructure is not available in Phase 0, create the invitation domain model/API without requiring a complete external email provider.

Do not introduce an external email service solely for Phase 2 unless required.

==================================================
ORGANIZATION ACCESS
==================================================

A user may have:

No organization membership
    ↓
Platform-only access

One organization
    ↓
Single organization context

Multiple organizations
    ↓
Organization selection required

Define clear behavior for each case.

A normal organization user should not be able to access organization data without an active membership.

==================================================
FRONTEND
==================================================

Create organization-management UI using the existing frontend architecture and design system.

Create pages/components for:

1. Organization List
2. Organization Details
3. Create Organization
4. Edit Organization
5. Organization Members
6. Organization Roles
7. Organization Settings
8. Organization Switcher
9. Organization Invitations
10. Access Denied

Only expose functionality according to the user's permissions.

==================================================
ORGANIZATION LIST
==================================================

Platform administrators should have an organization list.

Provide:

- Search
- Filtering
- Pagination
- Status
- Organization name
- Organization code
- Created date
- Actions

Actions:

- View
- Edit
- Activate
- Deactivate
- Manage Members

==================================================
ORGANIZATION DETAILS
==================================================

Display:

- Organization information
- Status
- Member count
- Active member count
- Organization settings
- Roles
- Recent activity where supported

Keep the page generic.

Do not display business-specific metrics.

==================================================
MEMBERS PAGE
==================================================

Display:

- Member name
- Email
- Status
- Assigned roles
- Joined date
- Actions

Actions:

- View
- Edit roles
- Activate
- Suspend
- Remove

==================================================
ORGANIZATION SWITCHER
==================================================

Provide a reusable organization switcher.

It should display:

Current organization

and available organizations.

Changing organizations should refresh organization-scoped application data.

Do not allow the frontend to assume that the user has access to an organization.

The backend remains authoritative.

==================================================
AUTHORIZATION
==================================================

Integrate completely with Phase 1.

Examples of permissions:

organizations.view
organizations.create
organizations.update
organizations.delete
organizations.manage

organizations.members.view
organizations.members.create
organizations.members.update
organizations.members.delete

organizations.roles.view
organizations.roles.assign

organizations.settings.view
organizations.settings.update

Use the naming convention established in Phase 1.

Do not duplicate permission logic.

==================================================
BACKEND AUTHORIZATION
==================================================

Every organization-scoped endpoint must verify:

1. Authentication
2. Organization context
3. Membership
4. Role
5. Permission

Example:

Request
    ↓
Authentication
    ↓
Organization Context
    ↓
Membership Check
    ↓
Permission Check
    ↓
Controller
    ↓
Service
    ↓
Database

Do not allow controllers to manually implement inconsistent authorization logic.

Use middleware, policies, guards, or authorization services according to Phase 1 architecture.

==================================================
DATABASE
==================================================

Create migrations/models according to existing conventions.

Expected conceptual tables:

organizations
organization_memberships
organization_invitations

Potential supporting tables:

organization_settings

Only create separate settings tables if appropriate for the architecture.

Ensure:

- foreign keys
- indexes
- unique constraints
- timestamps
- appropriate deletion behavior

A user should not have duplicate active memberships for the same organization.

Organization slugs/codes should be appropriately unique.

==================================================
DATA ISOLATION
==================================================

Test tenant isolation carefully.

Example:

Organization A:
    User A
    Product data later

Organization B:
    User B
    Product data later

User A must never receive Organization B data through:

- API
- Search
- Pagination
- Filtering
- Direct ID lookup
- URL manipulation
- Organization switching
- Background requests

Do not rely solely on frontend filtering.

==================================================
AUDIT
==================================================

Use the audit system from Phase 1.

Record important organization events:

- Organization created
- Organization updated
- Organization activated
- Organization deactivated
- Member added
- Member removed
- Member suspended
- Role assigned
- Role removed
- Organization settings changed
- Organization switched
- Invitation created
- Invitation accepted
- Invitation cancelled

Include appropriate:

- user
- organization
- timestamp
- action

Do not record sensitive information unnecessarily.

==================================================
VALIDATION
==================================================

Validate:

Organization:

- name
- slug
- code
- email
- status
- timezone
- locale
- currency

Membership:

- valid user
- valid organization
- duplicate membership
- valid role

Invitation:

- valid organization
- valid email/user
- valid role
- expiration
- duplicate active invitation

Use the validation conventions from Phase 1.

==================================================
ERROR HANDLING
==================================================

Use the existing API error format.

Handle:

401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error

Do not expose internal implementation details.

==================================================
TESTING
==================================================

Create automated tests.

ORGANIZATION:

[ ] Organization can be created
[ ] Organization can be viewed
[ ] Organization can be updated
[ ] Organization can be activated
[ ] Organization can be deactivated
[ ] Invalid organization data is rejected

MEMBERSHIP:

[ ] User can be added to organization
[ ] Duplicate membership is rejected
[ ] Member can be removed
[ ] Member can be suspended
[ ] Member roles can be changed

AUTHORIZATION:

[ ] Platform administrator can manage organizations
[ ] Organization administrator can manage permitted resources
[ ] Organization member cannot access unauthorized resources
[ ] User cannot access another organization's data
[ ] Organization context is enforced
[ ] Frontend restrictions do not replace backend authorization

MULTI-ORGANIZATION:

[ ] User can belong to multiple organizations
[ ] User can switch organizations
[ ] Permissions change according to organization context
[ ] Organization data changes after switching
[ ] Unauthorized organization access is rejected

INVITATIONS:

[ ] Invitation can be created
[ ] Invitation can be accepted
[ ] Expired invitation is rejected
[ ] Cancelled invitation is rejected

SETTINGS:

[ ] Organization settings can be viewed
[ ] Authorized user can update settings
[ ] Unauthorized user cannot update settings

==================================================
SECURITY TESTING
==================================================

Explicitly test tenant isolation.

Attempt to access Organization B using:

- Organization B ID
- Direct API URL
- Query parameters
- Search filters
- Modified request body
- Modified organization header/context
- Another user's resource ID

All unauthorized access must be rejected.

==================================================
SEED DATA
==================================================

Create development seed data.

Example:

Organizations:

- Demo Organization
- Example Organization

Users should be associated with organizations using the Phase 1 user system.

Create appropriate roles and memberships.

Do not create production credentials.

Use safe development credentials according to the existing project conventions.

==================================================
DOCUMENTATION
==================================================

Update documentation with:

- Phase 2 architecture
- Multi-tenant model
- Organization structure
- Membership model
- Organization roles
- Organization permissions
- Organization context
- Tenant isolation
- API endpoints
- Invitation workflow
- Organization switching
- Testing instructions

Include diagrams where appropriate.

==================================================
DEFINITION OF DONE
==================================================

Phase 2 is complete when:

[ ] Organization entity exists
[ ] Organization CRUD works
[ ] Organization status works
[ ] Organization membership works
[ ] Multiple organization membership is supported where intended
[ ] Organization roles integrate with Phase 1 IAM
[ ] Organization permissions integrate with Phase 1 IAM
[ ] Organization context is implemented
[ ] Organization switching works
[ ] Organization settings work
[ ] Organization member management works
[ ] Invitation system is implemented where supported
[ ] Tenant isolation is enforced
[ ] Backend authorization works
[ ] Frontend authorization-aware UI works
[ ] Audit events are recorded
[ ] Database migrations work from a clean installation
[ ] Seeders work
[ ] Automated tests pass
[ ] Security/tenant-isolation tests pass
[ ] Documentation is updated
[ ] Phase 0 functionality remains intact
[ ] Phase 1 functionality remains intact

==================================================
IMPLEMENTATION RULES
==================================================

1. Inspect Phase 0 and Phase 1 before coding.

2. Reuse Phase 1 authentication and authorization.

3. Do not create another user system.

4. Do not create another role/permission system.

5. Do not create business-specific modules.

6. Keep organizations generic.

7. Keep organization logic separate from future business modules.

8. Make tenant isolation a backend responsibility.

9. Never trust organization IDs supplied by the frontend without authorization checks.

10. Use database constraints where appropriate.

11. Keep organization creation transactional.

12. Avoid unnecessary dependencies.

13. Do not over-engineer the organization system.

14. Follow existing project conventions.

15. Run tests, linting, formatting, and builds before completion.

16. Fix errors introduced by Phase 2.

17. Do not implement Phase 3 functionality.

==================================================
FINAL REPORT
==================================================

When implementation is complete, provide:

1. Phase 2 implementation summary
2. Architecture changes
3. Database changes
4. New models/entities
5. API endpoints
6. Frontend pages/components
7. Organization-context implementation
8. Tenant-isolation implementation
9. Authorization changes
10. Invitation implementation
11. Audit changes
12. Tests added
13. Test results
14. Files created
15. Files modified
16. Setup/seed instructions
17. Known limitations
18. Any architectural decisions made

Do not proceed to Phase 3.

The final result should provide a reusable multi-organization foundation that future business modules can attach to without implementing their own tenant isolation, membership, organization management, or organization-level authorization.