CREATE TABLE IF NOT EXISTS watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(255),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(watchlist_id, asset_symbol)
);