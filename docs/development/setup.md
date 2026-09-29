# Local Development Setup

## Prerequisites
- PHP 8.3+
- Composer 2.6+
- Node.js 18+ & npm 10+
- MySQL or SQLite

## 1. Backend Setup (`apps/api`)
```bash
cd apps/api
cp .env.example .env
composer install
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --port=8000
```

Default seeded credentials:
- **Acme Retail Admin**: `admin@acme.com` / `password`
- **Acme Retail Staff**: `staff@acme.com` / `password`
- **Global Dynamics Admin**: `admin@global.com` / `password`

## 2. Frontend Setup (`apps/admin`)
```bash
cd apps/admin
cp .env.example .env
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.
