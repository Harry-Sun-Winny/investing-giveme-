# Investor Readiness Checklist

## Current Coverage

| Area | Status | Notes |
| --- | --- | --- |
| Global stocks | Partial | Market page supports stock symbols through Yahoo Finance endpoints. |
| ETFs | Partial | Market page includes common ETFs. |
| Mutual funds | Partial | Added common fund symbols on Market page. |
| Bonds | Partial | Added bond ETF/Treasury proxy symbols on Market page. |
| Crypto | Partial | Market page supports Yahoo crypto pairs such as BTC-USD and ETH-USD. |
| Commodities | Partial | Gold, silver, oil, natural gas and other futures proxies are shown. |
| Indices | Partial | S&P 500, Nasdaq, Dow Jones and global indices are shown. |
| Near-real-time refresh | Partial | Frontend refreshes market data every 30 seconds; provider cache is 30-60 seconds. |
| Multiple market-data sources | Partial | Stock-price route now compares Yahoo chart and Yahoo summary endpoints. Production still needs independent vendors such as Finnhub, Polygon, Alpha Vantage or paid exchange feeds. |
| Data validation | Partial | Added checks for invalid price, source deviation and extreme price moves. |
| Portfolio transactions | Present | Backend has portfolio and transaction controllers/services. |
| Buy/sell tracking | Present | Transaction domain supports transaction type and portfolio screens show buy/sell history. |
| Fees/dividends/FX | Partial | Fees/currency fields exist in parts of the model, but dividend workflows and full FX P/L are not complete. |
| Financial news | Partial | Backend has news ingestion and frontend has stock news/summarization APIs. |
| AI summaries/analysis | Partial | AI chat and summarization exist; disclaimer is now appended. |
| Password hashing | Present | Backend uses BCrypt with strength 12. |
| JWT auth | Partial | Backend issues JWT access tokens. Refresh token and logout-all-devices are not implemented. |
| 2FA | Missing | Email OTP and TOTP authenticator are not implemented. |
| Audit logs | Partial | Audit log domain/repository/service exist. Coverage of every user action should be expanded. |
| HTTPS/TLS 1.3 | Production config | Must be enforced at reverse proxy/load balancer/CDN. Local dev is HTTP. |
| CSRF/XSS headers | Weak | Backend currently disables CSRF and headers. Frontend avoids raw HTML in most places. |
| Rate limiting/DDoS | Missing | Add backend rate limiting plus Cloudflare/AWS Shield in production. |
| GDPR export/delete | Missing | Needs user data export and deletion endpoints. |
| SOC 2/ISO 27001 | Process required | Cannot be completed only in code. Requires policies, controls, evidence and audits. |
| Monitoring/backup/DR | Production config | Requires infrastructure, backup jobs, alerting and restore tests. |

## Changes Added In This Pass

- Added `dataQuality` to `/api/stock-price`.
- Added chart-vs-summary price cross-check.
- Added invalid price and extreme movement checks.
- Added Market page data-quality indicator.
- Added Mutual Funds and Bonds categories.
- Added AI response disclaimer.

## Minimum Next Engineering Work

1. Add independent price providers: Finnhub, Polygon and Alpha Vantage adapters.
2. Store provider quotes and data-quality checks in the backend database.
3. Add alerting when providers diverge beyond a configured threshold.
4. Implement refresh tokens, token revocation and logout-all-devices.
5. Implement mandatory 2FA: TOTP plus email OTP recovery.
6. Add rate limiting on auth and API endpoints.
7. Re-enable security headers and add a production CSRF strategy.
8. Add GDPR export/delete endpoints.
9. Add daily backup scripts and restore-test documentation.
10. Expand audit logging to cover login, portfolio, transaction, watchlist, AI and admin actions.

## Investor-Grade Caveat

The app is a functional prototype, not yet an investor-grade financial platform. The largest gaps are independent licensed data feeds, mandatory 2FA, token/session hardening, production monitoring, disaster recovery, and compliance evidence.
