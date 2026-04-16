# Agents Module

Purpose:
- Own agent records and provide CRUD APIs for agent management.
- Provide lightweight access endpoints:
  - `POST /agents/register`
  - `POST /agents/login`

Guideline:
- Controllers delegate to service methods only.
- Business rules stay in services/domain layer as the project grows.
