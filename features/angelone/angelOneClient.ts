import 'server-only';
// WARNING: This file must NEVER be imported into a client component.
// It accesses server-side secrets and performs backend-only operations.

import { createClient } from '@supabase/supabase-js';
import * as OTPAuth from 'otpauth';
import { PriceBar, Symbol as AppSymbol } from '../../lib/types';
import {
  AngelOneAuthError,
  AngelOneRateLimitError,
  AngelOneDataError,
  AngelOneError,
} from './errors';

const API_KEY = process.env.ANGELONE_API_KEY;
const CLIENT_CODE = process.env.ANGELONE_CLIENT_CODE;
const PASSWORD = process.env.ANGELONE_PASSWORD;
const TOTP_SECRET = process.env.ANGELONE_TOTP_SECRET;

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
  private readonly delayMs = 333; // ~3 requests per second

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
        await new Promise((r) => setTimeout(r, this.delayMs - timeSinceLast));
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

export class AngelOneClient {
  private jwtToken: string | null = null;
  private refreshToken: string | null = null;
  private feedToken: string | null = null;

  private getHeaders(includeAuth = true) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00-00-00-00-00-00',
      'X-PrivateKey': API_KEY || '',
    };
    if (includeAuth && this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }
    return headers;
  }

  async login() {
    if (!API_KEY || !CLIENT_CODE || !PASSWORD || !TOTP_SECRET) {
      throw new AngelOneAuthError('Missing Angel One credentials in environment variables');
    }

    const totpGen = new OTPAuth.TOTP({ secret: OTPAuth.Secret.fromBase32(TOTP_SECRET) });
    const totp = totpGen.generate();

    const payload = {
      clientcode: CLIENT_CODE,
      password: PASSWORD,
      totp: totp,
    };

    const response = await fetch('https://apiconnect.angelbroking.com/rest/auth/angelbroking/user/v1/loginByPassword', {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new AngelOneAuthError(`Login failed: ${data.message || response.statusText}`);
    }

    this.jwtToken = data.data.jwtToken;
    this.refreshToken = data.data.refreshToken;
    this.feedToken = data.data.feedToken;
  }

  async fetchInstrumentsMaster() {
    const response = await fetch('https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json');
    if (!response.ok) {
      throw new AngelOneDataError('Failed to fetch instrument master');
    }
    const data: any[] = await response.json();

    // Filter to NSE equities only to avoid too many records
    // In Angel One, NSE equities usually end with -EQ
    const equities = data.filter((item) => item.exch_seg === 'NSE' && item.symbol.endsWith('-EQ'));

    // Insert in batches to avoid Supabase limits
    const batchSize = 1000;
    for (let i = 0; i < equities.length; i += batchSize) {
      const batch = equities.slice(i, i + batchSize).map((item) => ({
        ticker: item.symbol.replace('-EQ', ''), // Strip -EQ for cleaner tickers
        dhan_security_id: item.token, // Reusing existing schema
        exchange_segment: item.exch_seg,
        name: item.name,
      }));

      const { error } = await getSupabase().from('symbols').upsert(batch, { onConflict: 'ticker' });
      if (error) {
        console.error('Error upserting symbols batch', error);
      }
    }
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 09:00`; // Angel one format requires time
  }
  
  private formatISODate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; 
  }

  private async fetchHistoricalFromApi(symbolToken: string, fromDate: Date, toDate: Date): Promise<PriceBar[]> {
    const payload = {
      exchange: 'NSE',
      symboltoken: symbolToken,
      interval: 'ONE_DAY',
      fromdate: this.formatDate(fromDate),
      todate: this.formatDate(toDate),
    };

    const response = await rateLimiter.enqueue(() => 
      fetch('https://apiconnect.angelbroking.com/rest/secure/angelbroking/historical/v1/getCandleData', {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(payload),
      })
    );

    if (response.status === 401 || response.status === 403) {
      throw new AngelOneAuthError('Token expired or invalid');
    }
    if (response.status === 429) {
      throw new AngelOneRateLimitError('Rate limit exceeded');
    }

    const data = await response.json();
    if (!data.status) {
      if (data.message && data.message.includes('Invalid Token')) {
        throw new AngelOneAuthError('Invalid Token');
      }
      throw new AngelOneDataError(`API Error: ${data.message}`);
    }

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.map((candle: any[]) => {
      // candle = [timestamp, open, high, low, close, volume]
      // timestamp is string like "2021-02-08T00:00:00+05:30"
      const dateStr = candle[0].split('T')[0];
      return {
        date: dateStr,
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
      };
    });
  }

  async getHistoricalDaily(symbol: string, fromDate: Date, toDate: Date): Promise<PriceBar[]> {
    if (fromDate > toDate) {
      throw new AngelOneError('fromDate cannot be after toDate');
    }

    // 1. Get symbol token
    const { data: symbolInfo, error: symbolError } = await getSupabase()
      .from('symbols')
      .select('ticker, dhan_security_id')
      .eq('ticker', symbol)
      .single();

    if (symbolError || !symbolInfo) {
      throw new AngelOneDataError(`Symbol not found in database: ${symbol}`);
    }

    const symbolToken = symbolInfo.dhan_security_id;

    // 2. Check Cache
    const fromStr = this.formatISODate(fromDate);
    const toStr = this.formatISODate(toDate);

    const { data: cachedData, error: cacheError } = await getSupabase()
      .from('price_cache')
      .select('date, open, high, low, close, volume')
      .eq('symbol', symbol)
      .gte('date', fromStr)
      .lte('date', toStr)
      .order('date', { ascending: true });

    const cachedBars: PriceBar[] = (cachedData || []).map((row) => ({
      date: row.date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
    }));

    // Find gap
    let fetchStart = new Date(fromDate);
    if (cachedBars.length > 0) {
      const lastCachedDateStr = cachedBars[cachedBars.length - 1].date;
      if (lastCachedDateStr >= toStr) {
        return cachedBars;
      }
      fetchStart = new Date(lastCachedDateStr);
      fetchStart.setUTCDate(fetchStart.getUTCDate() + 1);
    }

    if (fetchStart <= toDate) {
      let retryCount = 0;
      let newBars: PriceBar[] = [];
      
      while (retryCount < 2) {
        try {
          if (!this.jwtToken) {
            await this.login();
          }
          newBars = await this.fetchHistoricalFromApi(symbolToken, fetchStart, toDate);
          break; // success
        } catch (err) {
          if (err instanceof AngelOneAuthError) {
            console.log('Token expired, re-authenticating...');
            await this.login();
            retryCount++;
          } else {
            throw err;
          }
        }
      }

      if (newBars.length > 0) {
        const rowsToInsert = newBars.map((bar) => ({
          symbol: symbol,
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

    cachedBars.sort((a, b) => a.date.localeCompare(b.date));
    return cachedBars.filter((b) => b.date >= fromStr && b.date <= toStr);
  }

  async refreshLatestBar(symbol: string): Promise<PriceBar | null> {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 5); // 5 days to account for long weekends

    const bars = await this.getHistoricalDaily(symbol, threeDaysAgo, today);
    if (bars.length > 0) {
      return bars[bars.length - 1];
    }
    return null;
  }
}

export const angelOneClient = new AngelOneClient();
