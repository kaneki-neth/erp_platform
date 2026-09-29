# Architecture Overview

## 1. System Vision
The Business Platform is designed as a long-term, multi-tenant, modular business management platform capable of supporting diverse business types (retail, restaurants, equipment rentals, service/repair shops, salons, small offices).

## 2. Core Architectural Principles
1. **Modular Monolith First**: All platform core and business domains reside in a structured monolith backend to eliminate distributed complexity while enforcing clean module boundaries.
2. **API-First & Headless**: The backend (`apps/api`) is strictly a REST JSON API. The frontend (`apps/admin`) and future clients (e.g. mobile POS, web POS, integrations) consume the API identically.
3. **Multi-Tenancy by Design**: Multi-tenancy is enforced from day one using single-database multi-tenancy scoped by `organization_id`.
4. **Backend Authority**: Validation, authorization, business calculations, inventory movements, and financial rules are authoritatively executed on the server.
5. **Separation of Platform Core and Business Modules**: Core platform functionality (Organizations, Users, Roles, Permissions, Module registry, Audit logging) is strictly separated from vertical business modules (POS, Inventory, Purchasing, CRM).

## 3. High-Level Component Topology
```
               ┌────────────────────────────────────────┐
               │              Laravel API               │
               │               (apps/api)               │
               │                                        │
               │  - API Versioning (/api/v1)            │
               │  - Single-DB Tenant Scoping            │
               │  - Token Authentication (Sanctum)      │
               │  - Platform Core & Modules Registry     │
               └───────────────────┬────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
     ┌────────────────────┐ ┌─────────────┐ ┌───────────────────┐
     │ React Admin Web    │ │ Mobile POS  │ │ Future Clients    │
     │ (apps/admin)       │ │ (Expo POS)  │ │ & Integrations    │
     │ TypeScript / Vite  │ │ TypeScript  │ │                   │
     └────────────────────┘ └─────────────┘ └───────────────────┘
```
