import {
  emaStack,
  tightConsolidation,
  volumeSurge,
  near52WeekHigh,
  relativeStrength,
  runScreener,
  runHistoricalScan,
  summarizeScan
} from '../../../features/screener';
import { PriceBar } from '../../../lib/types';

// PROTECTS AGAINST: Regressions in the Phase 1B technical screener logic,
// ensuring the core logic for identifying trading setups remains accurate.
describe('Screener Engine Rules', () => {
  const baseBar: PriceBar = { date: '2020-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 };

  describe('emaStack', () => {
    it('returns false if not enough bars', () => {
      const bars = Array(10).fill(baseBar);
      expect(emaStack(bars, 9)).toBe(false);
    });

    it('returns true when price > 10EMA > 20EMA', () => {
      // Build a rising trend to ensure 10EMA > 20EMA and price > 10EMA
      const bars: PriceBar[] = [];
      let price = 100;
      for (let i = 0; i < 50; i++) {
        price += 2; // steady increase
        bars.push({ ...baseBar, date: `2020-01-${(i + 1).toString().padStart(2, '0')}`, close: price });
      }
      expect(emaStack(bars, 49)).toBe(true);
    });

    it('returns false when price is below EMA', () => {
      const bars: PriceBar[] = [];
      let price = 200;
      for (let i = 0; i < 50; i++) {
        price -= 2; // steady decrease
        bars.push({ ...baseBar, date: `2020-01-${(i + 1).toString().padStart(2, '0')}`, close: price });
      }
      expect(emaStack(bars, 49)).toBe(false);
    });
  });

  describe('tightConsolidation', () => {
    it('returns true when range is tight', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 10; i++) {
        // High 101, Low 99, Close 100 -> range = 2, 2/100 = 2% (tight)
        bars.push({ ...baseBar, high: 101, low: 99, close: 100 });
      }
      expect(tightConsolidation(bars, 9, 5, 0.05)).toBe(true);
    });

    it('returns false when range is loose', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 10; i++) {
        // 1 day out of 5 has loose range
        const isLoose = i === 8;
        bars.push({ ...baseBar, high: isLoose ? 110 : 101, low: isLoose ? 90 : 99, close: 100 });
      }
      expect(tightConsolidation(bars, 9, 5, 0.05)).toBe(false);
    });
  });

  describe('volumeSurge', () => {
    it('returns true when volume > 1.5x average', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 21; i++) {
        bars.push({ ...baseBar, volume: i === 20 ? 1600 : 1000 });
      }
      // Avg of previous 20 is 1000. 1600 > 1.5 * 1000 -> 1600 > 1500 -> true
      expect(volumeSurge(bars, 20)).toBe(true);
    });

    it('returns false when volume is average', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 21; i++) {
        bars.push({ ...baseBar, volume: 1000 });
      }
      expect(volumeSurge(bars, 20)).toBe(false);
    });
  });

  describe('near52WeekHigh', () => {
    it('returns true when within threshold', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 200; i++) {
        bars.push({ ...baseBar, high: 100, close: 90 });
      }
      // Highest high is 100. Close is 96. 96 >= 100 * 0.95 -> 96 >= 95 -> true
      bars.push({ ...baseBar, high: 100, close: 96 });
      expect(near52WeekHigh(bars, 200, 0.05)).toBe(true);
    });

    it('returns false when outside threshold', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 200; i++) {
        bars.push({ ...baseBar, high: 100, close: 90 });
      }
      // Close is 90. 90 >= 95 -> false
      bars.push({ ...baseBar, high: 100, close: 90 });
      expect(near52WeekHigh(bars, 200, 0.05)).toBe(false);
    });
  });

  describe('relativeStrength', () => {
    it('returns true when outperforming benchmark', () => {
      const bars: PriceBar[] = [];
      const bench: PriceBar[] = [];
      for (let i = 0; i < 21; i++) {
        const date = `2020-01-${(i + 1).toString().padStart(2, '0')}`;
        // Stock goes from 100 to 120 (20% return)
        bars.push({ ...baseBar, date, close: i === 20 ? 120 : 100 });
        // Benchmark goes from 100 to 110 (10% return)
        bench.push({ ...baseBar, date, close: i === 20 ? 110 : 100 });
      }
      expect(relativeStrength(bars, 20, bench, 20)).toBe(true);
    });

    it('returns false when underperforming benchmark', () => {
      const bars: PriceBar[] = [];
      const bench: PriceBar[] = [];
      for (let i = 0; i < 21; i++) {
        const date = `2020-01-${(i + 1).toString().padStart(2, '0')}`;
        bars.push({ ...baseBar, date, close: i === 20 ? 105 : 100 });
        bench.push({ ...baseBar, date, close: i === 20 ? 110 : 100 });
      }
      expect(relativeStrength(bars, 20, bench, 20)).toBe(false);
    });
  });
});

