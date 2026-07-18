import { PriceBar } from '../../lib/types';

// Rule 1: EMA Stack
function calculateEMA(bars: PriceBar[], index: number, period: number): number | null {
  if (index < period - 1) return null;
  // Start from Math.max(0, index - period * 5) for burn-in to avoid O(N^2) on large datasets
  const startIndex = Math.max(0, index - period * 5);
  
  let sum = 0;
  for (let i = startIndex; i < startIndex + period; i++) {
    if (!bars[i] || isNaN(bars[i].close)) return null;
    sum += bars[i].close;
  }
  let ema = sum / period;
  
  const k = 2 / (period + 1);
  for (let i = startIndex + period; i <= index; i++) {
    if (!bars[i] || isNaN(bars[i].close)) return null;
    ema = (bars[i].close - ema) * k + ema;
  }
  
  return ema;
}

export function emaStack(bars: PriceBar[], index: number): boolean {
  if (!bars || index < 20 || bars.length <= index) return false;
  
  const ema10 = calculateEMA(bars, index, 10);
  const ema20 = calculateEMA(bars, index, 20);
  
  if (ema10 === null || ema20 === null) return false;
  
  if (!bars[index] || isNaN(bars[index].close)) return false;
  const currentPrice = bars[index].close;
  
  return currentPrice > ema10 && ema10 > ema20;
}

// Rule 2: Tight Consolidation
export function tightConsolidation(bars: PriceBar[], index: number, nDays: number = 5, threshold: number = 0.05): boolean {
  if (!bars || index < nDays - 1 || bars.length <= index) return false;
  
  for (let i = index - nDays + 1; i <= index; i++) {
    const bar = bars[i];
    if (!bar || bar.close === 0 || isNaN(bar.close) || isNaN(bar.high) || isNaN(bar.low)) return false;
    const range = bar.high - bar.low;
    const rangePct = range / bar.close;
    if (rangePct > threshold) {
      return false;
    }
  }
  return true;
}

// Rule 3: Volume Surge
export function volumeSurge(bars: PriceBar[], index: number, multiplier: number = 1.5, period: number = 20): boolean {
  if (!bars || index < period || bars.length <= index) return false;
  
  let sumVolume = 0;
  for (let i = index - period; i < index; i++) {
    if (!bars[i] || isNaN(bars[i].volume)) return false;
    sumVolume += bars[i].volume;
  }
  const avgVolume = sumVolume / period;
  
  if (avgVolume === 0 || !bars[index] || isNaN(bars[index].volume)) return false;
  
  return bars[index].volume > avgVolume * multiplier;
}

// Rule 4: Near 52-Week High
export function near52WeekHigh(bars: PriceBar[], index: number, threshold: number = 0.05): boolean {
  if (!bars || index < 0 || bars.length <= index) return false;
  
  const lookback = 252; // roughly 52 trading weeks
  const startIndex = Math.max(0, index - lookback + 1);
  
  let highestHigh = 0;
  for (let i = startIndex; i <= index; i++) {
    if (!bars[i] || isNaN(bars[i].high)) continue;
    if (bars[i].high > highestHigh) {
      highestHigh = bars[i].high;
    }
  }
  
  if (highestHigh === 0 || !bars[index] || isNaN(bars[index].close)) return false;
  
  const currentClose = bars[index].close;
  return currentClose >= highestHigh * (1 - threshold);
}

// Rule 5: Relative Strength
export function relativeStrength(bars: PriceBar[], index: number, benchmarkBars: PriceBar[], nDays: number = 20): boolean {
  if (!bars || !benchmarkBars || index < nDays || bars.length <= index) return false;
  
  const targetDate = bars[index]?.date;
  const startDate = bars[index - nDays]?.date;
  
  if (!targetDate || !startDate) return false;
  
  const benchEndIdx = benchmarkBars.findIndex(b => b?.date === targetDate);
  const benchStartIdx = benchmarkBars.findIndex(b => b?.date === startDate);
  
  if (benchEndIdx === -1 || benchStartIdx === -1) return false;
  
  if (!bars[index - nDays] || !bars[index] || !benchmarkBars[benchStartIdx] || !benchmarkBars[benchEndIdx]) return false;
  
  const stockStartClose = bars[index - nDays].close;
  const benchStartClose = benchmarkBars[benchStartIdx].close;
  
  if (stockStartClose === 0 || benchStartClose === 0 || isNaN(stockStartClose) || isNaN(benchStartClose) || isNaN(bars[index].close) || isNaN(benchmarkBars[benchEndIdx].close)) return false;
  
  const stockReturn = (bars[index].close - stockStartClose) / stockStartClose;
  const benchReturn = (benchmarkBars[benchEndIdx].close - benchStartClose) / benchStartClose;
  
  // Checking if stock outperforms the benchmark as a proxy for "top quartile"
  return stockReturn > benchReturn;
}

