-- Candle data cache for fast chart loading
CREATE TABLE IF NOT EXISTS cached_candles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT 'ONE_DAY',
  date DATE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol, interval, date)
);

CREATE INDEX IF NOT EXISTS idx_cached_candles_lookup 
  ON cached_candles(symbol, interval, date DESC);

ALTER TABLE cached_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON cached_candles
  FOR ALL USING (true);
