# Transactions Module

Purpose:
- Own transaction records and expose transaction CRUD operations.

Design:
- DTOs validate payloads.
- Service layer owns database orchestration.
- Controller layer stays transport-focused.
- `financialBreakdown` is calculated by the commissions service and stored on the transaction document.
- Stage transition rules are delegated to the `stage-policy` module.
- New transactions must start at `agreement`.
- Stage changes are handled through a dedicated endpoint: `PATCH /transactions/:id/stage`.
