import { PriceBar } from '@/lib/types';
import { scanEpisodicPivots, scanHighTightFlags } from '@/features/scanner/algorithms/qullamaggie';

// Helper function to create dummy price bars
function createDummyBars(count: number, basePrice: number = 10, baseVolume: number = 100): PriceBar[] {
  const bars: PriceBar[] = [];
  for (let i = 0; i < count; i++) {
    bars.push({
      date: `2024-01-${String((i % 31) + 1).padStart(2, '0')}`,
      open: basePrice,
      high: basePrice * 1.05,
      low: basePrice * 0.95,
      close: basePrice,
      volume: baseVolume,
    });
  }
  return bars;
}

describe('Qullamaggie Algorithms', () => {
  describe('scanEpisodicPivots', () => {
    it('should identify an Episodic Pivot when volume surges >300% and price gaps up >4%', () => {
      // 50 bars of normal volume (100) and price (10)
      const bars = createDummyBars(51, 10, 100);
      
      // Modify the 51st bar (index 50) to be an EP
      bars[50] = {
        date: '2024-03-01',
        open: 11, // gap up from prev close 10
        close: 12, // strong green candle > 11
        high: 12.5,
        low: 10.5,
        volume: 400, // > 300% of 100 avg
      };

      const matches = scanEpisodicPivots(bars);
      
      expect(matches.length).toBe(1);
      expect(matches[0].type).toBe('EPISODIC_PIVOT');
      expect(matches[0].date).toBe('2024-03-01');
      expect(matches[0].price).toBe(10.5);
      expect(matches[0].text).toContain('EP (+20.0%');
      expect(matches[0].text).toContain('4.0x Vol');
    });

    it('should not identify EP if volume surge is exactly 300% or less', () => {
      const bars = createDummyBars(51, 10, 100);
      bars[50].open = 11;
      bars[50].close = 12;
      bars[50].volume = 300; // Not > 300%
      
      const matches = scanEpisodicPivots(bars);
      expect(matches.length).toBe(0);
    });

    it('should not identify EP if price move is 4% or less', () => {
      const bars = createDummyBars(51, 10, 100);
      // Previous close is 10
      bars[50].open = 10.1;
      bars[50].close = 10.4; // Move is exactly 4% (0.04)
      bars[50].volume = 400; 
      
      const matches = scanEpisodicPivots(bars);
      expect(matches.length).toBe(0);
    });

    it('should not identify EP if current close is not greater than open (red candle/doji)', () => {
      const bars = createDummyBars(51, 10, 100);
      bars[50].open = 12;
      bars[50].close = 11; // Price gap up, but closed lower than open
      bars[50].volume = 400;
      
      const matches = scanEpisodicPivots(bars);
      expect(matches.length).toBe(0);
    });

    it('should return empty array if less than 50 bars provided', () => {
      const bars = createDummyBars(49, 10, 100);
      const matches = scanEpisodicPivots(bars);
      expect(matches.length).toBe(0);
    });
  });

  describe('scanHighTightFlags', () => {
    it('should identify a High Tight Flag when move >90% and drawdown <20% with volume breakout', () => {
      const bars = createDummyBars(41, 10, 100);
      
      // Setup the 40-bar window (index 0 to 39)
      bars[0].low = 10;
      bars[20].high = 20; // Move is (20 - 10) / 10 = 1.0 (100% > 90%)
      
      bars[39].high = 18;
      bars[39].volume = 100;

      // Setup the breakout bar (index 40)
      bars[40] = {
        date: '2024-03-01',
        open: 18.5,
        close: 19.5, // > prevBar.high (18)
        high: 19.8,
        low: 18.2,
        volume: 200, // > prevBar.volume
      };
      
      // Drawdown is (20 - 19.5) / 20 = 0.025 (2.5% < 20%)
      
      const matches = scanHighTightFlags(bars);
      
      expect(matches.length).toBe(1);
      expect(matches[0].type).toBe('HIGH_TIGHT_FLAG');
      expect(matches[0].date).toBe('2024-03-01');
      expect(matches[0].price).toBe(18.2);
      expect(matches[0].text).toBe('HTF Breakout');
    });

    it('should not identify HTF if move is 90% or less', () => {
      const bars = createDummyBars(41, 10, 100);
      bars[0].low = 10;
      bars[20].high = 19; // Move is 90%
      bars[39].high = 17;
      
      bars[40].close = 18;
      bars[40].volume = 200;
      
      const matches = scanHighTightFlags(bars);
      expect(matches.length).toBe(0);
    });

    it('should not identify HTF if drawdown is 20% or greater', () => {
      const bars = createDummyBars(41, 10, 100);
      bars[0].low = 10;
      bars[20].high = 20; // Move is 100%
      bars[39].high = 16;
      
      // Drawdown is (20 - 16) / 20 = 0.2 (20%)
      bars[40].close = 16;
      bars[40].volume = 200;
      
      const matches = scanHighTightFlags(bars);
      expect(matches.length).toBe(0);
    });

    it('should not identify HTF if not breaking out of consolidation (close <= prev high)', () => {
      const bars = createDummyBars(41, 10, 100);
      bars[0].low = 10;
      bars[20].high = 20; 
      bars[39].high = 18;
      
      bars[40].close = 17.5; // close < prevBar.high
      bars[40].volume = 200; 
      
      const matches = scanHighTightFlags(bars);
      expect(matches.length).toBe(0);
    });

    it('should not identify HTF if volume is not greater than prev volume', () => {
      const bars = createDummyBars(41, 10, 100);
      bars[0].low = 10;
      bars[20].high = 20; 
      bars[39].high = 18;
      bars[39].volume = 100;
      
      bars[40].close = 18.5; // Breaking out price-wise
      bars[40].volume = 100; // Volume not greater than prev
      
      const matches = scanHighTightFlags(bars);
      expect(matches.length).toBe(0);
    });

    it('should return empty array if less than 40 bars provided', () => {
      const bars = createDummyBars(39, 10, 100);
      const matches = scanHighTightFlags(bars);
      expect(matches.length).toBe(0);
    });
  });
});
