import { PriceBar, ScannerMatch } from '@/lib/types';
import { calculateEma } from '@/features/charts/utils';

/**
 * Scans for Episodic Pivots (EP)
 * Criteria: Massive volume spike (>300% of 50-day average) with a large gap up or range expansion.
 */
export function scanEpisodicPivots(bars: PriceBar[]): ScannerMatch[] {
  if (bars.length < 50) return [];
  const matches: ScannerMatch[] = [];

  for (let i = 50; i < bars.length; i++) {
    // Calculate 50-day average volume
    const volSum = bars.slice(i - 50, i).reduce((sum, b) => sum + b.volume, 0);
    const avgVol = volSum / 50;

    const currentBar = bars[i];
    const prevBar = bars[i - 1];

    // Check for > 300% volume
    if (currentBar.volume > avgVol * 3) {
      // Check for gap up or strong green candle (>4% move)
      const movePercent = (currentBar.close - prevBar.close) / prevBar.close;
      if (movePercent > 0.04 && currentBar.close > currentBar.open) {
        matches.push({
          date: currentBar.date,
          price: currentBar.low,
          type: 'EPISODIC_PIVOT',
          text: `EP (+${(movePercent * 100).toFixed(1)}%, ${(currentBar.volume / avgVol).toFixed(1)}x Vol)`,
        });
      }
    }
  }
  return matches;
}

/**
 * Scans for High Tight Flags (HTF)
 * Criteria: >90% move in < 40 days, followed by <20% consolidation.
 */
export function scanHighTightFlags(bars: PriceBar[]): ScannerMatch[] {
  if (bars.length < 40) return [];
  const matches: ScannerMatch[] = [];

  // Simplified HTF logic for performance
  for (let i = 40; i < bars.length; i++) {
    const window = bars.slice(i - 40, i);
    const minLow = Math.min(...window.map(b => b.low));
    const maxHigh = Math.max(...window.map(b => b.high));
    
    const move = (maxHigh - minLow) / minLow;
    
    // Check if the current price is consolidating tightly near the highs
    const currentBar = bars[i];
    const drawdown = (maxHigh - currentBar.close) / maxHigh;

    if (move > 0.90 && drawdown < 0.20) {
      // Ensure it's breaking out of the consolidation today
      if (currentBar.close > bars[i - 1].high && currentBar.volume > bars[i-1].volume) {
        matches.push({
          date: currentBar.date,
          price: currentBar.low,
          type: 'HIGH_TIGHT_FLAG',
          text: `HTF Breakout`,
        });
      }
    }
  }

  return matches;
}
