# Modular Architecture

## 1. Platform Core vs Business Modules

### Platform Core
Contains shared infrastructural primitives required across all business domains:
- Organizations & Tenant Context
- Users & Identity
- Roles & Permissions
- Modules Registry & Organization Activations
- Audit Logging & Activity Tracking
- System Settings

### Business Modules
Encapsulate vertical domain capabilities:
- **POS**: Point of Sale terminals, cash registers, receipts.
- **Inventory**: Stock items, movement events, warehouses, batch tracking.
- **Purchasing**: Purchase orders, supplier tracking, receipts.
- **CRM**: Customers, loyalty points, purchase history.
- **Accounting**: General ledger, accounts, fiscal reports.

## 2. Dynamic Activation
The platform allows tenant organizations to enable or disable modules dynamically via `organization_modules`:
```
Organization A (Retail): POS, Inventory, Purchasing
Organization B (Consulting): CRM, Accounting
```

## 3. Boundary Rules
- Business modules must NOT bleed into Platform Core models.
- Core authentication and user management must never depend on POS or inventory classes.
