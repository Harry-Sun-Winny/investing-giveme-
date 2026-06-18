-- Align transactions table with JPA entity (V1 used asset_id; entity uses asset_symbol)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'asset_id'
    ) THEN
        DROP TABLE transactions;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_symbol VARCHAR(32) NOT NULL,
    asset_name VARCHAR(160),
    type VARCHAR(16) NOT NULL,
    quantity NUMERIC(24, 8) NOT NULL CHECK (quantity > 0),
    price NUMERIC(24, 8) NOT NULL CHECK (price >= 0),
    currency CHAR(3) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_portfolio_id ON transactions(portfolio_id);

CREATE TABLE IF NOT EXISTS news_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    news_article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    tag VARCHAR(64) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0 AND confidence <= 1),
    UNIQUE (news_article_id, tag)
);

CREATE TABLE IF NOT EXISTS notification_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_type VARCHAR(40) NOT NULL,
    config JSONB NOT NULL DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL DEFAULT 'Portfolio chat',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('USER', 'ASSISTANT', 'SYSTEM')),
    content TEXT NOT NULL,
    citations JSONB,
    model VARCHAR(80),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entity_type VARCHAR(40) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(16) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    before_state JSONB,
    after_state JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_tags_article_id ON news_tags(news_article_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_user_id ON notification_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assets_symbol ON assets(symbol);

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('ADMIN', 'MODERATOR', 'PREMIUM', 'USER'));

-- Asset master seed
INSERT INTO assets (symbol, name, asset_type, exchange, currency)
SELECT v.symbol, v.name, v.asset_type, v.exchange, v.currency
FROM (VALUES
    ('BTC',  'Bitcoin',              'CRYPTO',    NULL,      'USD'),
    ('ETH',  'Ethereum',             'CRYPTO',    NULL,      'USD'),
    ('SOL',  'Solana',               'CRYPTO',    NULL,      'USD'),
    ('AAPL', 'Apple Inc.',           'STOCK',     'NASDAQ',  'USD'),
    ('NVDA', 'NVIDIA Corporation',   'STOCK',     'NASDAQ',  'USD'),
    ('MSFT', 'Microsoft Corporation','STOCK',     'NASDAQ',  'USD'),
    ('GOOGL','Alphabet Inc.',        'STOCK',     'NASDAQ',  'USD'),
    ('TSLA', 'Tesla Inc.',           'STOCK',     'NASDAQ',  'USD'),
    ('XAU',  'Gold Spot',            'COMMODITY', NULL,      'USD'),
    ('XAG',  'Silver Spot',          'COMMODITY', NULL,      'USD'),
    ('WTI',  'Crude Oil WTI',        'COMMODITY', NULL,      'USD'),
    ('SPY',  'SPDR S&P 500 ETF',     'ETF',       'NYSEARCA','USD'),
    ('QQQ',  'Invesco QQQ Trust',    'ETF',       'NASDAQ',  'USD')
) AS v(symbol, name, asset_type, exchange, currency)
WHERE NOT EXISTS (
    SELECT 1 FROM assets a
    WHERE a.symbol = v.symbol
      AND (a.exchange IS NOT DISTINCT FROM v.exchange)
);
