PHASE 0 — PROJECT FOUNDATION & ARCHITECTURE
Role

Act as a senior software architect and full-stack engineer.

You are initializing a new repository for a long-term multi-tenant, modular business management platform.

The platform will eventually support multiple business types and modules such as:

Retail
Restaurants
Rental businesses
Repair/service businesses
Salons
Small offices
Other SMEs

Future modules may include:

POS
Inventory
Purchasing
Customers
Suppliers
Rental management
Service/job management
Appointments
CRM
Accounting
Employees/HR
Reporting
Notifications
Subscriptions/billing

The platform must be designed so that these modules can be added incrementally without rewriting the core architecture.

1. PRIMARY ARCHITECTURAL DECISION

Use a modular monolith + API-first architecture.

The backend and frontend MUST be separate applications.

                    ┌───────────────────────┐
                    │      Laravel API      │
                    │                       │
                    │ Authentication        │
                    │ Organizations         │
                    │ Users / Roles         │
                    │ Permissions            │
                    │ Modules               │
                    │ Business Logic         │
                    │ Database Access        │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │ React Admin   │ │ Mobile POS    │ │ Future Apps   │
      │ Web           │ │ React Native  │ │ / Integrations│
      │ TypeScript    │ │ Expo          │ │               │
      └───────────────┘ └───────────────┘ └───────────────┘

The Laravel application is the central API and business-logic layer.

The React application is a separate frontend client.

The future mobile POS will also be a separate client.

2. IMPORTANT: API-FIRST REQUIREMENT

The Laravel application MUST be API-first.

Do NOT use:

Inertia
Laravel-rendered React pages
Blade-based application UI
Server-rendered application screens

Laravel should expose API endpoints consumed by external clients.

The React Admin application must communicate with Laravel through the API.

Future clients must be able to consume the same API without requiring changes to the architecture.

Potential future clients:
React Admin Web
React Native Mobile POS
Future Mobile Apps
Future Web POS
Third-party integrations
Partner applications

The backend must not assume that the client is React.

3. REPOSITORY STRUCTURE

Use a monorepo structure.

Initial repository:
business-platform/
│
├── apps/
│   ├── api/
│   │   └── Laravel application
│   │
│   └── admin/
│       └── React application
│
├── docs/
│   ├── architecture/
│   ├── development/
│   └── ai/
│
├── .gitignore
├── README.md
└── ...

Do NOT create the mobile POS application yet.
Do NOT create unnecessary shared packages yet.
Future structure may become:
business-platform/
│
├── apps/
│   ├── api/
│   ├── admin/
│   └── mobile-pos/
│
├── packages/
│   ├── shared-types/
│   ├── api-client/
│   └── ui/
│
└── docs/
But these future directories should not be implemented during Phase 0 unless they are genuinely required.

4. BACKEND TECHNOLOGY

Use:

Laravel
PHP
MySQL
REST API
Redis-ready architecture
Queue-ready architecture
PHPUnit/Pest
Laravel Pint

The backend should be structured for long-term modular development.

The API should use versioning.

Initial API convention:
/api/v1/...

Examples:
/api/v1/auth/...
/api/v1/organizations/...
/api/v1/users/...
/api/v1/roles/...
/api/v1/permissions/...
/api/v1/modules/...

Do not implement business modules yet.

5. ADMIN WEB TECHNOLOGY

Use:

React
TypeScript
Vite
Tailwind CSS
shadcn/ui
React Router
TanStack Query
ESLint
Prettier

The admin frontend must communicate with the Laravel API.

There must be no direct database access from the React application.

Architecture:
React Admin
     │
     │ HTTP/JSON API
     ▼
Laravel API
     │
     ▼
MySQL

6. STATE MANAGEMENT

Use TanStack Query for server/API state.

Examples:

Organizations
Users
Roles
Permissions
Modules
Dashboard data
API responses

Do not put API data into a global Zustand store simply because it is convenient.

If client-side state management is needed later, use a lightweight solution such as Zustand for UI/client state.

Examples:
Zustand:
- sidebar state
- temporary UI state
- local preferences
- wizard state
TanStack Query:
- users
- organizations
- permissions
- products
- inventory
- reports
- API data

7. MULTI-TENANCY

