You are working on Phase 1 of an enterprise architecture platform.

The Phase 0 repository already exists and provides the foundational platform/core architecture. Your task is to build Phase 1 on top of that foundation.

IMPORTANT:
- Do NOT recreate or replace Phase 0 functionality.
- Follow the existing architecture, conventions, folder structure, coding standards, authentication approach, database conventions, and UI patterns established in Phase 0.
- Before writing code, inspect the entire Phase 0 repository and understand how its core modules are structured.
- Keep Phase 1 modular so future business modules can be added without modifying the core unnecessarily.
- Do not implement features that belong to later phases unless they are required for Phase 1.

==================================================
PHASE 1
IDENTITY & ACCESS MANAGEMENT
==================================================

OBJECTIVE

Build the platform's centralized Identity & Access Management (IAM) system.

The goal is to establish a reusable identity and authorization layer that future platform modules can depend on.

The IAM system must manage:

1. Users
2. Roles
3. Permissions
4. Role-permission assignments
5. User-role assignments
6. Authentication
7. Account status
8. Basic security/audit information

The system must be designed as a platform-level service rather than something specific to a single business type or module.

==================================================
ARCHITECTURE REQUIREMENTS
==================================================

Use the architecture established in Phase 0.

Maintain clear separation between:

- Platform Core
- IAM
- Future Business Modules

IAM must NOT contain business-specific logic.

For example:

DO NOT create permissions such as:

- manage_products
- manage_sales
- manage_inventory

unless they are only examples used by the permission engine.

Instead, create a generic permission system capable of supporting future permissions such as:

- module.view
- module.create
- module.update
- module.delete
- module.manage

Future business modules should be able to register/use their own permissions.

==================================================
AUTHENTICATION
==================================================

Implement centralized authentication.

Required functionality:

- Login
- Logout
- Authenticated session/token handling
- Current authenticated user
- Authentication middleware
- Password hashing
- Password validation
- Account status validation

Support the authentication mechanism already established by Phase 0.

Do NOT introduce another authentication technology if Phase 0 already has one.

The authentication system should make it possible for future applications/modules to authenticate against the same identity system.

==================================================
USER MANAGEMENT
==================================================

Create a platform-level user management module.

User fields should include appropriate fields such as:

- id
- name
- email/username
- password
- status
- email verification status if applicable
- last login information if applicable
- timestamps

Support:

- Create user
- View user
- Update user
- Activate user
- Deactivate user
- Delete user where appropriate
- Search users
- Filter users
- View assigned roles

Do not hard-delete users if the architecture established in Phase 0 uses soft deletion or another audit-preserving strategy.

==================================================
ROLE MANAGEMENT
==================================================

Create a generic role management system.

Roles must be configurable rather than hard-coded.

Required functionality:

- Create role
- View role
- Update role
- Delete/deactivate role
- Assign permissions to role
- View users assigned to role

Example platform roles may include:

- Super Administrator
- Administrator
- User

These are examples only.

The system must allow additional roles to be created later without code changes.

==================================================
PERMISSION MANAGEMENT
==================================================

Create a generic permission system.

Permissions should contain appropriate information such as:

- id
- name
- key/slug
- description
- module/resource
- action
- status

Use a predictable permission naming convention.

Example:

    users.view
    users.create
    users.update
    users.delete

    roles.view
    roles.create
    roles.update
    roles.delete

The permission system must support future modules registering their own permissions.

Do not hard-code authorization checks throughout controllers.

Authorization should use a centralized mechanism such as:

- middleware
- policies
- guards
- permission services

according to the Phase 0 architecture.

==================================================
ROLE-PERMISSION ASSIGNMENT
==================================================

Implement many-to-many role/permission relationships.

A role can have multiple permissions.

A permission can belong to multiple roles.

Example:

Administrator

    users.view
    users.create
    users.update
    users.delete
    roles.view
    roles.create
    roles.update

The UI should allow administrators to assign/unassign permissions from roles.

==================================================
USER-ROLE ASSIGNMENT
==================================================

Implement user-to-role assignment.

A user may have one or multiple roles depending on the architecture established in Phase 0.

Authorization should resolve the user's effective permissions through their assigned roles.

