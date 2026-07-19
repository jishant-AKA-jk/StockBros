import { SupabaseClient } from '@supabase/supabase-js';
import { PriceBar } from '../../lib/types';
import { angelOneClient } from '../angelone/angelOneClient';
import pMap from 'p-map';
import { emaStack, tightConsolidation, volumeSurge } from './index';

export interface ScreenerResult {
  symbol: string;
  name: string;
  candles: PriceBar[];
  signals: string[];
}

export async function getScreenerResults(
  supabase: SupabaseClient,
  rules: string[],
  offset: number = 0,
  limit: number = 5
) {
  // 1. Fetch symbols ordered by market cap / volume or simply ID for now
  const { data: symbolsData, count, error } = await supabase
    .from('symbols')
    .select('ticker, name', { count: 'exact' })
    .order('ticker', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Failed to fetch symbols');
  }

  const total = count || 0;
  const symbols = symbolsData || [];

  if (symbols.length === 0) {
    return { results: [], total, hasMore: false, offset, limit };
  }

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 1);

  // 2. Parallel fetch with concurrency control
  const results = await pMap(symbols, async (sym) => {
    try {
      const candles = await angelOneClient.getHistoricalDaily(sym.ticker, fromDate, toDate);
      if (!candles || candles.length === 0) return null;

      const signals: string[] = [];
      const latestIndex = candles.length - 1;

      // Evaluate rules
      for (const rule of rules) {
        let matched = false;
        if (rule === 'ema_stack') matched = emaStack(candles, latestIndex);
        if (rule === 'consolidation') matched = tightConsolidation(candles, latestIndex);
        if (rule === 'volume_surge') matched = volumeSurge(candles, latestIndex);
        // ... add more rules if necessary
        
        if (matched) {
          signals.push(rule);
        }
      }

      // We will match if ALL requested rules match
      if (signals.length === rules.length && rules.length > 0) {
        return {
          symbol: sym.ticker,
          name: sym.name,
          candles,
          signals
        };
      }
      return null;
    } catch (err) {
      console.error(`Failed to process ${sym.ticker}:`, err);
      return null; // skip failed
    }
  }, { concurrency: 5 });

  const filteredResults = results.filter(Boolean) as ScreenerResult[];

  return {
    results: filteredResults,
    total,
    hasMore: offset + limit < total,
    offset,
    limit
  };
}
