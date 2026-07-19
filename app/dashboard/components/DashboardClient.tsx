'use client';

import React, { useState } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ChartGrid } from "@/components/ChartGrid";
import { MiniChart } from "@/features/charts/components/MiniChart";
import { PriceChart } from "@/features/charts/components/PriceChart";
import { PriceBar, EMAConfig, GridColumns } from '@/lib/types';

interface ChartData {
  symbol: string;
  bars: PriceBar[];
}

interface DashboardClientProps {
  charts: ChartData[];
  ledger: React.ReactNode;
}

export function DashboardClient({ charts, ledger }: DashboardClientProps) {
  const [activeSymbol, setActiveSymbol] = useState<string>(charts[0]?.symbol || '');
  const [gridColumns, setGridColumns] = useState<GridColumns>(4);
  const [emas, setEmas] = useState<EMAConfig[]>([
    { period: 9, color: '#f59e0b', enabled: false },
    { period: 20, color: '#3b82f6', enabled: true },
    { period: 50, color: '#8b5cf6', enabled: true },
    { period: 100, color: '#ec4899', enabled: false },
    { period: 200, color: '#14b8a6', enabled: false },
  ]);
  const [timeframe, setTimeframe] = useState<'1D' | '1W'>('1D');

  const toggleEma = (period: number) => {
    setEmas(prev => prev.map(e => e.period === period ? { ...e, enabled: !e.enabled } : e));
  };

  const activeData = charts.find(c => c.symbol === activeSymbol) || { symbol: '', bars: [] };

  // Filter out the active symbol from the mini grid so there are no duplicates
  const miniGridItems = charts.filter(c => c.symbol !== activeSymbol);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-paper font-sans">
      {/* @ts-expect-error direction prop is not matching react-resizable-panels type definition */}
      <ResizablePanelGroup direction="horizontal" className="h-[60%] min-h-[400px]">
        {/* Main Chart Panel */}
        <ResizablePanel defaultSize={70} minSize={30}>
          <div className="flex flex-col h-full border-b border-r border-hairline relative">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-2 bg-surface border-b border-hairline shrink-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex bg-paper border border-hairline rounded-lg p-1 shadow-inner">
                  <button 
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${timeframe === '1D' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink'}`}
                    onClick={() => setTimeframe('1D')}
                  >
                    1D
                  </button>
                  <button 
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-colors ${timeframe === '1W' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink'}`}
                    onClick={() => setTimeframe('1W')}
                  >
                    1W
                  </button>
                </div>

                <div className="hidden sm:block h-6 w-px bg-hairline" />

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-ink-light uppercase tracking-wider px-1">EMAs</span>
                  {emas.map(ema => (
                    <button
                      key={ema.period}
                      onClick={() => toggleEma(ema.period)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-colors border ${
                        ema.enabled 
                          ? 'border-hairline shadow-sm bg-surface text-ink' 
                          : 'border-transparent text-ink-light hover:bg-surface/50'
                      }`}
                      style={{ borderColor: ema.enabled ? ema.color : 'transparent' }}
                    >
                      {ema.period}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Chart */}
            <div className="flex-1 overflow-hidden p-2 bg-surface">
              {activeSymbol ? (
                <PriceChart 
                  symbol={activeSymbol}
                  bars={activeData.bars}
                  timeframe={timeframe}
                  emas={emas}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-ink-light bg-surface border-2 border-dashed border-hairline m-2 rounded-xl">
                  Select a symbol from your watchlist
                </div>
              )}
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="bg-hairline w-1.5 hover:bg-primary/50 transition-colors" />

        {/* Ledger Panel */}
        <ResizablePanel defaultSize={30} minSize={20}>
          <div className="h-full overflow-hidden border-b border-hairline bg-paper">
            {ledger}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mini Chart Grid Bottom Section */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-surface/30">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold font-display text-ink tracking-tight">Watchlist Overview</h2>
        </div>
        <ChartGrid 
          items={miniGridItems}
          columns={gridColumns}
          onColumnsChange={setGridColumns}
          total={charts.length}
          renderCard={(item) => (
            <MiniChart 
              symbol={item.symbol}
              bars={item.bars}
              loading={false}
              error={false}
              onClick={() => setActiveSymbol(item.symbol)}
            />
          )}
        />
      </div>
    </div>
  );
}