// Core Engine Types
export interface RuleConfig {
  id: string;
  fn: (bars: PriceBar[], index: number) => boolean;
}

// Core Engine Functions
export function runScreener(rules: RuleConfig[], universe: { symbol: string; bars: PriceBar[] }[]): Record<string, string[]> {
  const results: Record<string, string[]> = {};
  
  for (const rule of rules) {
    results[rule.id] = [];
  }
  
  for (const item of universe) {
    if (!item.bars || item.bars.length === 0) continue;
    const latestIndex = item.bars.length - 1;
    
    for (const rule of rules) {
      try {
        if (rule.fn(item.bars, latestIndex)) {
          results[rule.id].push(item.symbol);
        }
      } catch (e) {
        // Defensive programming: catch individual rule failures
      }
    }
  }
  
  return results;
}

export interface ScanTrigger {
  date: string;
  forwardReturns: {
    day5: number | null;
    day10: number | null;
    day20: number | null;
  };
}

export function runHistoricalScan(ruleFn: (bars: PriceBar[], index: number) => boolean, bars: PriceBar[]): ScanTrigger[] {
  if (!bars || bars.length === 0) return [];
  
  const triggers: ScanTrigger[] = [];
  
  for (let i = 0; i < bars.length; i++) {
    let fired = false;
    try {
      fired = ruleFn(bars, i);
    } catch (e) {
      fired = false;
    }
    
    if (fired) {
      const entryPrice = bars[i].close;
      
      const getReturn = (days: number) => {
        if (i + days < bars.length) {
          const exitPrice = bars[i + days].close;
          if (entryPrice === 0 || isNaN(entryPrice) || isNaN(exitPrice)) return null;
          return (exitPrice - entryPrice) / entryPrice;
        }
        return null;
      };
      
      triggers.push({
        date: bars[i].date,
        forwardReturns: {
          day5: getReturn(5),
          day10: getReturn(10),
          day20: getReturn(20),
        }
      });
    }
  }
  
  return triggers;
}

export interface ScanSummary {
  signalCount: number;
  winRate: number;
  averageForwardReturns: {
    day5: number | null;
    day10: number | null;
    day20: number | null;
  };
}

export function summarizeScan(triggers: ScanTrigger[]): ScanSummary {
  if (!triggers || triggers.length === 0) {
    return {
      signalCount: 0,
      winRate: 0,
      averageForwardReturns: { day5: null, day10: null, day20: null }
    };
  }
  
  let day10Wins = 0;
  let day10Count = 0;
  
  let sumDay5 = 0;
  let countDay5 = 0;
  
  let sumDay10 = 0;
  
  let sumDay20 = 0;
  let countDay20 = 0;
  
  for (const trigger of triggers) {
    if (trigger.forwardReturns.day5 !== null) {
      sumDay5 += trigger.forwardReturns.day5;
      countDay5++;
    }
    if (trigger.forwardReturns.day10 !== null) {
      sumDay10 += trigger.forwardReturns.day10;
      day10Count++;
      if (trigger.forwardReturns.day10 > 0) {
        day10Wins++;
      }
    }
    if (trigger.forwardReturns.day20 !== null) {
      sumDay20 += trigger.forwardReturns.day20;
      countDay20++;
    }
  }
  
  return {
    signalCount: triggers.length,
    winRate: day10Count > 0 ? (day10Wins / day10Count) * 100 : 0,
    averageForwardReturns: {
      day5: countDay5 > 0 ? sumDay5 / countDay5 : null,
      day10: day10Count > 0 ? sumDay10 / day10Count : null,
      day20: countDay20 > 0 ? sumDay20 / countDay20 : null,
    }
  };
}