describe('Screener Engine Core Scanners', () => {
  const baseBar: PriceBar = { date: '2020-01-01', open: 100, high: 105, low: 95, close: 100, volume: 1000 };

  describe('runScreener', () => {
    it('matches symbols based on rules', () => {
      const rules = [
        { id: 'rule1', fn: (bars: PriceBar[], idx: number) => bars[idx].close > 100 },
        { id: 'rule2', fn: (bars: PriceBar[], idx: number) => bars[idx].close < 50 }
      ];
      
      const universe = [
        { symbol: 'AAPL', bars: [{ ...baseBar, close: 150 }] },
        { symbol: 'MSFT', bars: [{ ...baseBar, close: 120 }] },
        { symbol: 'PENNY', bars: [{ ...baseBar, close: 10 }] }
      ];

      const results = runScreener(rules, universe);
      expect(results['rule1']).toEqual(['AAPL', 'MSFT']);
      expect(results['rule2']).toEqual(['PENNY']);
    });
  });

  describe('runHistoricalScan & summarizeScan', () => {
    it('calculates correct forward returns', () => {
      const bars: PriceBar[] = [];
      // Let's create a 30-day sequence
      for (let i = 0; i < 30; i++) {
        // Base price 100.
        // We'll set a trigger at index 5. Price at 5 is 100.
        // Price at 10 (day 5) is 105 (5% return)
        // Price at 15 (day 10) is 110 (10% return)
        // Price at 25 (day 20) is 90 (-10% return)
        let close = 100;
        if (i === 10) close = 105;
        if (i === 15) close = 110;
        if (i === 25) close = 90;

        bars.push({
          ...baseBar,
          date: `2020-01-${(i + 1).toString().padStart(2, '0')}`,
          close
        });
      }

      // Rule fires exactly at index 5
      const mockRule = (b: PriceBar[], idx: number) => idx === 5;

      const triggers = runHistoricalScan(mockRule, bars);
      expect(triggers.length).toBe(1);
      
      const t = triggers[0];
      expect(t.forwardReturns.day5).toBeCloseTo(0.05);
      expect(t.forwardReturns.day10).toBeCloseTo(0.10);
      expect(t.forwardReturns.day20).toBeCloseTo(-0.10);

      const summary = summarizeScan(triggers);
      expect(summary.signalCount).toBe(1);
      expect(summary.winRate).toBe(100);
      expect(summary.averageForwardReturns.day5).toBeCloseTo(0.05);
      expect(summary.averageForwardReturns.day10).toBeCloseTo(0.10);
      expect(summary.averageForwardReturns.day20).toBeCloseTo(-0.10);
    });

    it('handles lack of future bars gracefully', () => {
      const bars: PriceBar[] = [];
      for (let i = 0; i < 10; i++) {
        bars.push({ ...baseBar, close: 100 });
      }

      // Fire at index 8 (only 1 bar left)
      const mockRule = (b: PriceBar[], idx: number) => idx === 8;

      const triggers = runHistoricalScan(mockRule, bars);
      expect(triggers.length).toBe(1);
      const t = triggers[0];
      
      expect(t.forwardReturns.day5).toBeNull();
      expect(t.forwardReturns.day10).toBeNull();
      expect(t.forwardReturns.day20).toBeNull();

      const summary = summarizeScan(triggers);
      expect(summary.signalCount).toBe(1);
      expect(summary.winRate).toBe(0);
      expect(summary.averageForwardReturns.day5).toBeNull();
      expect(summary.averageForwardReturns.day10).toBeNull();
    });
  });
});
