import 'server-only';
// WARNING: This file must NEVER be imported into a client component.
// It accesses server-side secrets and performs backend-only operations.

import { createClient } from '@supabase/supabase-js';
import { DhanAuthError, DhanRateLimitError, DhanError, DhanValidationError } from './errors';
import type { PriceBar } from '../../lib/types';

const DHAN_CLIENT_ID = process.env.DHAN_CLIENT_ID;
const DHAN_ACCESS_TOKEN = process.env.DHAN_ACCESS_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

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

class RateLimiter {
  private queue: Array<() => void> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly delayMs = 250; // Max 4 requests per second

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLast = now - this.lastRequestTime;
      
      if (timeSinceLast < this.delayMs) {
        await new Promise(r => setTimeout(r, this.delayMs - timeSinceLast));
      }
      
      const fn = this.queue.shift();
      if (fn) {
        this.lastRequestTime = Date.now();
        await fn();
      }
    }
    
    this.isProcessing = false;
  }
}

const rateLimiter = new RateLimiter();

function generateMockDailyData(fromDate: string, toDate: string): PriceBar[] {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const bars: PriceBar[] = [];
  
  let currentPrice = 1500 + Math.random() * 1000; // start price
  
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dayOfWeek = d.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends
    
    const dateStr = d.toISOString().split('T')[0];
    
    const change = (Math.random() - 0.48) * 30; // slight upward bias
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    const volume = Math.floor(100000 + Math.random() * 900000);
    
    bars.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });
    
    currentPrice = close;
  }
  
  return bars;
}

async function fetchFromDhanApi(endpoint: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!DHAN_CLIENT_ID || !DHAN_ACCESS_TOKEN) {
    throw new DhanAuthError('Dhan credentials are not set in environment variables');
  }

  const url = `https://api.dhan.co/v2${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access-token': DHAN_ACCESS_TOKEN,
      'client-id': DHAN_CLIENT_ID,
    },
    body: JSON.stringify(body),
  });

  if (response.status === 401 || response.status === 403) {
    throw new DhanAuthError();
  }

  if (response.status === 429) {
    throw new DhanRateLimitError();
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new DhanError(`Dhan API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

async function fetchHistoricalDailyFromDhanWithRetry(
  securityId: string,
  exchangeSegment: string,
  instrument: string,
  fromDate: string,
  toDate: string,
  retries = 3
): Promise<PriceBar[]> {
  if (process.env.USE_MOCK_DHAN === 'true') {
    console.warn(`[Dhan Client] Mock mode active. Generating mock daily data from ${fromDate} to ${toDate}`);
    return generateMockDailyData(fromDate, toDate);
  }

  const body = {
    securityId,
    exchangeSegment,
    instrument,
    expiryCode: 0,
    oi: false,
    fromDate,
    toDate,
  };

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const data = await rateLimiter.enqueue(() => fetchFromDhanApi('/charts/historical', body));
      
      if (!data || data.status === 'failure') {
        throw new DhanError(`Dhan API failure: ${data?.remarks || 'Unknown'}`);
      }
      
      const bars: PriceBar[] = [];
      const responseData = data.data as any;
      const len = responseData?.start_Time?.length || 0;
      
      for (let i = 0; i < len; i++) {
        const ts = responseData.start_Time[i];
        let dateObj: Date;
        const tsNumber = typeof ts === 'string' ? parseFloat(ts) : ts as number;
        dateObj = new Date(tsNumber < 1e11 ? tsNumber * 1000 : tsNumber);
        
        const dateStr = dateObj.toISOString().split('T')[0];
        
        bars.push({
          date: dateStr,
          open: responseData.open[i],
          high: responseData.high[i],
          low: responseData.low[i],
          close: responseData.close[i],
          volume: responseData.volume[i],
        });
      }
      
      // Sort chronologically just in case
      bars.sort((a, b) => a.date.localeCompare(b.date));
      return bars;
      
    } catch (error) {
      // If we encounter a subscription error and mock fallback is allowed/enabled, run mock mode.
      if (error instanceof DhanAuthError && process.env.ALLOW_MOCK_FALLBACK === 'true') {
        console.warn(`[Dhan Client] Dhan API returned Subscription/Auth error. Falling back to mock data.`);
        return generateMockDailyData(fromDate, toDate);
      }

      if ((error instanceof DhanRateLimitError || (error instanceof DhanError && error.message.includes('50'))) && attempt < retries) {
        const backoff = Math.pow(2, attempt) * 1000;
        console.warn(`Transient error fetching from Dhan, retrying in ${backoff}ms...`, error);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      throw error;
    }
  }
  throw new DhanError('Max retries exceeded');
}