Example:

User
    ↓
Role
    ↓
Permissions
    ↓
Allowed Actions

==================================================
SUPER ADMINISTRATOR
==================================================

Implement a protected platform-level administrator capability.

The highest-level administrator should be able to manage:

- Users
- Roles
- Permissions
- Platform-level access

However, avoid implementing a bypass that makes the system impossible to secure or audit.

If Phase 0 already defines a super-admin mechanism, reuse it.

==================================================
ACCOUNT STATUS
==================================================

Users should have an account status.

At minimum support:

- Active
- Inactive

Inactive users must not be allowed to authenticate.

Design this so additional states can be added later if necessary.

==================================================
AUDIT / SECURITY
==================================================

Use the audit infrastructure from Phase 0 if it exists.

Record important security-related events such as:

- Login
- Logout
- Failed login
- User created
- User updated
- User activated/deactivated
- Role created
- Role updated
- Role assignment changes
- Permission assignment changes

Do not store plaintext passwords.

Do not log passwords, authentication tokens, or other sensitive credentials.

==================================================
API
==================================================

Expose clean API endpoints for IAM functionality.

Organize endpoints according to the API conventions established in Phase 0.

Suggested API areas:

Authentication:

POST   /auth/login
POST   /auth/logout
GET    /auth/me

Users:

GET    /users
POST   /users
GET    /users/{id}
PUT    /users/{id}
DELETE /users/{id}

Roles:

GET    /roles
POST   /roles
GET    /roles/{id}
PUT    /roles/{id}
DELETE /roles/{id}

Permissions:

GET    /permissions
GET    /permissions/{id}

Assignments:

GET    /users/{id}/roles
PUT    /users/{id}/roles

GET    /roles/{id}/permissions
PUT    /roles/{id}/permissions

These are conceptual routes.

Adapt them to the actual routing conventions established by Phase 0.

==================================================
FRONTEND
==================================================

Create the IAM administration interface using the frontend architecture established in Phase 0.

Create pages/views for:

1. Login
2. Users
3. User Details
4. Create/Edit User
5. Roles
6. Role Details
7. Create/Edit Role
8. Permission Management
9. Access Denied / Unauthorized

Use the existing design system/components from Phase 0.

Do NOT introduce a new UI framework if Phase 0 already provides one.

==================================================
USERS PAGE
==================================================

The Users page should provide:

- User list
- Search
- Filtering
- Pagination
- Account status
- Assigned roles
- Actions

Actions should include:

- View
- Edit
- Activate/Deactivate
- Role assignment

Use confirmation dialogs for destructive or security-sensitive actions.

==================================================
ROLE PAGE
==================================================

The Roles page should provide:

- Role list
- Search
- Status
- Permission count
- User count
- Actions

The Role Details page should allow administrators to manage permissions.

Organize permissions by module/resource so the interface remains manageable as the platform grows.

Example:

Users
    [✓] View
    [✓] Create
    [✓] Update
    [ ] Delete

Roles
    [✓] View
    [ ] Create
    [ ] Update
    [ ] Delete

==================================================
AUTHORIZATION
==================================================

The frontend must respect backend authorization.

Do not rely solely on frontend permission checks for security.

Frontend permission checks should only control UI visibility.

The backend must independently enforce permissions.

For example:

A user without:

    users.create

must receive an appropriate authorization response when attempting:

POST /users

even if the frontend request is manually sent.

==================================================
DATABASE
==================================================

Create the necessary migrations/models according to Phase 0 conventions.

Expected conceptual entities:

users
roles
permissions
user_roles
role_permissions

Additional tables may be introduced if required by the architecture.

Use proper:

- foreign keys
- indexes
- unique constraints
- timestamps
- soft deletion where appropriate

Avoid unnecessary duplication.

==================================================
SEEDING
==================================================

Create development/initial seed data.

At minimum include:

Roles:

- Super Administrator
- Administrator
- User

Permissions for the IAM module:

users.view
users.create
users.update
users.delete

roles.view
roles.create
roles.update
roles.delete

permissions.view

Assign appropriate permissions to the initial roles.

Create a development administrator account only if Phase 0's development environment supports seeded accounts.

NEVER hard-code a real production password.

