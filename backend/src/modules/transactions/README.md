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
- On `completed`, commission credits are distributed once to agent balances via balance service.
- Duplicate credits are prevented with transaction-level `balanceDistributionApplied` claim fields.
- Lightweight summary endpoint: `GET /transactions/summary` (completed transaction earnings aggregates).
- All transaction routes require bearer session auth.
- Mutation authorization is restricted to creator/listing/selling actors.
- Completed transactions are immutable for edit and stage updates.
- Deletion uses soft-delete audit fields (`isDeleted`, `deletedAt`, `deletedBy`) instead of hard-delete.
- `DELETE /transactions/:id` allows completed deletion only for `manager`/`admin` roles.
- `PATCH /transactions/:id` writes `updatedBy` using authenticated actor context.
- List endpoint supports pagination/filter/sort/search with paginated response envelope.
- `GET /transactions` hides soft-deleted records by default; `?includeDeleted=true` includes them.