The platform must support multiple businesses/organizations from the beginning.

Use single-database multi-tenancy initially.

Do not introduce database-per-tenant architecture during Phase 0.

The initial concept should be:
organizations
    │
    ├── users
    ├── roles
    ├── permissions
    ├── module access
    └── business data

Business-owned records should use an appropriate tenant identifier such as:
organization_id
Example:
products
---------
id
organization_id
name
...

sales
---------
id
organization_id
...

customers
---------
id
organization_id
...

Tenant isolation is a security requirement, not merely an organizational convention.

Every tenant-owned query must be scoped to the authenticated organization.

Never trust an organization_id supplied by the client without validating that the authenticated user has access to it.

8. PLATFORM CORE VS BUSINESS MODULES

The architecture MUST distinguish between the Platform Core and Business Modules.

Platform Core

The platform core contains functionality shared by almost every business.

Examples:
Organizations
Users
Roles
Permissions
Authentication
Modules
Subscriptions
Settings
Audit Logs
Notifications

Business Modules

Business-specific functionality belongs in modules.

Examples:
POS
Inventory
Purchasing
Rental
Appointments
Service Management
CRM
Accounting
HR
Reporting

Do not put POS-specific logic inside the platform core.

Do not put inventory-specific logic inside authentication or organization management.

9. MODULE SYSTEM

Design the platform so modules can eventually be enabled or disabled for an organization.

Conceptually:
Organization A
    POS
    Inventory
    Purchasing

Organization B
    Rental
    Customers
    Payments

Organization C
    POS
    Inventory
    Customers
    Employees

The exact subscription/billing behavior does not need to be implemented in Phase 0.

However, the architecture must not prevent it.

The module system should eventually support:
module
---------
id
name
key
description
status

and organization/module relationships such as:
organization_modules
--------------------
organization_id
module_id
enabled

Do not over-engineer this during Phase 0.

10. AUTHENTICATION

Implement the foundation for API authentication.

The authentication system must support:

Login
Logout/revocation where appropriate
Current authenticated user
Password handling
Authentication middleware
Protected API routes

The exact authentication implementation should use Laravel's current recommended API authentication approach appropriate for a separate SPA/mobile-client architecture.

Do not couple authentication to the React application.

The API must remain usable by future mobile clients.

11. AUTHORIZATION

Establish the foundation for:
Users
Roles
Permissions

Example conceptual hierarchy:

Organization
    │
    ├── User
    │     └── Role
    │           └── Permissions
    │
    └── Enabled Modules

The authorization system must eventually allow things such as:

inventory.view
inventory.create
inventory.update

pos.view
pos.create
pos.refund

users.view
users.create
users.update

Do not implement every future permission during Phase 0.

Create the architecture so permissions can be added cleanly.

12. ADMIN APPLICATION FOUNDATION

The React Admin application should contain only the foundation required for the platform.

Create:

Application shell
Routing
Authentication state
Login page
Protected routes
Basic dashboard placeholder
Navigation/sidebar
Header
User/account area
API client configuration
Error handling foundation
Loading states
Basic reusable UI components

Do not implement:

POS
Inventory
Rental
Accounting
CRM
HR
Reporting modules

The dashboard should remain a platform-level placeholder.

13. API CLIENT

Create a clean API communication layer in the React application.

Do not scatter raw fetch() calls throughout components.

Prefer a structure conceptually similar to:

admin/
└── src/
    ├── api/
    │   ├── client.ts
    │   ├── auth.ts
    │   ├── organizations.ts
    │   └── users.ts
    │
    ├── components/
    ├── layouts/
    ├── pages/
    ├── routes/
    ├── hooks/
    ├── lib/
    └── types/

Keep API communication separate from presentation components.

14. ENVIRONMENT CONFIGURATION

The project must support separate environments.

At minimum:

local
development
production

Do not hardcode:

API URLs
Database credentials
Secrets
Tokens
Private keys

The React application should obtain its API base URL through environment configuration.

Example concept:

VITE_API_URL=...

The Laravel application must use environment configuration for:

database
cache
queue
mail
application URL
authentication
etc.

Do not commit secrets.

Provide .env.example files where appropriate.

15. DATABASE FOUNDATION

Create the database foundation for:

