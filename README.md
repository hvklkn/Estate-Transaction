# Iceberg

Real estate transaction lifecycle and commission management project.

## Stack

- Backend: Node.js LTS, TypeScript, NestJS, MongoDB Atlas, Mongoose
- Frontend: Nuxt 3, Pinia
- Styling: Tailwind CSS

## Implemented Features

- Transaction lifecycle stages: `agreement -> earnest_money -> title_deed -> completed`
- Centralized stage transition policy and stage history tracking
- Commission policy with persisted financial breakdown
- Financial summary endpoint for completed transactions
- Agent registration/login with password hash + session token
- Profile management (name, email, first/last name, phone, IBAN)
- Password change (current password + confirmation)
- 2FA setup/verify/disable (authenticator method)
- Session management (list sessions, revoke one, revoke others)
- Forgot password flow with verification code
- Transaction creator tracking (`createdBy`)
- Transaction type on create (`sold` or `rented`)

## Quick Start

1. Install dependencies:
```bash
npm --prefix backend install
npm --prefix frontend install
```

2. Create env files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Run backend:
```bash
npm run dev:backend
```

4. Run frontend:
```bash
npm run dev:frontend
```

5. Open app:
- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:3001/api/health`

## Environment Variables

### Backend (`backend/.env`)

Required core:
- `NODE_ENV` (`development` / `test` / `production`)
- `PORT` (default `3001`)
- `API_PREFIX` (default `api`)
- `CORS_ORIGIN` (default `http://localhost:3000`)
- `CORS_CREDENTIALS` (default `false`)
- `MONGODB_URI`
- `MONGODB_DB`

Optional for email-based password reset:
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `RESEND_FROM_NAME` (default `Iceberg`)

Notes:
- In `development`, if email provider is unavailable, forgot-password endpoint can return a development code for local testing.
- In `production`, email provider must be configured.

### Frontend (`frontend/.env`)

- `NUXT_PUBLIC_API_BASE_URL` (default `http://localhost:3001/api`)
- `NUXT_PUBLIC_APP_ENV` (default `development`)

## Tests and Checks

Backend tests:
```bash
npm run test:backend
```

Frontend typecheck:
```bash
npm --prefix frontend run typecheck
```

Full build:
```bash
npm run build
```

## API Overview

Base URL: `http://localhost:3001/api`

### Health
- `GET /health`

### Agents
- `POST /agents/register`
- `POST /agents/login`
- `POST /agents/password/forgot`
- `POST /agents/password/reset`
- `POST /agents/logout`
- `GET /agents`
- `GET /agents/:id`
- `POST /agents`
- `PATCH /agents/:id`
- `DELETE /agents/:id`
- `GET /agents/me/profile`
- `PATCH /agents/me/profile`
- `PATCH /agents/me/password`
- `POST /agents/me/2fa/setup`
- `POST /agents/me/2fa/verify`
- `POST /agents/me/2fa/disable`
- `GET /agents/me/sessions`
- `DELETE /agents/me/sessions/:sessionId`
- `DELETE /agents/me/sessions`

### Transactions
- `POST /transactions`
- `GET /transactions`
- `GET /transactions/summary`
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `PATCH /transactions/:id/stage`
- `DELETE /transactions/:id`

## Business Rules

- New transactions can only start at `agreement`.
- Only forward stage transitions are allowed.
- Commission split:
  - 50% to company
  - 50% to agent pool
  - same listing/selling agent: single agent gets full agent pool
  - different agents: agent pool split equally

## Project Notes

- Business policies are isolated in dedicated services.
- Transaction documents embed financial breakdown and stage history snapshots.
- `createdBy` is captured from bearer session token during transaction creation.

For detailed architecture and trade-offs, see [DESIGN.md](./DESIGN.md).
