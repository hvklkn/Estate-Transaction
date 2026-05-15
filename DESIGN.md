# Design

## 1. Summary

The platform models the real estate transaction lifecycle with strict workflow safety, deterministic commission calculations, organization-scoped access, and auditable mutation trails.

Primary design goals:

- keep business policy out of controllers and UI components
- centralize lifecycle and mutation rules in dedicated services
- enforce explicit authentication and authorization on protected workflows
- provide queryable, dashboard-friendly APIs

## 2. Architecture

- `backend/`: NestJS and Mongoose API boundary
- `frontend/`: Nuxt 3 and Pinia dashboard boundary

Core principles:

- thin controllers, policy-focused services
- DTO-driven explicit validation
- traceability fields are write-protected from client spoofing
- frontend service layer normalizes API contracts before state writes

## 3. Auth and Authorization

### Authentication Model

- Session tokens are generated at login and stored hashed in `Agent.sessions[]`.
- Protected routes use bearer auth: `Authorization: Bearer <sessionToken>`.
- `SessionAuthGuard` resolves authenticated session context and attaches it to request.
- `CurrentSession` decorator exposes `agentId` and `sessionToken` to controllers.

### Protected Surface

- All transaction routes (`/transactions/*`)
- Self-service profile/session routes (`/agents/me/*`)
- `POST /agents/logout`
- Tenant resources such as clients, properties, tasks, notes, reports, and balance workflows

### Authorization Model For Transaction Mutations

Mutations are allowed only if the authenticated actor is one of:

- `createdBy`
- `listingAgentId`
- `sellingAgentId`

Additional privileged actions are role-gated. Enforcement is centralized in `TransactionMutationPolicyService` and role guards.

## 4. Transaction Immutability And Workflow Safety

### Stage Policy (`StageTransitionPolicyService`)

- Create must start at `agreement`.
- Only immediate forward transitions are allowed.
- Backward, skipped, and same-stage transitions are rejected.
- `completed` is terminal.

### Mutation Policy (`TransactionMutationPolicyService`)

- Completed transactions are immutable:
  - no `PATCH /transactions/:id`
  - no `PATCH /transactions/:id/stage`
  - completed delete is restricted to privileged roles and remains a soft delete
- After leaving `agreement`, workflow-critical fields are locked:
  - `listingAgentId`
  - `sellingAgentId`
  - `transactionType`
  - `totalServiceFee`
- Soft-deleted transactions are immutable for mutation routes.

This prevents participant, fee, and type changes that would break lifecycle semantics mid-flow.

## 5. Audit And Traceability Decisions

- `createdBy` is always derived from the authenticated session actor at creation.
- `updatedBy` is always derived from the authenticated session actor on edit, stage, and delete mutations.
- Stage history is append-only and system-generated on create and each valid transition.
- `stageHistory.changedBy` is always server-derived from the bearer session actor.
- Soft-delete trail is explicit on transaction:
  - `isDeleted`
  - `deletedAt`
  - `deletedBy`
- Header-based actor spoofing (`x-agent-id`) is intentionally rejected.

These decisions keep actor fields trustworthy for operational and audit workflows.

## 6. Query And List Strategy

`GET /transactions` supports dashboard-grade server querying:

- pagination: `page`, `limit`
- filters: `stage`, `transactionType`
- soft-delete visibility: `includeDeleted`
- search: property title plus listing/selling agent name or email
- sorting: `createdAt|updatedAt|totalServiceFee|propertyTitle` plus `asc|desc`

Response envelope:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0
}
```

Indexing priorities:

- stage/date and type/date combinations
- listing/selling agent date patterns
- property title reads for search support
- soft-delete-aware read patterns (`isDeleted` plus stage/date)

## 7. Frontend Dashboard Contract

- Pinia store state is driven by backend list queries.
- Query state maps directly to backend API params.
- UI states are explicit: loading, refresh, error, empty-with-filters, and empty-initial.
- Lifecycle UX emphasizes next allowed actions and terminal completed visuals.
- Detail panels prioritize stage timeline, notes, and readable commission role breakdown.

## 8. Testing Strategy

Unit coverage focuses on:

- commission distribution policy
- stage transition policy
- transaction mutation policy
- transaction service orchestration
- role permission rules

E2E coverage includes:

- register/login flow
- authenticated transaction creation
- stage update and summary
- invalid transition and payload handling
- unauthorized and forbidden scenarios

`mongodb-memory-server` is used for isolated backend tests where possible.

## 9. Deployment Readiness

Frontend:

- `frontend/vercel.json`
- Nuxt build path via `build:vercel`

Backend:

- Dockerized backend with `backend/Dockerfile`
- Render blueprint: `render.yaml`
- Railway config: `railway.json`

Production checklist:

- set `MONGODB_URI`
- set deployed `CORS_ORIGIN`
- set `NUXT_PUBLIC_API_BASE_URL`
- configure Resend variables if password reset email delivery is required

## 10. Balance And Ledger Design

### Data Model

- `Agent.balanceCents`: current wallet balance in integer cents.
- `balance_ledger` collection: append-only movement records for every credit, adjustment, or reversal.

Ledger record fields:

- `userId`
- `transactionId` (nullable)
- `type` (`commission_credit | manual_adjustment | reversal`)
- `amount` (cents, signed)
- `previousBalance` (cents)
- `newBalance` (cents)
- `description`
- `createdAt`
- `createdBy`

### Why Ledger And Balance

- Balance alone gives current state but not audit explainability.
- Ledger gives immutable movement timeline, actor trace, and transaction linkage.
- `previousBalance` and `newBalance` snapshots make each row independently verifiable.

### Commission Credit Integration

- On transition to `completed`, transaction service calls balance service with commission allocations.
- Balance service claims distribution once using transaction-level flags:
  - `balanceDistributionApplied`
  - `balanceDistributionAppliedAt`
  - `balanceDistributionAppliedBy`
  - `balanceDistributionLedgerIds`
- Claim checks prevent duplicate wallet credit under retried or concurrent completion requests.

### Duplicate Credit Prevention

- Credit flow starts with atomic `findOneAndUpdate` claim on:
  - transaction id
  - `stage = completed`
  - `balanceDistributionApplied = false`
- If claim fails, flow is treated as already applied and exits without new credits.

### Immutability And Reversal Safety

- Chosen policy: completed transactions are immutable.
- No silent balance mutation occurs after completion because post-completion edits are blocked.
- Manual corrections are explicit via privileged ledger adjustment endpoint, preserving the audit trail.