Organizations
Users
Roles
Permissions
Modules
Organization/module relationships
Audit logs if appropriate for Phase 0

Do not create tables for future business modules yet.

Do not create:

products
sales
sale_items
inventory
stock_movements
suppliers
rental_contracts
appointments
invoices
etc.

Those belong to future phases.

16. AUDITABILITY

The platform should eventually support auditing important actions.

Design for audit logs without creating an unnecessarily complicated event-sourcing system.

Potential structure:

audit_logs
----------
id
organization_id
user_id
action
subject_type
subject_id
metadata
created_at

The exact implementation may be minimal during Phase 0.

Do NOT implement full event sourcing.

17. SECURITY REQUIREMENTS

Treat security as a first-class requirement.

The application must:

Validate API input
Authorize every protected resource
Prevent cross-tenant data access
Avoid trusting client-provided organization IDs
Protect authentication endpoints
Avoid exposing secrets
Use secure password handling
Use appropriate API authentication
Validate permissions server-side
Avoid mass-assignment vulnerabilities
Avoid leaking sensitive information in API errors
Follow Laravel security best practices

Never rely on frontend authorization alone.

For example:

WRONG:

React hides "Delete User"
    ↓
Therefore user cannot delete

CORRECT:

React hides "Delete User"
    +
Laravel verifies delete permission

The backend is the final authority.

18. FUTURE OFFLINE-FIRST POS

Do not implement the offline POS during Phase 0.

However, the architecture must accommodate it.

The future mobile POS is expected to use:

React Native
Expo
TypeScript
SQLite

Architecture:

                ONLINE
                  │
                  ▼
          ┌───────────────┐
          │ Laravel API   │
          └───────┬───────┘
                  │
                  ▼
               MySQL


                MOBILE
                  │
                  ▼
          ┌───────────────┐
          │ React Native  │
          │ Expo          │
          │ TypeScript    │
          │ SQLite        │
          └───────────────┘

The mobile POS should eventually be able to:
Sell while offline
Store transactions locally
Queue changes
Retry synchronization
Detect duplicate submissions
Synchronize when connectivity returns
Handle inventory synchronization carefully

Future offline transactions should use globally unique identifiers and idempotent server operations where appropriate.

Do not implement synchronization during Phase 0.

19. INVENTORY ARCHITECTURE CONSIDERATION

Future inventory should preferably be based on stock movements/events, rather than treating the current stock quantity as the only source of truth.

Conceptually:

Purchase
    ↓
+ Stock

Sale
    ↓
- Stock

Adjustment
    ↓
+/- Stock

Return
    ↓
+ Stock

This will become important for offline POS synchronization.

Do not implement inventory during Phase 0.

Document this as an architectural consideration.

20. FUTURE SERVER ARCHITECTURE

Do not implement microservices.

Start with a modular monolith.

Initial deployment may eventually look like:

             Internet
                │
                ▼
        ┌───────────────┐
        │ Laravel API   │
        └───────┬───────┘
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      MySQL   Redis    Queue

As traffic grows, the architecture may evolve toward:

                Load Balancer
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       API #1      API #2      API #3
          │          │          │
          └──────────┼──────────┘
                     │
               MySQL / Redis

Only extract services when there is a demonstrated reason to do so.

Do not introduce:

Kubernetes
Microservices
Service mesh
CQRS everywhere
Event sourcing everywhere
Separate servers per business type

during Phase 0.

21. CODE ORGANIZATION

Follow clean separation of responsibilities.

Avoid putting substantial business logic inside:

Controllers
React components
Route definitions

Prefer appropriate separation such as:

Controller
    ↓
Application/service layer
    ↓
Domain/business logic
    ↓
Repositories/models/database

Do not blindly implement a complex architecture if a simpler Laravel-native solution is sufficient.

The goal is maintainability, not architectural ceremony.

22. DOCUMENTATION

Create documentation explaining the architecture.

At minimum:

docs/
├── architecture/
│   ├── overview.md
│   ├── api-architecture.md
│   ├── multi-tenancy.md
│   ├── modular-architecture.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── database-strategy.md
│   ├── future-scaling.md
│   └── offline-pos.md
│
├── development/
│   ├── setup.md
│   ├── coding-standards.md
│   ├── git-workflow.md
│   └── testing.md
│
└── ai/
    ├── project-context.md
    ├── architecture-rules.md
    └── ai-development-guidelines.md

