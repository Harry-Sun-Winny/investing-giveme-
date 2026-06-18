CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(320) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    base_currency CHAR(3) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol VARCHAR(32) NOT NULL,
    name VARCHAR(160) NOT NULL,
    asset_type VARCHAR(32) NOT NULL,
    exchange VARCHAR(80),
    currency CHAR(3) NOT NULL,
    isin VARCHAR(12),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (symbol, exchange)
);

CREATE TABLE portfolio_positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    quantity NUMERIC(24, 8) NOT NULL CHECK (quantity >= 0),
    average_cost NUMERIC(24, 8) NOT NULL CHECK (average_cost >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (portfolio_id, asset_id)
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    transaction_type VARCHAR(16) NOT NULL,
    quantity NUMERIC(24, 8) NOT NULL CHECK (quantity > 0),
    price NUMERIC(24, 8) NOT NULL CHECK (price >= 0),
    fees NUMERIC(24, 8) NOT NULL DEFAULT 0 CHECK (fees >= 0),
    executed_at TIMESTAMPTZ NOT NULL,
    source VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, name)
);

CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id),
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (watchlist_id, asset_id)
);

CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(140) NOT NULL,
    target_amount NUMERIC(24, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(24, 2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    currency CHAR(3) NOT NULL,
    target_date DATE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(120) NOT NULL,
    publication_date TIMESTAMPTZ NOT NULL,
    title VARCHAR(300) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE news_article_assets (
    news_article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    PRIMARY KEY (news_article_id, asset_id)
);

CREATE TABLE ai_portfolio_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    risk_score NUMERIC(5, 2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    analysis TEXT NOT NULL,
    model VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_analysis_citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES ai_portfolio_analyses(id) ON DELETE CASCADE,
    source VARCHAR(160) NOT NULL,
    title VARCHAR(300) NOT NULL,
    url TEXT NOT NULL,
    publication_date TIMESTAMPTZ NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(160) NOT NULL,
    body TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_positions_portfolio_id ON portfolio_positions(portfolio_id);
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX idx_goals_user_id ON financial_goals(user_id);
CREATE INDEX idx_news_publication_date ON news_articles(publication_date DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

