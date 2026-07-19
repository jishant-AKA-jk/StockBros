'use client';
import { useState } from 'react';
import { PriceChart } from './PriceChart';
import { resampleDailyToWeekly } from '../utils';
import { PriceBar } from '@/lib/types';

interface ChartData {
  symbol: string;
  bars: PriceBar[];
}

interface ChartGridProps {
  charts: ChartData[];
}

export function ChartGrid({ charts }: ChartGridProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '1W'>('1D');
  const [ema, setEma] = useState<'off' | 10 | 20>('off');

  return (
    <div className="flex flex-col gap-6 w-full h-full overflow-y-auto p-4 md:p-6 page-reveal">
      {/* Global Control Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface border border-hairline p-4 rounded-xl shadow-card gap-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-ink tracking-tight font-display">Market Overview</h2>
          <p className="text-xs text-ink-light mt-1 max-w-md font-sans">
            EOD swing trading analytics (not live-trading or investment advice).
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex bg-paper border border-hairline rounded-lg p-1 shadow-inner">
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${timeframe === '1D' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink hover:bg-surface/50'}`}
              onClick={() => setTimeframe('1D')}
            >
              Daily
            </button>
            <button 
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${timeframe === '1W' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink hover:bg-surface/50'}`}
              onClick={() => setTimeframe('1W')}
            >
              Weekly
            </button>
          </div>
          
          <div className="flex bg-paper border border-hairline rounded-lg p-1 items-center gap-1 shadow-inner">
            <span className="text-xs font-semibold text-ink-light uppercase tracking-wider px-2">EMA</span>
            <button 
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${ema === 'off' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink hover:bg-surface/50'}`}
              onClick={() => setEma('off')}
            >
              Off
            </button>
            <button 
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${ema === 10 ? 'bg-surface border border-primary text-primary shadow-sm' : 'text-ink-light hover:text-primary hover:bg-surface/50'}`}
              onClick={() => setEma(10)}
            >
              10
            </button>
            <button 
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${ema === 20 ? 'bg-surface border border-signature text-signature shadow-sm' : 'text-ink-light hover:text-signature hover:bg-surface/50'}`}
              onClick={() => setEma(20)}
            >
              20
            </button>
          </div>
        </div>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {charts.map((chart) => {
          const displayBars = timeframe === '1W' ? resampleDailyToWeekly(chart.bars) : chart.bars;
          return (
            <PriceChart 
              key={chart.symbol}
              symbol={chart.symbol}
              bars={displayBars}
              timeframe={timeframe}
              showEma={ema}
            />
          );
        })}
      </div>
    </div>
  );
}
