# Iceberg

Real estate transaction operations case project.

It includes:
- a NestJS API for agents, transactions, commission calculation, and lifecycle transitions
- a Nuxt 3 dashboard for transaction operations

## Project Overview

Core behaviors implemented:
- transaction lifecycle stages: `agreement -> earnest_money -> title_deed -> completed`
- centralized commission calculation policy and persisted financial breakdown
- centralized stage transition policy with strict forward-only progression
- transaction stage history tracking (`fromStage`, `toStage`, `changedAt`, optional `changedBy`)
- completed transaction earnings summary reporting endpoint
- lightweight user access flow (register/login by email) backed by MongoDB
- advisor assignment via registered user selection (name/email in UI, ObjectId mapping in payload)
- operational dashboard for list/create/transition workflows with expandable transaction details

## Architecture Summary

Repository layout:
- `backend/`: NestJS + Mongoose API
- `frontend/`: Nuxt 3 + Pinia dashboard

Design approach:
- controllers are thin
- business rules live in dedicated services/policies (`commissions`, `stage-policy`)
- transactions service orchestrates policy execution and persistence
- frontend state is explicit in Pinia; API calls + normalization are isolated in `frontend/services`

For detailed rationale, see [DESIGN.md](./DESIGN.md).

## Tech Stack

Backend:
- Node.js LTS
- TypeScript
- NestJS
- Mongoose
- MongoDB Atlas
- Jest

Frontend:
- Nuxt 3
- Pinia
- Tailwind CSS

## Prerequisites

- Node.js LTS (recommended: `v20.19+`)
- npm (recommended: `v10+`)
- MongoDB Atlas connection string

## Quick Start (Reviewer Path)

1. Install dependencies (deterministic install preferred):
```bash
npm --prefix backend install
npm --prefix frontend ci
```

2. Create environment files:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Update at minimum:
- `backend/.env` -> `MONGODB_URI`
- `frontend/.env` -> `NUXT_PUBLIC_API_BASE_URL` (if different from local default)

4. Run backend (Terminal 1):
```bash
npm run dev:backend
```

5. Run frontend (Terminal 2):
```bash
npm run dev:frontend
```

6. Open:
- Dashboard: `http://localhost:3000` (or the port Nuxt prints)
- Health check: `http://localhost:3001/api/health`

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | `development` / `test` / `production` |
| `PORT` | Yes | `3001` | API port |
| `API_PREFIX` | Yes | `api` | Global route prefix |
| `CORS_ORIGIN` | Yes | `http://localhost:3000` | Comma-separated allowed origins or `*` |
| `CORS_CREDENTIALS` | Yes | `false` | CORS credentials toggle |
| `MONGODB_URI` | Yes | none | MongoDB Atlas URI |
| `MONGODB_DB` | Yes | `iceberg` | Database name |

### Frontend (`frontend/.env`)

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NUXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:3001/api` | Must point to backend API prefix |
| `NUXT_PUBLIC_APP_ENV` | Yes | `development` | Environment label |

## Run Instructions

From repository root:

Backend dev server:
```bash
npm run dev:backend
```

Frontend dev server:
```bash
npm run dev:frontend
```

Production builds:
```bash
npm run build
```

You can also run package-level commands directly in `backend/` and `frontend/`.

## Test Instructions

Backend unit tests:
```bash
npm run test:backend
```

Or inside `backend/`:
```bash
npm test
npm run test:watch
npm run test:cov
```

Jest note:
- path aliases (`@/...`) are resolved via `backend/jest.config.ts` with `pathsToModuleNameMapper`

Current status:
- backend unit tests are implemented
- transaction service tests include stage history append and completed-earnings summary aggregation coverage
- frontend automated tests are not implemented yet

## API Overview

Base URL:
- `http://localhost:3001/api`

Health:
- `GET /health`

Agents:
- `POST /agents/register`
- `POST /agents/login`
- `POST /agents`
- `GET /agents`
- `GET /agents/:id`
- `PATCH /agents/:id`
- `DELETE /agents/:id`

Transactions:
- `POST /transactions`
- `GET /transactions`
- `GET /transactions/summary`
- `GET /transactions/:id`
- `PATCH /transactions/:id` (non-stage fields)
- `PATCH /transactions/:id/stage` (optional `x-agent-id` header for `changedBy`)
- `DELETE /transactions/:id`

Summary endpoint behavior:
- `GET /transactions/summary` returns aggregates for completed transactions:
  - `totalAgencyEarnings`
  - `totalAgentEarnings`
  - `byAgent[]` (`agentId`, `earnings`)

Stage history behavior:
- transaction create initializes history with first entry (`fromStage: null`, `toStage: agreement`, `changedAt`)
- stage update appends a new history entry automatically
- current stage remains on `stage` for fast filtering and lifecycle checks

Lifecycle behavior:
- new transactions must start at `agreement`
- allowed transitions only:
  - `agreement -> earnest_money`
  - `earnest_money -> title_deed`
  - `title_deed -> completed`
- rejected transitions:
  - skipping stages
  - moving backward
  - same-stage no-op
  - any transition out of `completed`

## Deployment Notes

Backend:
- set `NODE_ENV=production`
- set `CORS_ORIGIN` to frontend production origin(s)
- set `MONGODB_URI` and `MONGODB_DB`
- run `npm --prefix backend run build`
- run `npm --prefix backend run start:prod`
- startup guard: backend exits if `NODE_ENV=production` and `CORS_ORIGIN` is still `http://localhost:3000`
- startup guard: backend exits if `CORS_ORIGIN=*` with `CORS_CREDENTIALS=true`

Frontend:
- set `NUXT_PUBLIC_API_BASE_URL` to deployed backend base URL (including `/api`)
- run `npm --prefix frontend run build`
- serve with Nuxt/Nitro-compatible hosting
- runtime guard: frontend throws if `NUXT_PUBLIC_API_BASE_URL` is missing or points to `localhost` in production

Suggested targets:
- backend: Render, Railway, Fly.io, ECS/Fargate
- frontend: Vercel, Netlify, Cloudflare Pages

## UI Notes

- Transaction cards include an expanded detail panel.
- The detail panel shows current stage, stage history, financial breakdown, listing/selling advisor info, and total service fee.

## Important Assumptions

- Dashboard create form uses registered advisors from a dropdown and sends mapped ObjectIds to backend.
- Current access model is lightweight session-less user identification (`register` / `login` by email), not full password-based authentication.
- Authorization/role control is not implemented yet.
- This repository is not configured as an npm workspace; `backend` and `frontend` are managed as separate packages.
