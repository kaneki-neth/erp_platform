# Offline-First Mobile POS Architecture

## 1. Concept
The future Mobile POS client (Phase 3) will be built using **React Native / Expo + SQLite** to enable checkout even when internet connectivity drops.

## 2. Synchronization Considerations
1. **Event-Based Stock Movements**: Inventory adjustments must use append-only stock movement events (+/- delta) rather than absolute stock overwrites.
2. **Idempotency Keys / UUIDs**: Transactions generated on offline tablets will carry UUIDs to avoid duplicate charges or duplicate stock deductions upon reconnection.
3. **Optimistic Local Queue**: Offline sales queue up in local SQLite and flush sequentially via `/api/v1/pos/sync` when connectivity is restored.
