# Authentication Architecture

## 1. Sanctum API Tokens
Authentication utilizes Laravel Sanctum Bearer tokens. This provides a unified authentication mechanism for:
- React Admin Web SPA
- Future Offline Mobile POS (Expo / React Native)
- Third-party API consumers

## 2. Authentication Lifecycle
1. **Login**: Client issues `POST /api/v1/auth/login` with `email`, `password`, and optional `device_name`.
2. **Token Issuance**: Backend validates credentials, checks user & organization active status, and returns a plain text API token.
3. **Subsequent Calls**: Client attaches `Authorization: Bearer <token>` in the request header.
4. **Context Injection**: `auth:sanctum` verifies the token, and `TenantMiddleware` sets `TenantContext`.
5. **Logout**: Client issues `POST /api/v1/auth/logout`, revoking the current access token.
