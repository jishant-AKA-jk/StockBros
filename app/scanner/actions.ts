'use server';

import { createClient } from '@/lib/supabase/server'
import { 
  runHistoricalScan, 
  summarizeScan,
  emaStack, 
  tightConsolidation, 
  volumeSurge, 
  near52WeekHigh, 
  relativeStrength 
} from '@/features/screener'

export async function runScannerAction({ ruleId, target }: { ruleId: string, target: string }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  let symbolsToScan: string[] = []

  if (target === 'watchlist') {
    const { data: wl } = await supabase
      .from('watchlist_items')
      .select('symbol')
      .eq('user_id', user.id)
    
    if (wl) {
      symbolsToScan = wl.map(w => w.symbol)
    }
  } else {
    const { data: all } = await supabase
      .from('symbols')
      .select('ticker')
      .limit(150)
    if (all) {
      symbolsToScan = all.map(a => a.ticker)
    }
  }

  if (symbolsToScan.length === 0) {
    throw new Error('No symbols to scan')
  }

  const toDateStr = new Date().toISOString().split('T')[0]
  const fromDate = new Date()
  fromDate.setFullYear(fromDate.getFullYear() - 2)
  const fromDateStr = fromDate.toISOString().split('T')[0]

  const allTriggers = []

  let benchmarkBars: { date: string, open: number, high: number, low: number, close: number, volume: number }[] = []
  if (ruleId === 'Relative_Strength') {
    const { data } = await supabase
      .from('cached_candles')
      .select('date, open, high, low, close, volume')
      .eq('symbol', 'RELIANCE')
      .gte('date', fromDateStr)
      .lte('date', toDateStr)
      .order('date', { ascending: true })
      
    benchmarkBars = (data || []).map(r => ({
      ...r,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
    }))
  }

  for (const sym of symbolsToScan) {
    const { data } = await supabase
      .from('cached_candles')
      .select('date, open, high, low, close, volume')
      .eq('symbol', sym)
      .gte('date', fromDateStr)
      .lte('date', toDateStr)
      .order('date', { ascending: true })
      
    if (!data || data.length === 0) continue;
    
    const bars = data.map(r => ({
      date: r.date,
      open: Number(r.open),
      high: Number(r.high),
      low: Number(r.low),
      close: Number(r.close),
      volume: Number(r.volume),
    }))

    let ruleFn: ((bars: { date: string, open: number, high: number, low: number, close: number, volume: number }[], i: number) => boolean) | null = null;
    switch(ruleId) {
      case 'EMA_Stack': ruleFn = emaStack; break;
      case 'Tight_Consolidation': ruleFn = tightConsolidation; break;
      case 'Volume_Surge': ruleFn = volumeSurge; break;
      case 'Near_52W_High': ruleFn = near52WeekHigh; break;
      case 'Relative_Strength': ruleFn = (b: { date: string, open: number, high: number, low: number, close: number, volume: number }[], i: number) => relativeStrength(b, i, benchmarkBars); break;
    }

    if (ruleFn) {
      const triggers = runHistoricalScan(ruleFn, bars)
      allTriggers.push(...triggers.map(t => ({ ...t, symbol: sym })))
    }
  }

  const summary = summarizeScan(allTriggers)
  return { summary, triggers: allTriggers.slice(-100) }
}

export async function getScannerHistory(offset: number = 0, limit: number = 5) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data, count, error } = await supabase
    .from('scanner_history')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('scanned_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error('Failed to fetch history');

  const total = count || 0;

  return {
    items: data,
    total,
    hasMore: offset + limit < total,
    offset,
    limit
  };
}