Documentation does not need to be unnecessarily long.

It should explain the decisions that future developers or AI coding agents need to understand.

23. AI DEVELOPMENT GUIDELINES

This project will be heavily developed with AI coding assistants.

Create explicit rules for AI agents.

AI agents must:

Read the relevant documentation before changing architecture.
Respect application boundaries.
Keep Laravel API and React Admin separate.
Never bypass tenant isolation.
Never move business logic into the frontend merely for convenience.
Avoid unnecessary dependencies.
Avoid premature abstractions.
Avoid implementing future modules without being asked.
Make small, focused changes.
Preserve existing functionality.
Add tests for meaningful business logic.
Never expose secrets.
Never perform destructive database operations without explicit approval.
Explain architectural changes before implementing significant ones.
Follow established project conventions.
Update documentation when architectural decisions change.

AI agents must not assume that:

"implement this feature"

means:

"redesign the architecture."

Changes should remain within the requested scope.

24. GIT WORKFLOW

Initialize Git properly.

Create a clean initial commit after the foundation is working.

Recommended commit style:

feat:
fix:
refactor:
docs:
test:
chore:

Examples:

feat: add organization management
feat: add role permission system
fix: prevent cross-tenant access
docs: document API architecture
test: add organization authorization tests

Do not commit:

.env
secrets
API keys
private credentials
local database files
build artifacts
node_modules
vendor
25. TESTING

Establish testing infrastructure during Phase 0.

Backend tests should eventually cover:

Authentication
Authorization
Tenant isolation
Organization access
Permissions

At minimum, create tests demonstrating that:

User from Organization A
    CANNOT
access Organization B data.

Frontend testing infrastructure may be established, but do not spend excessive time creating large test suites for placeholder UI.

26. API RESPONSE CONVENTION

Establish a consistent API response format.

For example:

{
    "data": {},
    "message": "Success"
}

Validation/error responses should also follow a consistent convention.

Do not create a complicated custom API specification unless necessary.

The important requirement is consistency.

27. ERROR HANDLING

The React application should have a central approach for:

Authentication errors
Validation errors
Authorization errors
Not found
Server errors
Network failures
Loading states

Do not duplicate error-handling logic across every component.

The backend should return appropriate HTTP status codes.

28. CORS

Because the frontend and backend are separate applications, configure CORS correctly for local development and future deployment.

Example development architecture:

React Admin
http://localhost:5173

        ↓

Laravel API
http://localhost:8000

Do not simply allow every origin in production.

Use environment-specific configuration.

29. README

Create a professional root README explaining:

Project purpose
Architecture
Repository structure
Technology stack
How to run the API
How to run the Admin Web
Environment configuration
Testing
Code quality commands
Development workflow
Links to architecture documentation
Current project phase
Future roadmap

Clearly state:

This repository is currently in Phase 0 and does not contain business modules such as POS or Inventory.

30. PHASE 0 NON-GOALS

DO NOT implement the following during Phase 0:

Business functionality
POS
Inventory
Purchasing
Rental
Accounting
CRM
HR
Appointments
Service management
Invoicing
Payroll
Advanced reporting
Mobile
React Native
Expo mobile application
SQLite synchronization
Offline POS
Mobile printing
Infrastructure overengineering
Microservices
Kubernetes
Service mesh
Separate database per tenant
Separate server per business
CQRS
Full event sourcing
Complex distributed systems
Premature service extraction
Other
Payment gateway integration
Subscription billing implementation
Advanced analytics
AI business features
Customer-facing applications

The purpose of Phase 0 is to establish a strong foundation, not to build the entire platform.

31. PHASE 0 SUCCESS CRITERIA

Phase 0 is complete when:

Repository
Git repository initialized
Clean monorepo structure exists
README exists
Documentation exists
Backend
Laravel API application works
API versioning exists
Database connection works
Authentication foundation works
Organization foundation exists
Authorization foundation exists
Tenant isolation is established
Tests run successfully
Admin
React + TypeScript application works
React Router works
API communication works
Login flow works
Protected routes work
Basic application shell exists
TanStack Query is configured
Environment-based API URL works
Architecture
Backend and frontend are completely separate
No Inertia dependency
No Laravel-rendered React pages
Business logic belongs to the backend
Frontend consumes the API
Multi-tenancy is considered from the beginning
Platform Core is separated conceptually from Business Modules
Future mobile clients can consume the same API
32. EXPECTED INITIAL DEVELOPMENT ORDER

