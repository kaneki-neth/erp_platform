# Business Management Platform (Modular ERP)

[![Phase 2: Organization & Tenant Management](https://img.shields.io/badge/Phase-2%20Organizations%20Ready-emerald.svg)](#current-project-phase)
[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#architecture)
[![Backend: Laravel 11 API](https://img.shields.io/badge/Backend-Laravel%2011%20API-red.svg)](#technology-stack)
[![Frontend: React + Vite + TS](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-cyan.svg)](#technology-stack)

> **Notice**: This repository has completed **Phase 1 (Identity & Access Management)** and **Phase 2 (Organization & Tenant Management)**. Business modules such as POS, Inventory, and Accounting belong to subsequent phases.

---

## 🏗 Architecture Overview

The platform uses a **Modular Monolith + API-First Architecture**:

- **Decoupled Client & Server**: The Laravel backend (`apps/api`) acts as the single authoritative API server. The React Admin web application (`apps/admin`) communicates strictly over JSON REST endpoints (`/api/v1/...`).
- **Multi-Organization & Dynamic Multi-Tenancy**: Organizations are isolated at the database level with tenant scoping (`organization_id`). Users can belong to multiple organizations with distinct roles per organization and switch context dynamically via `X-Organization-Id` header or the UI switcher.
- **Invitations & Member Management**: Secure token-based email invitation flow, organization rosters, custom roles per tenant, and member suspension/removal.
- **Dynamic Module Activation**: The platform core dynamically registers and enables modules per organization tenant without modifying core code.
- **Centralized IAM**: Centralized user directory, configurable role and permission assignments, status validation, and audit logging.

```
                    ┌───────────────────────┐
                    │      Laravel API      │
                    │      (apps/api)       │
                    │                       │
                    │ Authentication        │
                    │ Multi-Org & Tenancy   │
                    │ Memberships & Invites │
                    │ Users / Roles / Perms │
                    │ Dynamic Tenant Scope  │
                    │ Module Registry       │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
              ▼                 ▼                 ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │ React Admin   │ │ Mobile POS    │ │ Future Apps   │
      │ Web (Vite/TS) │ │ (Expo POS)    │ │ / Integrations│
      │ (apps/admin)  │ │ (Phase 3)     │ │               │
      └───────────────┘ └───────────────┘ └───────────────┘
```

---

## 📁 Repository Structure

```
ERP/
├── apps/
│   ├── api/                    # Laravel 11 Headless REST API
│   │   ├── app/
│   │   │   ├── Http/Controllers/Api/V1/ # Auth, Orgs, Members, Invitations, Users, Roles, Permissions, Modules
│   │   │   ├── Models/         # Organization, OrganizationMembership, OrganizationInvitation, User, Role, Permission, Module
│   │   │   ├── Scopes/         # TenantScope
│   │   │   ├── Services/       # TenantContext
│   │   │   └── Traits/         # BelongsToTenant, ApiResponse
│   │   └── tests/              # Feature, Membership, Context Switching, & Tenant Isolation Tests
│   │
│   └── admin/                  # React + TypeScript + Vite Admin Web
│       ├── src/
│       │   ├── api/            # API Client (Axios interceptors with X-Organization-Id, endpoints)
│       │   ├── context/        # AuthContext Provider (User profile & active organization switcher)
│       │   ├── layouts/        # Dashboard Shell & Header Switcher
│       │   ├── pages/          # Organizations, Settings, Members, Users, Roles, Modules, Login
│       │   └── routes/         # Protected Routes
│       └── ...
│
├── docs/
│   ├── architecture/           # Architecture Specifications & Design Documents
│   ├── development/            # Setup, Standards, Testing, Git Workflow
│   └── ai/                     # AI Assistant Guidelines & Guardrails
│
├── .gitignore
├── PHASE 1 Implementation.md
├── PHASE 2 Implementation.md
├── PROJECT FOUNDATION & ARCHITECTURE.md
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Setup (`apps/api`)
```bash
cd apps/api
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

### 2. Frontend Setup (`apps/admin`)
```bash
cd apps/admin
npm install
npm run dev
```

Visit **http://localhost:5173** and log in with default demo accounts:
- **Acme Retail Admin (Multi-Org Demo)**: `admin@acme.com` / `password` (Member of Acme & Global Dynamics)
- **Acme Retail Staff**: `staff@acme.com` / `password`
- **Global Dynamics Admin**: `admin@global.com` / `password`

---

## 🧪 Testing & Quality

### Run Backend Tests:
```bash
cd apps/api
php artisan test
```

### Run Frontend Build Check:
```bash
cd apps/admin
npm run build
```

---

## 📖 Documentation Index
- [Architecture Overview](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/overview.md)
- [Multi-Tenancy & Organizations](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/multi-tenancy.md)
- [IAM Architecture](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/iam-architecture.md)
- [API Architecture](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/api-architecture.md)
- [Modular Architecture](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/modular-architecture.md)
- [Local Development Setup](file:///C:/Users/Nikko/Herd/ERP/docs/development/setup.md)
- [AI Development Guidelines](file:///C:/Users/Nikko/Herd/ERP/docs/ai/ai-development-guidelines.md)
