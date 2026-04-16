# Services

Purpose:
- Encapsulate backend API communication and response normalization.

Current:
- `transactions.api.ts`: transaction CRUD reads/writes used by Pinia store.
- `api.errors.ts`: shared backend error message extraction for store-level handling.

Notes:
- API normalization fails fast on invalid payload shape to avoid silent UI corruption.
- Endpoint paths are centralized in service modules for consistency.
