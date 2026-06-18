# Project Rules

## Business

This project is NOT a trading platform.

This project IS:

- Portfolio management
- Financial analysis
- News aggregation
- AI assistant

## AI Rules

AI must:

- cite sources
- explain reasoning
- indicate uncertainty

AI must NOT:

- guarantee profits
- provide financial advice
- predict future prices as facts

## Backend

- Spring Boot
- PostgreSQL
- JPA
- Flyway Migration

## Frontend

- React
- TypeScript
- Tailwind

## Mobile

- Flutter

## Code Style

- Clean code
- SOLID
- Tests per `docs/testing/TEST_STRATEGY.md` (unit, integration, API, security)

## Documentation

Project design docs live in `docs/`. Read before implementing:

| Priority | Document |
|----------|----------|
| 1 | `docs/database/ERD.md` — full schema |
| 2 | `docs/product/USER_STORIES.md` — personas and acceptance criteria |
| 3 | `docs/architecture/NEWS_AI_PIPELINE.md` — news ingestion and AI flow |

Also see: `docs/api/API_SCOPE.md`, `docs/architecture/RBAC.md`,
`docs/architecture/NOTIFICATION_SERVICE.md`, `docs/testing/TEST_STRATEGY.md`,
`docs/ai/AI_KPI.md`, `docs/product/MVP_ROADMAP.md`.

Every feature requires:

- API docs (update OpenAPI spec)
- Sequence diagram
- Database update document (if schema changes)

## Audit

All financial data mutations (transaction create/update/delete) must write to `audit_logs`.

## Roles

`ADMIN`, `MODERATOR`, `PREMIUM`, `USER` — see `docs/architecture/RBAC.md`.

