# Iceberg

Production-minded real estate transaction lifecycle and commission dashboard.

## Tech Stack

- Backend: Node.js LTS, TypeScript, NestJS, MongoDB Atlas, Mongoose
- Frontend: Nuxt 3, Pinia
- Styling: Tailwind CSS

## What Is Implemented

- Strict transaction lifecycle: `agreement -> earnest_money -> title_deed -> completed`
- Stage transitions controlled by centralized policy service
- Append-only stage history with server-authenticated `changedBy`
- Commission breakdown persisted on each transaction
- Agent wallet/balance system with append-only ledger
- Organization-based multi-tenancy for agents, transactions, and balance ledger rows
- Completed earnings summary endpoint
- Session-token auth (bearer token), profile/session/2FA/password flows with tenant-aware session context
- Role-based authorization for protected team and finance actions
- Transaction mutation authorization and immutability protections:
  - Only creator, listing agent, or selling agent can mutate
  - Completed transactions are immutable for edit/stage updates
  - Completed delete is restricted to manager/admin and always soft-delete
  - Workflow-critical edits are blocked after `agreement`
- Server-side transaction list querying with pagination/filter/sort/search
- Soft-delete audit trail for transactions (`updatedBy`, `deletedBy`, `deletedAt`, `isDeleted`)
- Nuxt dashboard wired to backend pagination/filter/sort/search
- Balance dashboard card + dedicated `/balance` page with ledger filters/pagination

## Quick Start

1. Install dependencies

```bash
npm --prefix backend install
npm --prefix frontend install
```

2. Configure env files

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Start backend

```bash
npm run dev:backend
```

4. Start frontend

```bash
npm run dev:frontend
```

5. Open

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/api/health`

## Environment Variables

### Backend (`backend/.env`)

Required core:

- `NODE_ENV` (`development` / `test` / `production`)
- `PORT` (default `3001`)
- `API_PREFIX` (default `api`)
- `CORS_ORIGIN` (comma-separated origins)
- `CORS_CREDENTIALS` (`true`/`false`)
- `MONGODB_URI`
- `MONGODB_DB`

Optional email provider (password reset):

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME`

### Frontend (`frontend/.env`)

- `NUXT_PUBLIC_API_BASE_URL` (must include `/api` prefix)
- `NUXT_PUBLIC_APP_ENV`

## Authentication and Protected Routes

Public agent routes:

- `POST /agents/register`
- `POST /agents/login`
- `POST /agents/password/forgot`
- `POST /agents/password/reset`

Protected routes (require `Authorization: Bearer <sessionToken>`):

- `POST /agents/logout`
- `/agents/me/*` profile, password, 2FA, sessions routes
- `POST /agents`, `GET /agents`, `GET /agents/:id`, `PATCH /agents/:id`, `DELETE /agents/:id`
- all `/transactions/*` routes
- all `/balance/*` routes and `GET /agents/:id/balance`

Session context exposes `agentId`, `role`, `organizationId`, `sessionId`, and `sessionToken`.

## Multi-Tenancy

Every signed-in agent belongs to one organization. Tenant-owned records carry `organizationId`:

- `Agent`
- `Transaction`
- `BalanceLedger`

Transaction list/detail/mutation queries always include the current session organization. Balance summaries and ledger queries also require the session organization. Agent listing returns only the current organization unless the actor is `super_admin`.

Registration supports two paths:

- Create a new organization by sending `organizationName` (first user becomes `office_owner`).
- Join an existing organization by sending `organizationSlug` or `organizationId` (new user becomes `agent`).

For legacy accounts without `organizationId`, the next successful session resolution creates a default organization for that agent so existing users can still sign in.

## Roles

Supported roles:

- `super_admin`
- `office_owner`
- `manager`
- `agent`
- `finance`
- `assistant`
- `admin` (legacy compatibility alias for tenant admin behavior)

Authorization summary:

- `super_admin`: global team listing, can assign any role.
- `office_owner` / legacy `admin`: tenant admin; can create/update/deactivate users in their organization and assign non-super-admin roles.
- `manager`: can list team members and create lower-privilege team members.
- `finance`: can access privileged balance actions.
- `agent` / `assistant`: self-service profile/session access plus transaction actions allowed by transaction participation rules.

## API Overview

Base URL: `http://localhost:3001/api`

### Health

- `GET /health`

### Transactions

- `POST /transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `PATCH /transactions/:id/stage`
- `DELETE /transactions/:id`
- `GET /transactions/summary`

#### GET /transactions query params

- `page` (default `1`)
- `limit` (default `20`, max `100`)
- `search` (property title + listing/selling agent name/email)
- `stage` (`agreement|earnest_money|title_deed|completed`)
- `transactionType` (`sold|rented`)
- `sortBy` (`createdAt|updatedAt|totalServiceFee|propertyTitle`)
- `sortOrder` (`asc|desc`)
- `includeDeleted` (`true|false`, default `false`)

#### GET /transactions response

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0
}
```

### Balance

- `GET /balance/me`
- `GET /balance/me/ledger`
- `GET /agents/:id/balance` (`super_admin`, `office_owner`, `admin`, `manager`, `finance`)
- `POST /balance/manual-adjustment` (`super_admin`, `office_owner`, `admin`, `manager`, `finance`)