Follow this approximate order:

1. Analyze repository requirements
        ↓
2. Create monorepo structure
        ↓
3. Initialize Laravel API
        ↓
4. Configure MySQL
        ↓
5. Establish API conventions
        ↓
6. Implement authentication foundation
        ↓
7. Implement organizations
        ↓
8. Implement tenant isolation
        ↓
9. Implement users
        ↓
10. Implement roles/permissions foundation
        ↓
11. Implement module foundation
        ↓
12. Initialize React Admin
        ↓
13. Configure TypeScript/Vite/Tailwind/shadcn
        ↓
14. Configure API client
        ↓
15. Configure authentication flow
        ↓
16. Build basic Admin shell
        ↓
17. Add protected routing
        ↓
18. Add testing
        ↓
19. Add documentation
        ↓
20. Verify complete Phase 0

You may adjust this order when technically necessary, but do not expand the scope.

33. IMPORTANT ARCHITECTURAL PRINCIPLES

The following principles should guide the entire project.

1. API-first

Laravel is the central API and business-logic layer.

2. Frontend independence

React should not contain authoritative business rules.

3. Multi-tenant from the beginning

Tenant isolation must not be retrofitted later.

4. Modular monolith first

Keep modules logically separated while deploying them as one application.

5. Business-agnostic core

The platform core should not be designed around only POS, restaurants, rental, or any single business type.

6. Offline-ready

Future POS requirements should influence API and data design, but offline synchronization should not be implemented prematurely.

7. Simple before complex

Do not introduce infrastructure simply because it might be useful someday.

8. Scale based on evidence

Start with a simple deployment and scale when actual usage requires it.

9. Backend is authoritative

Authorization, validation, inventory rules, financial rules, and other business rules must ultimately be enforced server-side.

10. AI-friendly architecture

The codebase and documentation should make it difficult for an AI coding agent to accidentally violate architectural boundaries.

34. BEFORE CODING

Before making significant changes:

Analyze the requirements.
Identify architectural conflicts.
Identify missing decisions.
Propose the repository structure.
Explain any assumptions.
Then implement.

Do not silently make major architectural decisions that conflict with this document.

If a requirement conflicts with the architecture, stop and explain the conflict before proceeding.

35. AFTER IMPLEMENTATION

After implementation:

Run backend tests.
Run frontend checks.
Run linting.
Run formatting checks.
Verify the Laravel API starts correctly.
Verify the React Admin starts correctly.
Verify the frontend can communicate with the API.
Verify authentication.
Verify protected routes.
Verify tenant isolation tests.
Check for accidental secrets.
Review the Git diff.
Update documentation where necessary.

Then provide a final implementation report containing:

## Implemented

## Repository Structure

## Architecture Decisions

## Commands Used

## Tests

## Known Limitations

## Phase 0 Status

## Recommended Next Step

Do not claim something works unless it was actually verified.

FINAL PROJECT DIRECTION

The long-term architecture should evolve approximately like this:

PHASE 0
Foundation
│
├── Laravel API
└── React Admin
        │
        ▼
PHASE 1
Platform Core
│
├── Organizations
├── Users
├── Roles
├── Permissions
└── Modules
        │
        ▼
PHASE 2
POS + Inventory
│
├── Products
├── Stock
├── Sales
├── Payments
└── Reports
        │
        ▼
PHASE 3
Offline Mobile POS
│
├── React Native
├── Expo
├── SQLite
├── Offline transactions
└── Synchronization
        │
        ▼
PHASE 4+
Additional Business Modules
│
├── Rental
├── Service Management
├── Purchasing
├── CRM
├── Accounting
├── HR
└── Other modules

The key architectural rule is:

Laravel API = platform/business authority

React Admin = web client

React Native POS = future mobile client

MySQL = central persistent database

SQLite = future local POS database

Platform Core ≠ Business Modules
