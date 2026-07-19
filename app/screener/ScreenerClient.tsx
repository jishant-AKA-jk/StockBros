'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MiniChart } from '@/features/charts/components';
import { ChartGrid } from '@/components/ChartGrid';
import { PriceBar, GridColumns } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface UniverseItem {
  symbol: string;
  bars: PriceBar[];
}

interface ScreenerClientProps {
  results: Record<string, string[]>;
  universe: UniverseItem[];
  lastCloseDate: string;
}

export function ScreenerClient({ results, universe, lastCloseDate }: ScreenerClientProps) {
  const safeResults = results || {};
  const safeUniverse = universe || [];
  const ruleIds = Object.keys(safeResults);
  const [activeRules, setActiveRules] = useState<string[]>([ruleIds[0] || '']);
  const [gridColumns, setGridColumns] = useState<GridColumns>(4);
  const [adding, setAdding] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(12);

  const handleAdd = async (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation(); // Prevent chart click
    setAdding(symbol);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, tag: activeRules.join(',') }),
      });
      if (!res.ok) {
        throw new Error('Failed to add');
      }
      toast.success(`${symbol} added to watchlist!`);
    } catch (e: any) {
      toast.error(e.message || 'Unknown error');
    } finally {
      setAdding(null);
    }
  };

  const toggleRule = (rule: string) => {
    setActiveRules([rule]);
    setDisplayCount(12);
  };

  const activeSymbols = (activeRules || []).length > 0
    ? activeRules.reduce((acc, rule) => acc.filter(sym => (safeResults[rule] || []).includes(sym)), safeResults[activeRules[0]] || [])
    : [];

  const gridItems = (activeSymbols || []).slice(0, displayCount).map(sym => {
    const data = safeUniverse.find(u => u.symbol === sym);
    return data || { symbol: sym, bars: [] };
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full bg-paper font-sans overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-hairline p-4 md:p-6 bg-surface shrink-0 z-10 shadow-sm">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink tracking-tight font-display">Screener</h1>
          <p className="text-ink-light mt-1 text-sm md:text-base">Filter the market for high-probability swing setups.</p>
        </div>
        <div className="mt-4 md:mt-0 text-left md:text-right">
          <span className="inline-block text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-md mb-2">
            Data as of last close: {formatDate(lastCloseDate)}
          </span>
          <p className="text-[10px] text-ink-light max-w-[200px] ml-auto">
            * Based on end-of-day daily charts.
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {ruleIds.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface border-2 border-dashed border-hairline rounded-2xl m-6 shadow-sm text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-ink mb-2 font-display">No Screener Data</h2>
            <p className="text-ink-light max-w-md">
              We couldn't load the screening results or your data source returned empty. Please check your connection or try again later.
            </p>
          </div>
        ) : (
          <>
        {/* Left Sidebar: Rules */}
        <div className="w-64 border-r border-hairline bg-surface/50 overflow-y-auto shrink-0 flex flex-col p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-4">Scan Strategies</h3>
          <div className="space-y-2">
            {(ruleIds || []).map(rule => {
              const isActive = (activeRules || []).includes(rule);
              return (
                <button
                  key={rule}
                  onClick={() => toggleRule(rule)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all border",
                    isActive
                      ? "bg-primary/10 border-primary/30 text-primary shadow-sm" 
                      : "bg-paper border-transparent text-ink-light hover:bg-surface hover:text-ink"
                  )}
                >
                  <span className="font-semibold text-sm flex items-center gap-2">
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    {rule.replace(/_/g, ' ')}
                  </span>
                  <span className={cn(
                    "text-xs font-mono px-2 py-0.5 rounded-full border",
                    isActive ? "bg-primary/20 border-primary/30" : "bg-surface border-hairline"
                  )}>
                    {(safeResults[rule] || []).length}
                  </span>
                </button>
              )
            })}
          </div>
          
          <div className="mt-8 pt-4 border-t border-hairline">
             <Button className="w-full bg-primary hover:bg-primary-hover text-white shadow-sm font-semibold">
                Run Screener
             </Button>
          </div>
        </div>

        {/* Main Content: Chart Grid */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-surface/20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-ink capitalize font-display flex items-center gap-2">
              {(activeRules || []).length > 1 ? 'Combined Strategy' : (activeRules || [])[0]?.replace(/_/g, ' ')} Matches
              <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full font-mono ml-2">
                {(activeSymbols || []).length}
              </span>
            </h2>
          </div>

          {(!activeSymbols || activeSymbols.length === 0) ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-hairline rounded-xl bg-surface/50 text-ink-light shadow-inner">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="font-semibold text-ink">No symbols matched this criteria.</p>
              <p className="text-sm mt-1">Try another strategy or expand your universe.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <ChartGrid 
                items={gridItems}
                columns={gridColumns}
                onColumnsChange={setGridColumns}
                total={activeSymbols?.length || 0}
                renderCard={(item) => (
                  <div className="relative group/card">
                    <MiniChart 
                      symbol={item.symbol}
                      bars={item.bars}
                      loading={false}
                      error={false}
                    />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-end opacity-0 group-hover/card:opacity-100 transition-opacity">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        className="text-xs shadow-md border border-hairline bg-paper hover:bg-surface text-ink"
                        disabled={adding === item.symbol}
                        onClick={(e) => handleAdd(e, item.symbol)}
                      >
                        {adding === item.symbol ? 'Adding...' : '+ Watchlist'}
                      </Button>
                    </div>
                  </div>
                )}
              />
              {displayCount < (activeSymbols?.length || 0) && (
                <div className="flex justify-center pb-8">
                  <Button 
                    onClick={() => setDisplayCount(prev => prev + 12)}
                    variant="outline"
                    className="bg-paper hover:bg-surface text-ink border-hairline"
                  >
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
