import { PriceBar, ScanResult, ScanMatch } from '@/lib/types';
import { runHistoricalScan, summarizeScan, emaStack, tightConsolidation, volumeSurge } from '../screener/index';
import { angelOneClient } from '../angelone/angelOneClient';
import { createClient } from '@/lib/supabase/server';

export async function runScanner(symbol: string, rule: string): Promise<ScanResult> {
  const supabase = createClient();
  const { data: symData } = await supabase.from('symbols').select('name').eq('ticker', symbol).single();
  
  const toDate = new Date();
  const fromDate = new Date();
  // We use 2 years as per plan for pattern detection
  fromDate.setFullYear(fromDate.getFullYear() - 2); 
  
  const candles = await angelOneClient.getHistoricalDaily(symbol, fromDate, toDate);
  
  let ruleFn: any = null;
  let description = '';
  if (rule === 'ema_stack') { ruleFn = emaStack; description = 'EMA Stack aligned'; }
  else if (rule === 'consolidation') { ruleFn = tightConsolidation; description = 'Tight consolidation detected'; }
  else if (rule === 'volume_surge') { ruleFn = volumeSurge; description = 'Volume surge detected'; }
  else throw new Error('Invalid rule');
  
  const triggers = runHistoricalScan(ruleFn, candles);
  
  const matches: ScanMatch[] = triggers.map(t => {
    const bar = candles.find(c => c.date === t.date);
    return {
      date: t.date,
      price: bar ? bar.close : 0,
      description,
      type: 'signal'
    };
  });
  
  const summary = summarizeScan(triggers);
  
  return {
    symbol,
    name: symData ? symData.name : symbol,
    candles,
    matches,
    stats: {
      totalMatches: summary.signalCount,
      successRate: summary.winRate,
      avgReturn: summary.averageForwardReturns.day10 || 0,
    }
  };
}