#### GET /balance/me response

```json
{
  "userId": "661b8c0134e2c40fd2f89a11",
  "balance": 25000,
  "balanceCents": 2500000,
  "totalEarned": 25000,
  "totalEarnedCents": 2500000,
  "recentLedgerEntries": []
}
```

#### GET /balance/me/ledger response

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0
}
```

### Agents

- `POST /agents` (`super_admin`, `office_owner`, `admin`, `manager`)
- `GET /agents` (`super_admin`, `office_owner`, `admin`, `manager`)
- `GET /agents/:id` (`super_admin`, `office_owner`, `admin`, `manager`)
- `PATCH /agents/:id` (`super_admin`, `office_owner`, `admin`)
- `DELETE /agents/:id` (`super_admin`, `office_owner`, `admin`; deactivates user and clears sessions)
- `GET /agents/me/profile`
- `PATCH /agents/me/profile`
- `PATCH /agents/me/password`
- `POST /agents/me/2fa/setup`
- `POST /agents/me/2fa/verify`
- `POST /agents/me/2fa/disable`
- `GET /agents/me/sessions`
- `DELETE /agents/me/sessions/:sessionId`
- `DELETE /agents/me/sessions`

## Business Rules

- All tenant-owned reads and writes are scoped to the current session `organizationId`.
- Users cannot read or mutate another organization's transactions, balance ledger, or team members.
- New transactions must start at `agreement`.
- Stage updates are forward-only, no skip/back/no-op.
- `changedBy` is derived from authenticated bearer session.
- Mutations (`PATCH`, stage update, `DELETE`) are allowed only for:
  - transaction creator,
  - listing agent,
  - selling agent.
- Completed transactions cannot be edited or stage-updated.
- Completed transactions can only be soft-deleted by `super_admin`, `office_owner`, legacy `admin`, or `manager`.
- `DELETE /transactions/:id` performs soft delete (record stays queryable with `includeDeleted=true`).
- Every edit/delete writes server-derived actor audit fields (`updatedBy`, `deletedBy`).
- When a transaction reaches `completed`, commission credits are applied to agent balances.
- Duplicate credit is prevented with server-side claim flag (`balanceDistributionApplied`) and idempotent guard.
- Balance movements are append-only (`balance_ledger`) and store `previousBalance` + `newBalance` in cents.
- After `agreement`, workflow-critical fields are locked (`listingAgentId`, `sellingAgentId`, `transactionType`, `totalServiceFee`).
- Commission policy:
  - 50% agency
  - 50% agent pool
  - same listing/selling agent: single-agent pool
  - different agents: equal split (cent-safe deterministic rounding)

## Migration Notes

Existing databases need a one-time tenant backfill before production rollout:

1. Create at least one organization document with `name`, unique `slug`, `ownerId`, and `isActive: true`.
2. Backfill `organizationId` on every existing `agents`, `transactions`, and `balance_ledger` document.
3. Map legacy role `admin` to `office_owner` when you are ready to remove the compatibility alias.
4. Verify every transaction participant (`listingAgentId`, `sellingAgentId`, `createdBy`) belongs to the same organization as the transaction.
5. Create or rebuild the new tenant indexes after the backfill.

Until data is backfilled, legacy users without an organization can still sign in; the app creates a default organization for that user. Existing transactions and ledger rows still need explicit `organizationId` migration to appear in tenant-scoped queries.

## Tests and Checks

Backend unit tests:

```bash
npm run test:backend
```

Includes:

- commission policy
- stage policy
- transaction mutation policy
- transaction orchestration
- balance service (crediting, duplicate prevention, ledger correctness, tenant scoping, role checks)

Backend e2e tests:

```bash
npm run test:e2e:backend
```

E2E suite covers auth + transaction + balance critical paths:

- register/login
- authenticated transaction creation
- organization-scoped team and transaction isolation
- protected agent endpoints and role permissions
- stage updates
- summary retrieval
- invalid transitions/payloads
- balance crediting (split and same-agent cases)
- duplicate completion no double-credit
- balance access authorization rules

If your environment blocks local port binding, `mongodb-memory-server` cannot start and e2e will fail with `listen EPERM`. Run e2e in normal local/CI runtime.

Frontend typecheck:

```bash
npm --prefix frontend run typecheck
```

Full build:

```bash
npm run build
```

## Deployment

### Frontend (Vercel)

- Config file: `frontend/vercel.json`
- Build command: `npm run build:vercel`
- Set project root to `frontend/` in Vercel
- Required env: `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_APP_ENV`

### Backend (Render)

- Config file: `render.yaml`
- Dockerfile: `backend/Dockerfile`
- Health check: `/api/health`
- Required env: `MONGODB_URI`, `CORS_ORIGIN` (+ optional Resend vars)

### Backend (Railway)

- Config file: `railway.json`
- Dockerfile-based deploy via `backend/Dockerfile`
- Required env: `MONGODB_URI`, `CORS_ORIGIN` (+ optional Resend vars)

For architecture and trade-offs, see [DESIGN.md](./DESIGN.md).
