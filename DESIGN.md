# Design

## 1. Summary

Iceberg models the real estate transaction lifecycle with strict workflow safety, commission determinism, and auditable mutation trails.

Primary design goals:

- keep business policy out of controllers/UI
- centralize lifecycle + mutation rules in dedicated services
- enforce explicit auth and authorization on protected workflows
- provide queryable, dashboard-friendly APIs

## 2. Architecture

- `backend/`: NestJS + Mongoose domain boundary
- `frontend/`: Nuxt 3 + Pinia dashboard boundary

Core principles:

- thin controllers, policy-heavy services
- DTO-driven explicit validation
- traceability fields are write-protected from client spoofing
- frontend service layer normalizes API contracts before state writes

## 3. Auth and Authorization

### Authentication model

- Session tokens are generated at login and stored hashed in `Agent.sessions[]`.
- Protected routes use bearer auth: `Authorization: Bearer <sessionToken>`.
- `SessionAuthGuard` resolves authenticated session context and attaches it to request.
- `CurrentSession` decorator exposes `agentId` / `sessionToken` to controllers.

### Protected surface

- All transaction routes (`/transactions/*`)
- Self-service profile/session routes (`/agents/me/*`)
- `POST /agents/logout`

### Authorization model for transaction mutations

Mutations are allowed only if authenticated actor is one of:

- `createdBy`
- `listingAgentId`
- `sellingAgentId`

Enforcement is centralized in `TransactionMutationPolicyService`.

## 4. Transaction Immutability and Workflow Safety

### Stage policy (`StageTransitionPolicyService`)

- Create must start at `agreement`
- Only immediate forward transitions are allowed
- No backward, no skip, no same-stage transitions
- `completed` is terminal

### Mutation policy (`TransactionMutationPolicyService`)

- Completed transactions are immutable:
  - no `PATCH /transactions/:id`
  - no `PATCH /transactions/:id/stage`
  - `DELETE /transactions/:id` is blocked for normal agents
- `manager`/`admin` can soft-delete completed transactions for audit/legal exceptions.
- After leaving `agreement`, workflow-critical fields are locked:
  - `listingAgentId`
  - `sellingAgentId`
  - `transactionType`
  - `totalServiceFee`
- Soft-deleted transactions are immutable for all mutation routes.

This prevents participant/fee/type changes that break lifecycle semantics mid-flow.

## 5. Audit and Traceability Decisions

- `createdBy` is always derived from authenticated session actor at creation.
- `updatedBy` is always derived from authenticated session actor on edit/stage/delete mutations.
- Stage history is append-only and system-generated on create + each valid transition.
- `stageHistory.changedBy` is always server-derived from bearer session actor.
- Soft-delete trail is explicit on transaction:
  - `isDeleted`
  - `deletedAt`
  - `deletedBy`
- Header-based actor spoofing (`x-agent-id`) is intentionally removed.

These decisions ensure actor fields are trustworthy for interview-level audit discussion.

## 6. Query and List Strategy

`GET /transactions` supports dashboard-grade server querying:

- pagination: `page`, `limit`
- filters: `stage`, `transactionType`
- soft-delete visibility: `includeDeleted`
- search: property title + listing/selling agent name/email
- sorting: `createdAt|updatedAt|totalServiceFee|propertyTitle` + `asc|desc`

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
- soft-delete-aware read patterns (`isDeleted` + stage/date)

## 7. Frontend Dashboard Contract

- Pinia store is server-driven for transactions list (not client-only filtering).
- Query state (search/filter/sort/page) maps directly to backend API params.
- UI states are explicit: loading, refresh, error, empty-with-filters, empty-initial.
- Lifecycle UX emphasizes next allowed action and terminal completed visuals.
- Detail panel prioritizes stage timeline and readable commission role breakdown.

## 8. Testing Strategy

### Unit tests

Covered:

- commission distribution policy
- stage transition policy
- transaction mutation policy
- transaction service orchestration

### E2E tests

Added suite covering:

- register/login flow
- authenticated create transaction
- stage update and summary
- invalid transition and payload handling
- unauthorized and forbidden scenarios

Note: in restricted sandbox environments where local port binding is disabled, `mongodb-memory-server` cannot start. The suite is intended for normal local/CI runtime.

## 9. Deployment Readiness

Frontend (Vercel):

- `frontend/vercel.json`
- Nuxt Vercel build path via `build:vercel`

Backend (Render/Railway):

- Dockerized backend with `backend/Dockerfile`
- Render blueprint: `render.yaml`
- Railway config: `railway.json`

Production checklist:

- set real `MONGODB_URI`
- set deployed `CORS_ORIGIN`
- set `NUXT_PUBLIC_API_BASE_URL`
- configure Resend variables if password reset email delivery is required

## 10. Balance and Ledger Design

### Data model

- `Agent.balanceCents`: current wallet balance in integer cents.
- `balance_ledger` collection: append-only movement records for every credit/adjustment/reversal.

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

### Why ledger + balance (instead of only balance)

- Balance alone gives current state but not audit explainability.
- Ledger gives immutable movement timeline, actor trace, and transaction linkage.
- `previousBalance`/`newBalance` snapshots make each row independently verifiable.

### Commission credit integration

- On transition to `completed`, transaction service calls balance service with commission allocations.
- Balance service claims distribution once using transaction-level flag:
  - `balanceDistributionApplied`
  - `balanceDistributionAppliedAt`
  - `balanceDistributionAppliedBy`
  - `balanceDistributionLedgerIds`
- Claim check prevents duplicate wallet credit under retried/concurrent completion requests.

### Duplicate credit prevention

- Credit flow starts with atomic `findOneAndUpdate` claim on:
  - transaction id
  - `stage = completed`
  - `balanceDistributionApplied = false`
- If claim fails, flow is treated as already applied and exits without new credits.

### Immutability and reversal safety decision

- Chosen policy: completed transactions are immutable.
- No silent balance mutation on post-completion edits because post-completion edits are blocked.
- Manual corrections are explicit via privileged ledger adjustment endpoint, preserving audit trail.
