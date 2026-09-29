# AI Assistant Project Context

## Project Purpose
This repository houses an enterprise multi-tenant business management platform designed to support diverse SME verticals (retail POS, inventory, purchasing, equipment rentals, service/job management, CRM, accounting, HR).

## Current Phase: Phase 0 (Foundation)
Phase 0 establishes:
- Headless API Monolith in `apps/api` (Laravel 11, Sanctum, single-DB multi-tenant scoping).
- Admin Web Client in `apps/admin` (React + Vite + TypeScript + Tailwind + TanStack Query).
- Modular Monolith registry allowing dynamic module activation per tenant.
- Strict cross-tenant isolation enforcement.
