# Agents Module

Purpose:
- Own agent records and provide CRUD APIs for agent management.
- Provide lightweight access endpoints:
  - `POST /agents/register`
  - `POST /agents/login`
- Provide session-auth protected self-service endpoints:
  - `POST /agents/logout`
  - `/agents/me/*`

Guideline:
- Controllers delegate to service methods only.
- Business rules stay in services/domain layer as the project grows.
