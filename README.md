# Real Estate Transaction Management Platform

## Overview

Real Estate Transaction Management Platform is a full-stack application for managing real estate transaction lifecycles, clients, properties, commissions, tasks, notes, and reporting from one dashboard.

The project is designed as a production-minded portfolio application with a modular NestJS backend, a Nuxt 3 dashboard, explicit validation, organization-scoped data access, centralized workflow rules, and clear API boundaries.

## Problem

Real estate offices need a centralized system to track property deals, transaction stages, agents, clients, commissions, financial summaries, and operational tasks. Without a dedicated workflow system, teams often spread critical deal information across spreadsheets, chats, and disconnected tools.

This platform brings those workflows into one structured application so teams can follow each transaction from agreement through completion while keeping financial and operational data visible.

## Key Features

- Multi-tenant organization structure
- Authentication and session management
- Role-based access control
- Transaction lifecycle management
- CRM client management
- Property inventory management
- Commission calculation and financial summaries
- English and Turkish UI language support
- USD, EUR, GBP, and TRY currency display preferences
- Task management
- Transaction notes and activity tracking
- Reporting and CSV export module
- Responsive dashboard UI

## Tech Stack

Frontend:

- Nuxt 3
- Vue 3
- Pinia
- Tailwind CSS

Backend:

- NestJS
- TypeScript
- MongoDB
- Mongoose

Deployment:

- Vercel
- Render

## Architecture

The application is split into a backend API and a frontend dashboard.

The backend uses NestJS modules to separate transactions, commissions, stage policies, agents, organizations, clients, properties, tasks, notes, reports, balance ledger entries, and health checks. Controllers stay thin while business rules live in dedicated services and policies.

The frontend communicates with the backend through typed service modules and stores dashboard state in Pinia. Data is scoped by organization, protected routes use session-token authentication, and role-based authorization controls access to team, finance, reporting, and mutation workflows.

## Transaction Lifecycle

Transactions move through a centralized lifecycle:

```text
agreement -> earnest_money -> title_deed -> completed
```

Stage rules are enforced by a dedicated policy service. Transactions must start at `agreement`, may only move forward one step at a time, and become terminal once they reach `completed`.

## Roles and Permissions

The platform supports generic role-based access for real estate office workflows:

- Super Admin
- Admin
- Manager
- Finance
- Office Owner
- Agent
- Assistant

Higher-privilege roles can manage team members, reporting, and financial workflows. Agents and assistants can work with assigned operational resources according to transaction participation and organization-scoped access rules.

## Demo Credentials

These are placeholder demo users for public documentation only. Configure real demo accounts in your own environment before publishing a live demo.

```text
Admin: admin@example.com / demo-password
Agent: agent@example.com / demo-password
Finance: finance@example.com / demo-password
Assistant: assistant@example.com / demo-password
```

## Screenshots

Planned screenshot locations:

- `screenshots/dashboard.png`
- `screenshots/transactions.png`
- `screenshots/reports.png`
- `screenshots/clients.png`

## Setup Instructions

Prerequisites:

- Node.js LTS
- npm
- MongoDB Atlas connection string or a local MongoDB instance

Install dependencies:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Configure environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update `backend/.env` with your MongoDB connection string and any optional email or seed-account values.

Run the backend:

```bash
npm run dev:backend
```

Run the frontend:

```bash
npm run dev:frontend
```

Local URLs:

- Frontend: `http://localhost:3000`
- Backend health check: `http://localhost:3001/api/health`

## Environment Variables

Backend example:

```env
NODE_ENV=development
PORT=3001
API_PREFIX=api
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=false
PUBLIC_REGISTRATION_ENABLED=true
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/
MONGODB_DB=real_estate_platform
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_ORGANIZATION_NAME=Demo Realty Group
SUPER_ADMIN_ORGANIZATION_SLUG=demo-realty-group
RESEND_API_KEY=
RESEND_FROM_EMAIL=no-reply@example.com
RESEND_FROM_NAME=Real Estate Platform
```

Frontend example:

```env
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
NUXT_PUBLIC_APP_ENV=development
NUXT_PUBLIC_REGISTRATION_ENABLED=true
```

Only commit `.env.example` files. Keep real `.env` files local or configure them through your hosting provider.

## Localization And Currency

The frontend includes a lightweight localization layer with English and Turkish support. Users can change the interface language and preferred display currency from the settings page.

Currency display is centralized through the shared formatter and supports `USD`, `EUR`, `GBP`, and `TRY`. Turkish locale uses `tr-TR` number formatting, including Turkish Lira display.

## API Overview

Primary backend areas:

- `GET /health`
- `/agents` for authentication, sessions, profiles, team management, and roles
- `/transactions` for deal creation, updates, stage changes, summaries, and soft deletion
- `/clients` for CRM records
- `/properties` for property inventory
- `/tasks` for operational work management
- `/transaction-notes` for transaction activity notes
- `/reports` for analytics and CSV exports
- `/balance` for commission balances and ledger records

Protected routes require:

```text
Authorization: Bearer <sessionToken>
```

## Testing

Backend unit tests:

```bash
npm --prefix backend run test
```

Backend build:

```bash
npm --prefix backend run build
```

Frontend typecheck:

```bash
npm --prefix frontend run typecheck
```

Frontend build:

```bash
npm --prefix frontend run build
```

## What I Learned

- Designing business-rule-heavy applications
- Building role-based authorization
- Managing organization-scoped data
- Handling transaction workflows
- Building reporting/export features
- Deploying full-stack applications

## Future Improvements

- Advanced analytics
- Email notifications
- Audit logs
- Improved test coverage
- Subscription/billing support
- More advanced document management
