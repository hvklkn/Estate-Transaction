# Design

## 1. Scope and Intent

This repository implements a real estate operations case with two goals:
- track transaction lifecycle stages
- calculate and persist commission breakdowns

The design is intentionally conservative: clear module boundaries, explicit validation, and simple UI state flow.
Recent updates also prioritize production reproducibility (pinned frontend dependency versions + lockfile-based install).

## 2. System Architecture

The repo has two deployable apps:
- `backend/` (NestJS + Mongoose): domain rules, persistence, HTTP API
- `frontend/` (Nuxt 3 + Pinia): internal operations dashboard

Request flow:
1. UI calls store actions.
2. Store calls API service (`services/transactions.api.ts`).
3. API service uses shared fetch client (`composables/useApi.ts`).
4. Backend controller delegates to service.
5. Service applies policies (commission + stage), persists via Mongoose.
6. Response is normalized in frontend API layer before entering store state.

## 3. Backend Module Structure

Backend modules are organized by domain responsibility:
- `agents`: agent CRUD + agent existence checks
- `transactions`: transaction CRUD + orchestration
- `commissions`: commission calculation policy
- `stage-policy`: lifecycle transition policy
- `health`: liveness endpoint

Why this split:
- transaction workflows depend on commission and stage rules, but those rules stay in dedicated policy services
- controllers stay thin (transport only)
- business logic remains unit-testable without HTTP or database wiring
- lightweight access endpoints (`agents/register`, `agents/login`) stay in the agents module to avoid introducing a premature auth module

## 4. MongoDB Schema Decisions

### 4.1 Agent Schema

`Agent` fields:
- `name` (required)
- `email` (required, lowercase, unique)
- `isActive` (required, default `true`)
- timestamps

Reasoning:
- minimal identity model for current requirements
- unique email prevents duplicate agent records
- `isActive` supports soft operational control

Access model:
- login uses existing email (no password in current scope)
- register creates an `Agent` document and returns MongoDB-generated ObjectId
- this is intentionally minimal for case scope and can evolve into full auth later

### 4.2 Transaction Schema

`Transaction` fields:
- `propertyTitle`
- `totalServiceFee`
- `listingAgentId` (ObjectId ref `Agent`)
- `sellingAgentId` (ObjectId ref `Agent`)
- `stage` enum: `agreement`, `earnest_money`, `title_deed`, `completed`
- `stageHistory[]` entries with `fromStage`, `toStage`, `changedAt`, optional `changedBy`
- embedded `financialBreakdown`
- timestamps

Indexes:
- `{ stage: 1, createdAt: -1 }`
- `{ listingAgentId: 1, sellingAgentId: 1 }`

Reasoning:
- indexes match dashboard access patterns (stage views and agent-related queries)
- stage is persisted, not derived, because transitions are explicit operations
- history is embedded so stage progression remains queryable and traceable from a single transaction document

### 4.3 Why Financial Breakdown Is Stored on Transaction

`financialBreakdown` is embedded as a snapshot subdocument:
- `agencyAmount`
- `agentPoolAmount`
- `agents[]` with `agentId`, `role`, `amount`, `explanation`

Reasons:
- keeps read path simple for dashboard pages
- preserves the computed allocation and explanation used at write time
- avoids recomputing from mutable external context on every read

Current behavior:
- breakdown is recalculated on create and general update (`PATCH /transactions/:id`)
- stage-only update (`PATCH /transactions/:id/stage`) updates stage only
- storing the snapshot intentionally avoids historical drift if commission policy changes later

## 5. Commission Calculation Design

Commission logic is centralized in `CommissionCalculatorService.calculate`.

Input:
- `totalServiceFee`
- `listingAgentId`
- `sellingAgentId`

Output:
- `agencyAmount`
- `agentPoolAmount`
- `agents[]` allocations with role and explanation text

Implemented rules:
- agency gets 50%
- agent side gets remaining 50%
- same listing/selling agent: one allocation gets full agent side
- different agents: split agent side equally

Determinism details:
- values are converted to cents first
- half split uses integer cent math
- when odd-cent remainder exists, listing side receives the extra cent

Input safeguards:
- non-finite and negative fees are rejected
- agent ids must be non-empty strings

## 6. Stage Transition Design

Stage rules are centralized in `StageTransitionPolicyService`.

Methods:
- `resolveInitialStageForCreate(stage?)`: enforces that new transactions start at `agreement`
- `assertValidTransition(current, target)`: validates stage change rules
- `getNextAllowedStage(current)`: helper for policy/test use

Enforced lifecycle:
- allowed forward order: `agreement -> earnest_money -> title_deed -> completed`
- rejected: skipping, backward moves, same-stage no-op, transitions out of `completed`

