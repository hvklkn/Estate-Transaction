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
- operational dashboard for list/create/transition workflows

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

- Node.js LTS (recommended: `v22.x`)
- npm (recommended: `v10+`)
- MongoDB Atlas connection string

## Quick Start (Reviewer Path)

1. Install dependencies:
```bash
npm --prefix backend install
npm --prefix frontend install
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

Current status:
- backend unit tests are implemented
- frontend automated tests are not implemented yet

## API Overview

Base URL:
- `http://localhost:3001/api`

Health:
- `GET /health`

Agents:
- `POST /agents`
- `GET /agents`
- `GET /agents/:id`
- `PATCH /agents/:id`
- `DELETE /agents/:id`

Transactions:
- `POST /transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id` (non-stage fields)
- `PATCH /transactions/:id/stage`
- `DELETE /transactions/:id`

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

## Important Assumptions

- Dashboard create form currently accepts raw MongoDB ObjectIds for listing/selling agents.
- Agents should be created first through API or tooling before creating transactions from the UI.
- Agent lookup/autocomplete is a planned improvement and is not implemented in this submission.
- No authentication/authorization is implemented in this case submission.
- This repository is not configured as an npm workspace; `backend` and `frontend` are managed as separate packages.
