# Project Documentation Index

Design and product documentation for the Investment Portfolio Management Platform.

## Priority Documents (start here)

| Document | Description |
|----------|-------------|
| [ERD](database/ERD.md) | Complete entity-relationship design |
| [User Stories](product/USER_STORIES.md) | Personas, stories, and acceptance criteria |
| [News + AI Pipeline](architecture/NEWS_AI_PIPELINE.md) | RSS fetch → summarize → tag → store flow |

## Product

| Document | Description |
|----------|-------------|
| [MVP Roadmap](product/MVP_ROADMAP.md) | Sprint plan from auth to AI portfolio analysis |
| [Asset Master](database/ASSET_MASTER.md) | Canonical asset catalog (BTC, AAPL, Gold, …) |

## Architecture

| Document | Description |
|----------|-------------|
| [RBAC](architecture/RBAC.md) | Roles and permission matrix |
| [Notification Service](architecture/NOTIFICATION_SERVICE.md) | Alert types, rules, and delivery |
| [API Scope](api/API_SCOPE.md) | REST endpoint map by domain |

## Quality & AI

| Document | Description |
|----------|-------------|
| [Test Strategy](testing/TEST_STRATEGY.md) | Unit, integration, API, security, performance |
| [AI KPIs](ai/AI_KPI.md) | Measurable quality targets for AI outputs |

## Implementation References

- Flyway migrations: `backend/src/main/resources/db/migration/`
- OpenAPI contract: `backend/src/main/resources/openapi/investment-api.yaml`
- Project rules: `AGENTS.md`
