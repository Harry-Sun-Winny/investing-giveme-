CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(20) NOT NULL,
    asset_name VARCHAR(200),
    type VARCHAR(10) NOT NULL,
    quantity NUMERIC(20,8) NOT NULL,
    price NUMERIC(20,8) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);