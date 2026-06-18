-- Backfill asset_symbol for legacy watchlist rows that only had asset_id.

UPDATE watchlist_items wi
SET asset_symbol = a.symbol
FROM assets a
WHERE wi.asset_symbol IS NULL
  AND wi.asset_id IS NOT NULL
  AND wi.asset_id = a.id;
