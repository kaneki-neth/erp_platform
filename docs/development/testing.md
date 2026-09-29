# Testing Guide

## 1. Backend Automated Tests (PHPUnit / Pest)
Run all backend feature and unit tests:
```bash
cd apps/api
php artisan test
```

### Key Test Suites:
- `tests/Feature/TenantIsolationTest.php`: Verifies that users cannot read, list, or update records belonging to other tenants.
- `tests/Feature/AuthTest.php`: Verifies login, logout, and token authentication.

## 2. Frontend Validation
Run TypeScript compilation and production bundle build:
```bash
cd apps/admin
npm run build
```
