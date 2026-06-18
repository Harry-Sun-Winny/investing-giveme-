# Asset Master

Canonical catalog of tradable instruments. All transactions, holdings, watchlists, and news tags reference this table.

## Schema

```sql
-- Table: assets (see ERD.md)
-- UNIQUE (symbol, exchange)
```

| Column | Example (BTC) | Example (AAPL) | Example (Gold) |
|--------|---------------|----------------|----------------|
| symbol | BTC | AAPL | XAU |
| name | Bitcoin | Apple Inc. | Gold Spot |
| asset_type | CRYPTO | STOCK | COMMODITY |
| exchange | NULL | NASDAQ | NULL |
| currency | USD | USD | USD |
| isin | NULL | US0378331005 | NULL |

## Asset Types

| Type | Description | exchange required? |
|------|-------------|-------------------|
| `CRYPTO` | Cryptocurrencies | No |
| `STOCK` | Individual equities | Yes |
| `ETF` | Exchange-traded funds | Yes |
| `COMMODITY` | Gold, oil, etc. | No |
| `FOREX` | Currency pairs | No |
| `BOND` | Fixed income | Optional |

## Seed Data (MVP)

Migration `V3__seed_assets.sql` will insert:

### Crypto

| symbol | name | currency |
|--------|------|----------|
| BTC | Bitcoin | USD |
| ETH | Ethereum | USD |
| SOL | Solana | USD |

### US Equities

| symbol | name | exchange | currency |
|--------|------|----------|----------|
| AAPL | Apple Inc. | NASDAQ | USD |
| NVDA | NVIDIA Corporation | NASDAQ | USD |
| MSFT | Microsoft Corporation | NASDAQ | USD |
| GOOGL | Alphabet Inc. | NASDAQ | USD |
| TSLA | Tesla Inc. | NASDAQ | USD |

### Commodities

| symbol | name | currency |
|--------|------|----------|
| XAU | Gold Spot | USD |
| XAG | Silver Spot | USD |
| WTI | Crude Oil WTI | USD |

### ETFs

| symbol | name | exchange | currency |
|--------|------|----------|----------|
| SPY | SPDR S&P 500 ETF | NYSEARCA | USD |
| QQQ | Invesco QQQ Trust | NASDAQ | USD |

## Lookup Rules

1. **Transaction entry:** User selects asset by symbol (+ exchange for stocks). Backend resolves to `asset_id`.
2. **Unknown asset:** Return 404 with suggestion to request admin addition. Do NOT auto-create assets from user input in MVP.
3. **Search:** `GET /api/v1/assets?query=btc` — prefix match on symbol and name.
4. **News tagging:** Tagger matches article text against `symbol` and `name` from this catalog.

## Admin Operations

| Action | Role | Endpoint |
|--------|------|----------|
| List all assets | USER+ | `GET /api/v1/assets` |
| Add asset | ADMIN | `POST /api/v1/admin/assets` |
| Deactivate asset | ADMIN | `PATCH /api/v1/admin/assets/{id}` |

Deactivated assets remain in DB for historical transactions but cannot be added to new transactions.

## Price Data (external)

Asset Master stores identity only. Live prices come from external providers:

| Provider | Assets |
|----------|--------|
| CoinGecko | Crypto |
| Alpha Vantage / Yahoo Finance | Stocks, ETFs |
| Metals-API | Commodities |

Prices are cached in Redis (`price:{symbol}`, TTL 60s) — not persisted in Asset Master.
