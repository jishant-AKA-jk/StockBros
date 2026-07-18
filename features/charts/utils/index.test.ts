import { PriceBar } from '@/lib/types';
import { resampleDailyToWeekly, calculateEma } from './index';

// PROTECTS AGAINST: Regressions in the daily->weekly chart resampling logic,
// ensuring users always see accurate weekly OHLC and volume rollups.
describe('resampleDailyToWeekly', () => {
  it('should return empty array when provided empty array', () => {
    expect(resampleDailyToWeekly([])).toEqual([]);
  });

  it('should correctly resample daily bars into weekly bars', () => {
    const dailyBars: PriceBar[] = [
      { date: '2023-01-02', open: 100, high: 110, low: 90, close: 105, volume: 1000 },
      { date: '2023-01-03', open: 105, high: 115, low: 100, close: 110, volume: 1500 },
      { date: '2023-01-04', open: 110, high: 120, low: 105, close: 115, volume: 1200 },
      { date: '2023-01-05', open: 115, high: 125, low: 110, close: 120, volume: 1800 },
      { date: '2023-01-06', open: 120, high: 130, low: 115, close: 125, volume: 2000 },
      { date: '2023-01-09', open: 125, high: 135, low: 120, close: 130, volume: 1000 },
    ];
    const weeklyBars = resampleDailyToWeekly(dailyBars);
    expect(weeklyBars.length).toBe(2);
    expect(weeklyBars[0].date).toBe('2023-01-02');
    expect(weeklyBars[0].open).toBe(100);
    expect(weeklyBars[0].high).toBe(130);
    expect(weeklyBars[0].low).toBe(90);
    expect(weeklyBars[0].close).toBe(125);
    expect(weeklyBars[0].volume).toBe(7500);
    expect(weeklyBars[1].date).toBe('2023-01-09');
  });
});
