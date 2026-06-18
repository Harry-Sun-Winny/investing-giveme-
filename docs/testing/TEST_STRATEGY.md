# Test Strategy

Testing pyramid and quality gates for backend, frontend, and mobile.

## Test Pyramid

```
        ┌─────────────┐
        │  E2E / UI   │  ← few, critical paths
        ├─────────────┤
        │  API / Int. │  ← controller + DB
        ├─────────────┤
        │    Unit     │  ← domain logic, services
        └─────────────┘
```

## Test Types

### 1. Unit Tests

**Scope:** Domain logic, application services, utilities — no Spring context, no DB.

| Layer | Examples | Tool |
|-------|----------|------|
| Domain | P&L calculation, holding recalc after transaction | JUnit 5 |
| Application | Use case orchestration with mocked ports | JUnit 5 + Mockito |
| Frontend | Component rendering, hooks, utils | Vitest + Testing Library |

**Coverage target:** ≥ 80% line coverage on `application` and `domain` packages.

**Run:**
```powershell
cd backend && mvn test -Dtest="*Test"
cd frontend && npm test
```

### 2. Integration Tests

**Scope:** Repository + DB, service + real PostgreSQL (Testcontainers).

| Scenario | Validates |
|----------|-----------|
| Create transaction → holding updated | JPA + Flyway schema |
| Duplicate news URL rejected | Unique constraint |
| Audit log written on transaction delete | Cross-table consistency |

**Tool:** Spring Boot Test + Testcontainers PostgreSQL

**Run:**
```powershell
cd backend && mvn test -Dtest="*IntegrationTest"
```

### 3. API Tests

**Scope:** Full HTTP request/response through MockMvc or REST Assured.

| Scenario | Expected |
|----------|----------|
| POST /auth/register → 200 + JWT | Auth flow |
| POST /portfolios/{id}/transactions without token → 401 | Security |
| POST transaction with invalid quantity → 400 | Validation |
| GET /news → each item has source, date, summary, url | Contract |

**Tool:** MockMvc (backend), optional Postman/Newman collection for CI.

### 4. Security Tests

| Test | Description |
|------|-------------|
| Unauthorized access | All protected endpoints return 401 without JWT |
| Cross-user access | User A cannot read User B's portfolio (403) |
| Role enforcement | USER cannot access `/api/v1/admin/*` (403) |
| JWT expiry | Expired token rejected |
| Input injection | SQL injection, XSS in text fields sanitized/rejected |

**Tool:** Spring Security Test, OWASP ZAP (manual/staging).

### 5. Performance Tests

| Scenario | Target |
|----------|--------|
| GET /portfolios (10 holdings) | p95 < 200ms |
| GET /news?page=0&size=20 | p95 < 300ms |
| POST /portfolios/{id}/analysis | p95 < 15s (AI-bound) |
| News ingestion batch (50 articles) | < 5 min end-to-end |

**Tool:** k6 or Gatling (staging environment).

Run before major releases, not on every PR.

## CI Pipeline

```yaml
# Per PR
- backend: mvn verify (unit + integration)
- frontend: npm test + npm run build
- mobile: flutter test
- lint: checkstyle, eslint

# Nightly
- API contract tests (Newman)
- Performance smoke (k6, 5 VUs)

# Pre-release
- Security scan (dependency-check)
- Full performance suite
```

## Test Data Rules

| Rule | Reason |
|------|--------|
| No fake financial data in production | Compliance |
| Test fixtures use deterministic UUIDs | Reproducible tests |
| `@Sql` scripts for integration test seed data | Isolated state |
| `@Transactional` rollback on integration tests | Clean DB |

## Frontend Testing

| Type | Tool | Scope |
|------|------|-------|
| Unit | Vitest | Utils, hooks |
| Component | Testing Library | Forms, dashboard widgets |
| E2E (future) | Playwright | Login → add transaction → view P&L |

## Mobile Testing

| Type | Tool |
|------|------|
| Unit | flutter_test |
| Widget | flutter_test |
| Integration (future) | integration_test |

## Definition of Done (per feature)

- [ ] Unit tests for new domain/application logic
- [ ] Integration test if DB interaction added
- [ ] API test for new endpoint
- [ ] OpenAPI spec updated
- [ ] No decrease in coverage threshold

## Related Documents

- [AI KPIs](../ai/AI_KPI.md) — AI output quality tests
- [User Stories](../product/USER_STORIES.md) — acceptance criteria source
