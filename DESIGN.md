# Design

## 1. Goal

This project models operational real estate workflows with two core guarantees:

- lifecycle transitions are policy-controlled
- commission distribution is deterministic and explicit

The system is split into backend policy/services and frontend dashboard/state layers.

## 2. Architecture

- `backend/`: NestJS + Mongoose, source of truth for domain rules
- `frontend/`: Nuxt 3 + Pinia, dashboard and workflow UI

Design principles:
- thin controllers
- explicit DTO validation
- business rules centralized in focused services
- frontend API normalization isolated from components

## 3. Backend Modules

- `agents`: account/profile/session/2FA/password-reset flows
- `transactions`: transaction CRUD, orchestration, summary
- `commissions`: commission calculation policy
- `stage-policy`: lifecycle stage transition policy
- `health`: liveness endpoint

### Why this split

`transactions` depends on both stage policy and commission policy, but does not own those rules. This keeps behavior testable and reduces controller complexity.

## 4. Data Model Decisions

### 4.1 Agent

Agent includes identity, security, and session fields:
- identity: `name`, `email`, `isActive`, `firstName`, `lastName`, `phone`, `iban`
- security: `passwordHash`, `twoFactorEnabled`, `twoFactorMethod`, `twoFactorSecret`, `twoFactorVerifiedAt`
- session tracking: `sessions[]`
- password reset tracking: `passwordResetCodeHash`, `passwordResetExpiresAt`, `passwordResetRequestedAt`

Rationale:
- keep authentication/session state close to user identity
- enable revocable sessions and auditable security actions

### 4.2 Transaction

Transaction stores:
- `propertyTitle`, `totalServiceFee`
- `listingAgentId`, `sellingAgentId`
- `transactionType` (`sold` or `rented`)
- `createdBy` (agent who created record)
- `stage`
- `stageHistory[]`
- embedded `financialBreakdown`

Indexes:
- `{ stage: 1, createdAt: -1 }`
- `{ listingAgentId: 1, sellingAgentId: 1 }`
- `{ transactionType: 1, createdAt: -1 }`

Rationale:
- dashboard reads are stage- and type-driven
- creator tracking supports accountability
- stage and financial snapshots keep document self-contained

## 5. Transaction Stages

Stages:
- `agreement`
- `earnest_money`
- `title_deed`
- `completed`

Rules are enforced in `StageTransitionPolicyService`:
- create must start at `agreement`
- transitions are forward-only
- no skip, no backward, no same-stage, no transition from `completed`

`stageHistory` is appended automatically at creation and each valid stage change.

## 6. Financial Distribution

Financial breakdown is stored as an embedded snapshot in each transaction:
- `agencyAmount`
- `agentPoolAmount`
- `agents[]`: `agentId`, `role`, `amount`, `explanation`

Choice: **embedded storage**.

Reason:
- UI can read exact historical distribution without recomputation
- breakdown explanations remain tied to the transaction state that produced them

## 7. Commission Policy

Implemented in `CommissionCalculatorService`:
- 50% of service fee to company
- 50% to agent pool
- if listing and selling agent are same person: that person receives 100% of agent pool
- if different: agent pool split equally

Calculation uses deterministic cent-based arithmetic to avoid floating drift.

## 8. Authentication and Security Flows

- register/login with password hashing
- bearer session tokens with per-device session entries
- logout removes current session
- profile update endpoint for personal/contact fields
- password change requires current password
- 2FA (authenticator): setup -> verify -> enable/disable
- session management: list active sessions, revoke specific/other sessions
- forgot password:
  - request code via email provider
  - reset password with code + confirmation
  - in development, fallback code can be returned when provider is unavailable

## 9. API and Frontend Contract

Frontend services normalize API responses before writing to Pinia store.
Invalid critical fields fail fast to avoid corrupt local state.

Transaction creation sends bearer token; backend resolves creator from session and writes `createdBy`.

## 10. Testing Strategy

Implemented backend unit tests cover:
- commission policy scenarios
- stage transition policy rules
- transaction service orchestration (validation, calculations, summary, stage updates)

Current gap:
- no end-to-end API tests yet
- frontend automated tests are not implemented yet

## 11. Trade-offs and Next Steps

Current trade-offs:
- embedded financial/stage snapshots favor read clarity over full normalization
- custom session/auth flow is lightweight but not JWT/OAuth-based

Practical next steps:
1. Add backend e2e test suite (auth + transactions + summary).
2. Add pagination/filtering/sorting for transaction list endpoints.
3. Add role-based authorization for critical mutation routes.
4. Add frontend test coverage for auth and create-transaction workflows.
