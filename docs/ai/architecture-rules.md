# AI Architecture Rules

AI Coding Assistants working on this codebase MUST respect the following rules:

1. **NO Inertia / NO Blade UI**: Never add Inertia.js, Blade application screens, or server-rendered React components to `apps/api`. The backend must remain 100% headless REST API.
2. **Tenant Isolation is Non-Negotiable**: Never query tenant-owned models without `organization_id` scoping. Never accept an `organization_id` from client payloads without validating server-side that the authenticated user belongs to that organization.
3. **Backend is Authoritative**: Never place business rules, financial logic, or inventory stock calculations on the frontend client. The frontend is a presentation layer.
4. **Scope Discipline**: Do not prematurely create tables or endpoints for future business modules (sales, products, rentals, payroll) until specifically requested for that phase.
5. **Keep Monolith Modular**: Place future business logic into distinct module namespaces instead of polluting the platform core.
