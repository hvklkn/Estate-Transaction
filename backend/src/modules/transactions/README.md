# Transactions Module

Purpose:
- Own transaction records and expose transaction CRUD operations.

Design:
- DTOs validate payloads.
- Service layer owns database orchestration.
- Controller layer stays transport-focused.
- `financialBreakdown` is calculated by the commissions service and stored on the transaction document.
- `financialBreakdown` is stored as a snapshot for stable read-time reporting.
- Stage transition rules are delegated to the `stage-policy` module.
- New transactions must start at `agreement`.
- Stage changes are handled through a dedicated endpoint: `PATCH /transactions/:id/stage`.
- Stage history is appended on create and each stage transition for traceability.
- Lightweight summary endpoint: `GET /transactions/summary` (completed transaction earnings aggregates).
