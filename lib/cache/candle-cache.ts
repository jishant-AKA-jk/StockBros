import { createClient } from '@supabase/supabase-js';
import { PriceBar } from '../types';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !key) {
    return createClient('https://placeholder-url.supabase.co', 'placeholder-key');
  }
  if (!_supabase) {
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const candleCache = {
  get: async (symbol: string, fromDate: string, toDate: string, interval: string = 'ONE_DAY'): Promise<PriceBar[] | null> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('cached_candles')
      .select('date, open, high, low, close, volume')
      .eq('symbol', symbol)
      .eq('interval', interval)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching from cached_candles', error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    return data.map(row => ({
      date: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));
  },
  
  set: async (symbol: string, bars: PriceBar[], interval: string = 'ONE_DAY') => {
    if (!bars.length) return;
    
    const supabase = getSupabase();
    const rows = bars.map(bar => ({
      symbol,
      interval,
      date: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
      volume: bar.volume,
    }));
    
    // Insert in batches to avoid size limits
    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from('cached_candles')
        .upsert(batch, { onConflict: 'symbol,interval,date' });
        
      if (error) {
        console.error('Error upserting to cached_candles', error);
      }
    }
  }
};
