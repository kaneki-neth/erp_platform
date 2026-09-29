# Coding Standards

## 1. Backend (PHP / Laravel)
- Follow **PSR-12** formatting standards.
- Run `composer pint` or `vendor/bin/pint` before committing.
- Controllers should remain thin orchestrators delegating business logic to domain models / services.
- Never write direct un-scoped queries on tenant entities. Always utilize `BelongsToTenant` or explicit validation.

## 2. Frontend (TypeScript / React)
- Strict TypeScript (`strict: true`). No explicit `any` where types are definable.
- Component styling via Tailwind CSS classes.
- Server data state managed exclusively with **TanStack Query**.
- Centralized API requests in `src/api/*`.
