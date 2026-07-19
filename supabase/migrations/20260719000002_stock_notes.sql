CREATE TABLE IF NOT EXISTS stock_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  content TEXT NOT NULL,
  chart_date DATE,
  chart_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON stock_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_stock_notes_user_symbol ON stock_notes(user_id, symbol);
