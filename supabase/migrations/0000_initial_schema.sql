-- Phase 0: Initial Schema Setup

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Symbols Table
CREATE TABLE symbols (
    ticker TEXT PRIMARY KEY,
    dhan_security_id TEXT,
    exchange_segment TEXT,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE symbols ENABLE ROW LEVEL SECURITY;

-- Price Cache Table
CREATE TABLE price_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT REFERENCES symbols(ticker) ON DELETE CASCADE,
    date DATE NOT NULL,
    open NUMERIC,
    high NUMERIC,
    low NUMERIC,
    close NUMERIC,
    volume BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (symbol, date)
);

CREATE INDEX idx_price_cache_symbol_date ON price_cache(symbol, date);
ALTER TABLE price_cache ENABLE ROW LEVEL SECURITY;

-- Watchlist Items Table
CREATE TABLE watchlist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    symbol TEXT REFERENCES symbols(ticker) ON DELETE CASCADE,
    tag TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Journal Entries Table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    symbol TEXT REFERENCES symbols(ticker) ON DELETE CASCADE,
    setup_tag TEXT,
    entry_date TIMESTAMP WITH TIME ZONE,
    entry_price NUMERIC,
    exit_date TIMESTAMP WITH TIME ZONE,
    exit_price NUMERIC,
    notes TEXT,
    r_multiple NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
