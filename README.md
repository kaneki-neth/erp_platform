# Business Management Platform (Modular ERP)

[![Phase 0: Foundation](https://img.shields.io/badge/Phase-0%20Foundation-emerald.svg)](#current-project-phase)
[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-blue.svg)](#architecture)
[![Backend: Laravel 11 API](https://img.shields.io/badge/Backend-Laravel%2011%20API-red.svg)](#technology-stack)
[![Frontend: React + Vite + TS](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-cyan.svg)](#technology-stack)

> **Notice**: This repository is currently in **Phase 0 (Project Foundation & Architecture)**. Business modules such as POS, Inventory, and Accounting are not yet implemented and belong to subsequent phases.

---

## 🏗 Architecture Overview

The platform uses a **Modular Monolith + API-First Architecture**:

- **Decoupled Client & Server**: The Laravel backend (`apps/api`) acts as the single authoritative API server. The React Admin web application (`apps/admin`) and future clients (e.g., React Native Mobile POS) communicate strictly over JSON REST endpoints (`/api/v1/...`).
- **Single-Database Multi-Tenancy**: Organizations are isolated at the database level using automatic tenant scoping (`organization_id`). Cross-tenant access is prohibited and verified with automated test suites.
- **Dynamic Module Activation**: The platform core dynamically registers and enables modules per organization tenant without modifying core code.

```
                    ┌───────────────────────┐
                    │      Laravel API      │
                    │      (apps/api)       │
                    │                       │
                    │ Authentication        │
                    │ Organizations         │
                    │ Users / Roles         │
                    │ Tenant Isolation      │
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
│   │   │   ├── Http/Controllers/Api/V1/ # Auth, Orgs, Users, Roles, Modules
│   │   │   ├── Models/         # Organization, User, Role, Permission, Module, AuditLog
│   │   │   ├── Scopes/         # TenantScope
│   │   │   ├── Services/       # TenantContext
│   │   │   └── Traits/         # BelongsToTenant, ApiResponse
│   │   └── tests/              # Feature & Tenant Isolation Tests
│   │
│   └── admin/                  # React + TypeScript + Vite Admin Web
│       ├── src/
│       │   ├── api/            # API Client (Axios interceptors, endpoints)
│       │   ├── context/        # AuthContext Provider
│       │   ├── layouts/        # Dashboard Shell & Navigation
│       │   ├── pages/          # Login, Dashboard Overview, Users, Modules
│       │   └── routes/         # Protected Routes
│       └── ...
│
├── docs/
│   ├── architecture/           # Architecture Specifications & Design Documents
│   ├── development/            # Setup, Standards, Testing, Git Workflow
│   └── ai/                     # AI Assistant Guidelines & Guardrails
│
├── .gitignore
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
- **Acme Retail Admin (Tenant A)**: `admin@acme.com` / `password`
- **Acme Retail Staff (Tenant A)**: `staff@acme.com` / `password`
- **Global Dynamics Admin (Tenant B)**: `admin@global.com` / `password`

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
- [API Architecture](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/api-architecture.md)
- [Multi-Tenancy](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/multi-tenancy.md)
- [Modular Architecture](file:///C:/Users/Nikko/Herd/ERP/docs/architecture/modular-architecture.md)
- [Local Development Setup](file:///C:/Users/Nikko/Herd/ERP/docs/development/setup.md)
- [AI Development Guidelines](file:///C:/Users/Nikko/Herd/ERP/docs/ai/ai-development-guidelines.md)