/**
 * Fetches historical daily OHLC data, utilizing Supabase caching.
 */
export async function getHistoricalDaily(
  securityId: string,
  fromDate: string,
  toDate: string
): Promise<PriceBar[]> {
  if (!securityId || !fromDate || !toDate) {
    throw new DhanValidationError('securityId, fromDate, and toDate are required');
  }

  if (new Date(fromDate) > new Date(toDate)) {
    throw new DhanValidationError('fromDate cannot be after toDate');
  }

  // 1. Get symbol details from database
  const { data: symbolInfo, error: symbolError } = await getSupabase()
    .from('symbols')
    .select('ticker, exchange_segment')
    .eq('dhan_security_id', securityId)
    .single();

  if (symbolError || !symbolInfo) {
    throw new DhanValidationError(`Symbol not found for securityId: ${securityId}`);
  }

  const { ticker, exchange_segment } = symbolInfo;

  // For equities, instrument is generally EQUITY. For derivatives it's different.
  // Assuming equities for now based on standard "NSE_EQ".
  const instrument = 'EQUITY'; 

  // 2. Check cache
  const { data: cachedData, error: cacheError } = await getSupabase()
    .from('price_cache')
    .select('date, open, high, low, close, volume')
    .eq('symbol', ticker)
    .gte('date', fromDate)
    .lte('date', toDate)
    .order('date', { ascending: true });

  if (cacheError) {
    console.error('Error reading from price_cache', cacheError);
  }

  const cachedBars: PriceBar[] = (cachedData || []).map(row => ({
    date: row.date,
    open: Number(row.open),
    high: Number(row.high),
    low: Number(row.low),
    close: Number(row.close),
    volume: Number(row.volume),
  }));

  // We should ideally find missing date ranges, but markets are closed on weekends/holidays.
  // A simple heuristic: if we have some data, but it's not contiguous or we just want to fill gaps,
  // it's tricky because of market holidays. 
  // Let's check if we have the start and end in cache roughly, or we just fetch the whole range if it's completely missing,
  // or we just fetch the gap if the latest in cache is older than toDate.
  
  // Simplest strategy for gap filling:
  // If no data, fetch full range.
  // If data exists, fetch from the day after the last cached day up to toDate.
  // We assume no gaps exist *before* the last cached day for this symbol.
  
  let fetchStart = fromDate;
  if (cachedBars.length > 0) {
    const lastCachedDate = cachedBars[cachedBars.length - 1].date;
    if (lastCachedDate >= toDate) {
      // We have all requested data
      return cachedBars.filter(b => b.date >= fromDate && b.date <= toDate);
    }
    
    // Calculate the next day after the last cached date
    const nextDate = new Date(lastCachedDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + 1);
    fetchStart = nextDate.toISOString().split('T')[0];
  }

  // 3. Fetch missing gap from Dhan
  if (fetchStart <= toDate) {
    console.log(`Fetching from Dhan for ${ticker} from ${fetchStart} to ${toDate}`);
    const newBars = await fetchHistoricalDailyFromDhanWithRetry(
      securityId,
      exchange_segment || 'NSE_EQ',
      instrument,
      fetchStart,
      toDate
    );

    if (newBars.length > 0) {
      // Upsert into cache
      const rowsToInsert = newBars.map(bar => ({
        symbol: ticker,
        date: bar.date,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume,
      }));

      const { error: upsertError } = await getSupabase()
        .from('price_cache')
        .upsert(rowsToInsert, { onConflict: 'symbol,date' });

      if (upsertError) {
        console.error('Error upserting to price_cache', upsertError);
      }
      
      cachedBars.push(...newBars);
    }
  }

  // Return combined and sorted data
  cachedBars.sort((a, b) => a.date.localeCompare(b.date));
  return cachedBars.filter(b => b.date >= fromDate && b.date <= toDate);
}

/**
 * Run once daily after market close to append just the newest candle.
 */
export async function refreshLatestBar(securityId: string): Promise<PriceBar | null> {
  const today = new Date().toISOString().split('T')[0];
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  // We fetch a small window to ensure we get the latest trading day (e.g., if today is weekend)
  const bars = await getHistoricalDaily(securityId, threeDaysAgo, today);
  
  if (bars.length > 0) {
    return bars[bars.length - 1];
  }
  
  return null;
}
