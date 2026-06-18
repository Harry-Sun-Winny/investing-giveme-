# API Scope

REST API map organized by domain. Base path: `/api/v1`.

## Summary

| Domain | Base path | Auth | Status |
|--------|-----------|------|--------|
| Auth | `/api/v1/auth` | Public (register/login) | ✅ Implemented |
| Portfolio | `/api/v1/portfolios` | JWT | ✅ Implemented |
| Transaction | `/api/v1/portfolios/{id}/transactions` | JWT | ✅ Implemented |
| Watchlist | `/api/v1/watchlists` | JWT | ✅ Implemented |
| Goal | `/api/v1/goals` | JWT | ✅ Implemented |
| News | `/api/v1/news` | JWT | ✅ Implemented |
| AI Analysis | `/api/v1/portfolios/{id}/analysis` | JWT | ✅ Implemented |
| Asset | `/api/v1/assets` | JWT | 🔜 Planned |
| AI Chat | `/api/v1/ai/conversations` | JWT (Premium+) | 🔜 Planned |
| Notification | `/api/v1/notifications` | JWT | 🔜 Planned |
| Notification Rules | `/api/v1/notification-rules` | JWT (Premium+) | 🔜 Planned |
| Audit | `/api/v1/admin/audit-logs` | JWT (Admin/Mod) | 🔜 Planned |
| Admin | `/api/v1/admin/*` | JWT (Admin) | 🔜 Planned |

---

## /api/v1/auth

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/register` | Create account | Public |
| POST | `/login` | Get JWT | Public |
| GET | `/me` | Current user profile | JWT |
| POST | `/refresh` | Refresh token | JWT |

---

## /api/v1/portfolios

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's portfolios |
| POST | `/` | Create portfolio |
| GET | `/{portfolioId}` | Get portfolio with holdings summary |
| PUT | `/{portfolioId}` | Update name / base currency |
| DELETE | `/{portfolioId}` | Delete portfolio (cascade) |
| GET | `/{portfolioId}/holdings` | List holdings with P&L |

---

## /api/v1/portfolios/{portfolioId}/transactions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List transactions (filter by asset, date) |
| POST | `/` | Add transaction → recalc holdings + audit log |
| GET | `/{transactionId}` | Get single transaction |
| PUT | `/{transactionId}` | Update → recalc + audit log |
| DELETE | `/{transactionId}` | Delete → recalc + audit log |

---

## /api/v1/watchlists

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's watchlists |
| POST | `/` | Create watchlist |
| DELETE | `/{watchlistId}` | Delete watchlist |
| POST | `/{watchlistId}/items` | Add asset |
| DELETE | `/{watchlistId}/items/{itemId}` | Remove asset |

---

## /api/v1/goals

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List user's goals |
| POST | `/` | Create goal |
| PUT | `/{goalId}` | Update goal |
| DELETE | `/{goalId}` | Delete goal |

---

## /api/v1/news

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List news (paginated, filter by asset, tag, date) |
| GET | `/{articleId}` | Single article with linked assets |

Query params: `?asset=BTC&tag=earnings&from=2026-01-01&limit=20`

---

## /api/v1/portfolios/{portfolioId}/analysis

| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Generate AI risk analysis with citations |
| GET | `/` | List past analyses for portfolio |
| GET | `/{analysisId}` | Get specific analysis |

---

## /api/v1/ai (planned)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/conversations` | List conversations | PREMIUM+ |
| POST | `/conversations` | Start conversation | PREMIUM+ |
| GET | `/conversations/{id}` | Get with messages | PREMIUM+ |
| POST | `/conversations/{id}/messages` | Send message | PREMIUM+ |

---

## /api/v1/assets (planned)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/` | Search asset catalog | USER+ |
| GET | `/{assetId}` | Asset detail | USER+ |

---

## /api/v1/notifications (planned)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List notifications |
| PATCH | `/{id}/read` | Mark read |
| POST | `/read-all` | Mark all read |

---

## /api/v1/admin (planned)

| Method | Path | Description | Role |
|--------|------|-------------|------|
| GET | `/users` | List users | ADMIN |
| PATCH | `/users/{id}/role` | Change role | ADMIN |
| POST | `/assets` | Add to catalog | ADMIN |
| GET | `/audit-logs` | Query audit trail | ADMIN, MODERATOR |
| PATCH | `/news/{id}/flag` | Flag AI summary | MODERATOR+ |

---

## Cross-Cutting Concerns

| Concern | Implementation |
|---------|----------------|
| Authentication | JWT Bearer token |
| Authorization | `@PreAuthorize` + ownership checks — see [RBAC](../architecture/RBAC.md) |
| Validation | Jakarta Bean Validation on request DTOs |
| Pagination | `?page=0&size=20` (Spring Pageable) |
| Errors | RFC 7807 Problem Details |
| Docs | OpenAPI 3 at `/swagger-ui.html` |
| Versioning | URL prefix `/api/v1` |

## OpenAPI

Canonical contract: `backend/src/main/resources/openapi/investment-api.yaml`

Extend this file as endpoints are implemented. Frontend and mobile clients generate types from this spec.