Use environment configuration or a documented development credential mechanism.

==================================================
VALIDATION
==================================================

Implement backend validation for:

- Required fields
- Email/username uniqueness
- Password requirements
- Role names
- Permission keys
- Invalid role assignments
- Invalid permission assignments

Return consistent validation errors according to Phase 0 API conventions.

==================================================
ERROR HANDLING
==================================================

Use the standardized error response structure from Phase 0.

Handle:

- 401 Unauthorized
- 403 Forbidden
- 404 Not Found
- 422 Validation Error
- 409 Conflict where appropriate
- 500 Internal Server Error

Do not expose sensitive internal errors to clients.

==================================================
TESTING
==================================================

Create automated tests for the IAM system.

At minimum test:

Authentication:

- User can log in
- Invalid credentials are rejected
- Inactive user cannot log in
- User can log out
- Authenticated user can retrieve their profile

Users:

- Authorized administrator can create users
- Unauthorized user cannot create users
- User information can be updated
- User can be activated/deactivated

Roles:

- Role can be created
- Role can be updated
- Role can be deleted/deactivated

Permissions:

- Permissions can be assigned to roles
- Permissions can be removed from roles

Authorization:

- User with permission can access protected endpoint
- User without permission receives 403
- Unauthenticated user receives 401

==================================================
SECURITY REQUIREMENTS
==================================================

Follow secure development practices.

Never:

- Store plaintext passwords
- Return passwords in API responses
- Return authentication secrets unnecessarily
- Trust frontend authorization
- Allow inactive accounts to authenticate
- Expose sensitive audit information
- Allow unauthorized users to modify roles/permissions

Protect privileged IAM operations carefully.

==================================================
DOCUMENTATION
==================================================

Update the project's documentation with:

- Phase 1 overview
- IAM architecture
- Authentication flow
- Authorization flow
- User/Role/Permission relationships
- API endpoints
- Permission naming convention
- Development setup
- Seed data
- Testing instructions

Include an architecture diagram if Phase 0 already uses architecture diagrams.

==================================================
DEFINITION OF DONE
==================================================

Phase 1 is complete when:

[ ] Authentication works
[ ] Logout works
[ ] Current-user endpoint works
[ ] User management works
[ ] Role management works
[ ] Permission management works
[ ] User-role assignment works
[ ] Role-permission assignment works
[ ] Backend authorization works
[ ] Frontend permission-aware UI works
[ ] Account activation/deactivation works
[ ] Security/audit events are recorded
[ ] Database migrations work from a clean installation
[ ] Seeders work
[ ] Automated tests pass
[ ] API documentation is updated
[ ] Project documentation is updated
[ ] No Phase 0 functionality is broken

==================================================
IMPLEMENTATION RULES
==================================================

1. First inspect Phase 0 completely.

2. Identify:
   - Existing architecture
   - Existing authentication infrastructure
   - Existing database conventions
   - Existing API conventions
   - Existing frontend conventions
   - Existing UI components
   - Existing error handling
   - Existing audit/logging infrastructure
   - Existing testing structure

3. Reuse existing infrastructure whenever possible.

4. Do not duplicate functionality already implemented in Phase 0.

5. Do not introduce unnecessary dependencies.

6. Do not over-engineer Phase 1.

7. Keep IAM independent from future business modules.

8. Make the permission system extensible for future modules.

9. Backend authorization is the source of truth.

10. Keep the implementation production-oriented but practical.

11. If an architectural decision is unclear, inspect the existing Phase 0 implementation first rather than inventing a conflicting pattern.

12. Before finishing, run the project's available:
   - tests
   - linting
   - formatting
   - type checks, if applicable
   - build process

13. Fix errors introduced by the implementation.

14. Provide a final implementation summary containing:
   - Files/modules created
   - Files/modules modified
   - Database changes
   - API endpoints
   - Frontend pages
   - Authentication/authorization behavior
   - Tests added
   - Any assumptions made
   - Any known limitations
   - Instructions for running Phase 1

Do not proceed into Phase 2 functionality.

The final result should be a clean, reusable Identity & Access Management foundation that future platform modules can consume without having to implement their own authentication, users, roles, or permissions.