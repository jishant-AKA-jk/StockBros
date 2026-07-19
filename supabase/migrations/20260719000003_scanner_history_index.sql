CREATE TABLE IF NOT EXISTS scanner_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL REFERENCES symbols(ticker) ON DELETE CASCADE,
    rule_id TEXT,
    results JSONB,
    scanned_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scanner_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scanner history" ON scanner_history
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scanner_history_user_symbol 
  ON scanner_history(user_id, symbol, scanned_at DESC);