Integration:
- dedicated DTO and endpoint for stage change: `PATCH /transactions/:id/stage`
- generic update DTO intentionally excludes stage to avoid bypassing lifecycle policy
- service appends a history row on create (`null -> agreement`) and on every valid stage transition
- optional `x-agent-id` header can be passed to stage updates to capture `changedBy` without adding full auth complexity

## 7. Summary Reporting

Scope:
- a lightweight reporting endpoint was added instead of a separate analytics module
- endpoint: `GET /transactions/summary`

Behavior:
- aggregates only `completed` transactions
- returns:
  - `totalAgencyEarnings`
  - `totalAgentEarnings`
  - `byAgent[]` (`agentId`, `earnings`)

Reasoning:
- gives an interview-friendly reporting capability with minimal extra surface area
- keeps controller thin; aggregation logic remains in `TransactionsService`

## 8. Validation and Error Handling

### 7.1 Backend Validation

Validation is layered:
- DTO decorators (`class-validator`) for structural constraints
- DTO transforms (`class-transformer`) for trimming/normalization
- global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `transform`
- service-level checks for domain constraints (ObjectId validity, entity existence, policy checks)

### 7.2 Backend Error Shape

Global exception filter returns a consistent envelope:
- `statusCode`
- `timestamp`
- `path`
- `error`

This keeps frontend error extraction predictable across validation, not-found, and business-rule failures.

### 7.3 Frontend Error Handling

Frontend store does not parse backend error payload inline anymore.
- shared parser: `services/api.errors.ts`
- store maps unknown errors into user-facing messages via one utility

This avoids duplicated parsing logic and keeps store actions readable.

## 9. Frontend Architecture (Nuxt 3 + Pinia)

Structure:
- `pages/transactions.vue`: page composition and interaction wiring
- `pages/auth.vue`: register/login screen
- `stores/transactions.ts`: canonical transaction state, derived metrics, async actions
- `stores/auth.ts`: current user + registered user list + access actions
- `services/transactions.api.ts`: endpoint calls + strict response normalization
- `services/agents.api.ts`: agent register/login/list API layer
- `composables/useApi.ts`: shared fetch client (`baseURL`, JSON headers, timeout)
- `components/transactions/*`: focused presentational units

Data flow decisions:
- network and shape normalization stay out of components
- store is explicit about loading flags (`isLoading`, `isCreating`, per-row stage update)
- store has `hasLoaded` + `fetchTransactions({ force })` and `refreshTransactions()` to avoid unnecessary repeated fetches
- auth state is client-hydrated from localStorage, then refreshed from API via plugin startup
- route middleware redirects unauthenticated users to `/auth`
- transaction creation UI uses advisor names/emails from `authStore.activeUsers`, while payload keeps ObjectId references
- transaction cards expose a detail panel for stage history + financial snapshot visibility without introducing route-level complexity

Contract safety:
- transaction API normalization now fails fast on invalid/missing critical fields
- this avoids silently injecting corrupted entities into store state

## 10. Testing Strategy

Backend tests are unit-focused and target business rules, not framework wiring.

Covered suites:
- `commission-calculator.service.spec.ts`
  - same-agent and different-agent allocation rules
  - 50% agency share behavior
  - odd-cent deterministic split behavior
  - invalid input guards
- `stage-transition-policy.service.spec.ts`
  - allowed forward transitions
  - rejected skip/backward/no-op/final-stage transitions
  - create-stage restrictions
  - unknown stage guards
- `transactions.service.spec.ts`
  - create/update orchestration with commission + agent checks
  - stage update orchestration through policy
  - stage history append behavior on create and stage transition
  - completed earnings summary aggregation behavior
  - invalid ObjectId and not-found behavior

Current boundary:
- no backend e2e tests yet (controller/database integration still future work)

## 11. Trade-offs and Future Improvements

Current trade-offs:
- stored `financialBreakdown` favors read simplicity and auditability over full normalization
- embedded `stageHistory` favors single-document traceability over a separate audit collection
- number/cents arithmetic is deterministic for current scope, but money libraries/decimal types may be preferable for stricter accounting requirements
- current access model is intentionally lightweight (email-only register/login, no password/session token)
- summary reporting is intentionally narrow (completed-only aggregates) to keep this case focused
- frontend contract validation is strict; schema drift now fails loudly (intentional), but requires coordinated API changes

Next improvements with highest value:
1. Add backend integration/e2e tests with a test database.
2. Add pagination/filtering/sorting endpoints for transaction list scale.
3. Add full authentication/authorization and audit logging for stage and fee-related updates.
4. Add searchable advisor picker (server-side query for large user sets).
5. Add shared API contract generation (OpenAPI) to reduce frontend/backend drift risk.
