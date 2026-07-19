'use client';

import { useState, useMemo, useEffect } from 'react';
import { PriceChart } from '@/features/charts/components/PriceChart';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PriceBar, EMAConfig, ChartAnnotation } from '@/lib/types';
import { 
  emaStack, 
  tightConsolidation, 
  volumeSurge, 
  near52WeekHigh,
  runHistoricalScan
} from '@/features/screener';
import { useScanner } from '@/features/scanner/useScanner';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

interface ScannerClientProps {
  symbol: string;
  initialBars: PriceBar[];
}

export function ScannerClient({ symbol, initialBars }: ScannerClientProps) {
  const [adding, setAdding] = useState(false);
  const [timeframe, setTimeframe] = useState<'1D' | '1W'>('1D');
  const { stage, chartMarkers } = useScanner(symbol, initialBars);
  const [activeScan, setActiveScan] = useState<'emaStack' | 'tightConsolidation' | 'volumeSurge' | 'near52WeekHigh' | null>(null);
  
  const [emas, setEmas] = useState<EMAConfig[]>([
    { period: 10, color: '#f59e0b', enabled: true },
    { period: 20, color: '#3b82f6', enabled: true },
    { period: 50, color: '#8b5cf6', enabled: true },
    { period: 100, color: '#ec4899', enabled: false },
    { period: 200, color: '#14b8a6', enabled: true },
  ]);

  // When a scan is selected, automatically toggle necessary chart elements
  useEffect(() => {
    if (activeScan === 'emaStack') {
      setEmas(prev => prev.map(e => 
        (e.period === 10 || e.period === 20) ? { ...e, enabled: true } : e
      ));
    }
  }, [activeScan]);

  const toggleEma = (period: number) => {
    setEmas(prev => prev.map(e => e.period === period ? { ...e, enabled: !e.enabled } : e));
  };

  const handleAdd = async () => {
    setAdding(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, tag: 'scanner_discovery' }),
      });
      if (!res.ok) {
        throw new Error('Failed to add');
      }
      toast.success(`${symbol} added to watchlist!`);
    } catch (e: any) {
      toast.error(e.message || 'Unknown error');
    } finally {
      setAdding(false);
    }
  };

  // Compute Quick Stats
  let currentPrice = 0;
  let high52w = 0;
  let avgVolume20d = 0;
  
  // Compute Matches
  let matches = {
    emaStack: false,
    tightConsolidation: false,
    volumeSurge: false,
    near52WeekHigh: false,
  };

  if (initialBars && initialBars.length > 0) {
    const lastIdx = initialBars.length - 1;
    currentPrice = initialBars[lastIdx].close;
    
    // 52w High (last 252 bars)
    const lookback = Math.max(0, initialBars.length - 252);
    for (let i = lookback; i <= lastIdx; i++) {
      if (initialBars[i].high > high52w) {
        high52w = initialBars[i].high;
      }
    }
    
    // Avg Vol 20d
    let sumVol = 0;
    let volCount = 0;
    for (let i = Math.max(0, initialBars.length - 20); i <= lastIdx; i++) {
      sumVol += initialBars[i].volume;
      volCount++;
    }
    avgVolume20d = volCount > 0 ? sumVol / volCount : 0;

    // Scan Details
    try { matches.emaStack = emaStack(initialBars, lastIdx); } catch(e) {}
    try { matches.tightConsolidation = tightConsolidation(initialBars, lastIdx); } catch(e) {}
    try { matches.volumeSurge = volumeSurge(initialBars, lastIdx); } catch(e) {}
    try { matches.near52WeekHigh = near52WeekHigh(initialBars, lastIdx); } catch(e) {}
  }

  // Dynamically generate annotations based on active scan
  const dynamicAnnotations = useMemo(() => {
    if (!activeScan || !initialBars || initialBars.length === 0) return [];
    
    let triggers = [];
    let label = '';
    let color = '';

    if (activeScan === 'emaStack') {
      triggers = runHistoricalScan(emaStack, initialBars);
      label = '10 > 20 EMA';
      color = '#3b82f6';
    } else if (activeScan === 'tightConsolidation') {
      triggers = runHistoricalScan(tightConsolidation as any, initialBars);
      label = 'Tight Consolidation';
      color = '#14b8a6';
    } else if (activeScan === 'volumeSurge') {
      triggers = runHistoricalScan(volumeSurge as any, initialBars);
      label = 'Vol Surge';
      color = '#ec4899';
    } else if (activeScan === 'near52WeekHigh') {
      triggers = runHistoricalScan(near52WeekHigh as any, initialBars);
      label = 'Near 52W High';
      color = '#8b5cf6';
    }

    return triggers.map(t => ({
      date: t.date,
      label,
      type: 'entry' as const,
      color,
    }));
  }, [activeScan, initialBars]);

  // Combine algorithmic chartMarkers with interactive dynamic annotations
  const mappedAnnotations: ChartAnnotation[] = useMemo(() => {
    // If a user selects a scanner rule, show THAT rule's historical markers.
    // Otherwise, default to the Qullamaggie algo markers.
    if (activeScan) return dynamicAnnotations;

    return chartMarkers ? chartMarkers.map(m => ({
      date: m.date,
      label: m.text,
      type: 'entry' as const,
      color: m.type === 'EPISODIC_PIVOT' ? '#8b5cf6' : '#ec4899',
    })) : [];
  }, [activeScan, dynamicAnnotations, chartMarkers]);

  const formatNumber = (num: number) => {
    if (num >= 1e7) return (num / 1e7).toFixed(2) + 'Cr';
    if (num >= 1e5) return (num / 1e5).toFixed(2) + 'L';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-paper font-sans">
      
      {/* Main Chart Area (75%) */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r border-hairline">
        
        {/* Header Toolbar */}
        <div className="flex items-center justify-between p-4 bg-surface border-b border-hairline shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold font-display text-ink tracking-tight mr-2">{symbol}</h1>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const search = fd.get('search');
                if (search) {
                  window.location.href = `/scanner?symbol=${search}`;
                }
              }}
              className="flex items-center"
            >
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-2.5 top-2 h-4 w-4 text-ink-light" />
                <input 
                  type="text" 
                  name="search" 
                  placeholder="Search symbol..." 
                  className="h-8 w-32 md:w-48 pl-8 pr-3 rounded-md border border-hairline bg-paper text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-hidden transition-all"
                />
              </div>
            </form>

            <div className="h-6 w-px bg-hairline hidden md:block" />
            
            <div className="hidden md:flex bg-paper border border-hairline rounded-lg p-1 shadow-inner">
              <button 
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${timeframe === '1D' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink'}`}
                onClick={() => setTimeframe('1D')}
              >
                1D
              </button>
              <button 
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${timeframe === '1W' ? 'bg-surface border border-hairline text-ink shadow-sm' : 'text-ink-light hover:text-ink'}`}
                onClick={() => setTimeframe('1W')}
              >
                1W
              </button>
            </div>

            <div className="hidden md:flex items-center gap-2">
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
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={handleAdd} 
                  disabled={adding}
                  size="icon"
                  variant="outline"
                  className="bg-surface hover:bg-surface-hover border-hairline text-ink rounded-full shrink-0 shadow-sm transition-all"
                >
                  {adding ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PlusIcon className="w-5 h-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add {symbol} to Watchlist</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Chart View */}
        <div className="flex-1 p-2 bg-surface relative">
          <style>{`
            @keyframes scan-line {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
            .animate-scan-line {
              position: absolute;
              left: 0;
              right: 0;
              height: 2px;
              background: #3b82f6;
              box-shadow: 0 0 15px 2px rgba(59, 130, 246, 0.6);
              animation: scan-line 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              z-index: 50;
            }
            .animate-scan-bg {
              position: absolute;
              left: 0;
              right: 0;
              height: 120px;
              background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.1) 80%, rgba(59, 130, 246, 0.4));
              animation: scan-line 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
              transform: translateY(-100%);
              z-index: 49;
            }
          `}</style>
          
          {stage === 'IDLE' && (
            <div className="flex flex-col items-center justify-center h-full text-ink-light border-2 border-dashed border-hairline m-2 rounded-xl bg-surface/50">
              <svg className="w-12 h-12 mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-semibold text-ink">No Data Found</p>
              <p className="text-sm mt-1">Could not load historical data for {symbol}.</p>
            </div>
          )}

          {(stage === 'FETCHING_DATA' || stage === 'RUNNING_ALGOS') && (
            <div className="relative h-full w-full border border-hairline rounded-xl bg-paper overflow-hidden flex flex-col p-4 gap-4 m-0 shadow-inner">
               <div className="flex justify-between items-center z-10">
                 <Skeleton className="h-8 w-48 bg-surface-hover" />
                 <Skeleton className="h-8 w-24 bg-surface-hover" />
               </div>
               <div className="flex-1 flex items-end gap-1.5 z-10 px-2 opacity-50">
                 {Array.from({ length: 50 }).map((_, i) => {
                   const h = 20 + Math.abs(Math.sin(i * 0.2) * 50) + Math.random() * 30;
                   return (
                     <Skeleton key={i} className="flex-1 bg-ink-light/20 rounded-t-sm" style={{ height: `${h}%` }} />
                   );
                 })}
               </div>
               
               {stage === 'RUNNING_ALGOS' && (
                 <div className="absolute inset-0 pointer-events-none overflow-hidden">
                   <div className="animate-scan-bg" />
                   <div className="animate-scan-line" />
                 </div>
               )}
            </div>
          )}

          {stage === 'PLOTTING' && initialBars && initialBars.length > 0 && (
            <div className="h-full w-full animate-in fade-in duration-700">
              <PriceChart 
                symbol={symbol}
                bars={initialBars}
                timeframe={timeframe}
                emas={emas}
                annotations={mappedAnnotations}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar (25%) */}
      <div className="w-full md:w-80 lg:w-96 flex flex-col h-full bg-surface/50 overflow-y-auto shrink-0">
        
        {/* Quick Stats */}
        <div className="p-6 border-b border-hairline bg-paper">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-sm font-medium text-ink-light">Current Price</span>
              <span className="text-xl font-bold text-ink font-mono">${currentPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-sm font-medium text-ink-light">52-Week High</span>
              <span className="text-lg font-semibold text-ink font-mono">${high52w.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end border-b border-hairline pb-2">
              <span className="text-sm font-medium text-ink-light">Avg Vol (20D)</span>
              <span className="text-lg font-semibold text-ink font-mono">{formatNumber(avgVolume20d)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium text-ink-light">% from 52w High</span>
              <span className={`text-lg font-semibold font-mono ${currentPrice >= high52w ? 'text-data-up' : 'text-data-down'}`}>
                {high52w > 0 ? (((currentPrice - high52w) / high52w) * 100).toFixed(2) + '%' : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Scan Details */}
        <div className="p-6 flex-1 bg-surface/30">
          <h2 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-4 flex items-center justify-between">
            <span>Scan Matches</span>
            {activeScan && (
              <button 
                onClick={() => setActiveScan(null)}
                className="text-[10px] text-primary hover:underline lowercase"
              >
                Clear Selection
              </button>
            )}
          </h2>
          <p className="text-xs text-ink-light mb-4">Select a pattern below to instantly highlight it on the chart.</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => setActiveScan(activeScan === 'emaStack' ? null : 'emaStack')}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                activeScan === 'emaStack' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(59,130,246,0.3)] text-primary ring-1 ring-primary' : 
                matches.emaStack ? 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10' : 
                'bg-paper border-hairline text-ink-light hover:bg-surface'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">EMA Stack (10 {'>'} 20)</span>
                {matches.emaStack && <span className={`w-2 h-2 rounded-full ${activeScan === 'emaStack' ? 'bg-primary animate-pulse' : 'bg-primary'}`} />}
              </div>
            </button>
            
            <button 
              onClick={() => setActiveScan(activeScan === 'tightConsolidation' ? null : 'tightConsolidation')}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                activeScan === 'tightConsolidation' ? 'bg-signature/20 border-signature shadow-[0_0_15px_rgba(20,184,166,0.3)] text-signature ring-1 ring-signature' : 
                matches.tightConsolidation ? 'bg-signature/5 border-signature/30 text-signature hover:bg-signature/10' : 
                'bg-paper border-hairline text-ink-light hover:bg-surface'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Tight Consolidation</span>
                {matches.tightConsolidation && <span className={`w-2 h-2 rounded-full ${activeScan === 'tightConsolidation' ? 'bg-signature animate-pulse' : 'bg-signature'}`} />}
              </div>
            </button>
            
            <button 
              onClick={() => setActiveScan(activeScan === 'volumeSurge' ? null : 'volumeSurge')}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                activeScan === 'volumeSurge' ? 'bg-data-up/20 border-data-up shadow-[0_0_15px_rgba(236,72,153,0.3)] text-data-up ring-1 ring-data-up' : 
                matches.volumeSurge ? 'bg-data-up/5 border-data-up/30 text-data-up hover:bg-data-up/10' : 
                'bg-paper border-hairline text-ink-light hover:bg-surface'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Volume Surge (1.5x)</span>
                {matches.volumeSurge && <span className={`w-2 h-2 rounded-full ${activeScan === 'volumeSurge' ? 'bg-data-up animate-pulse' : 'bg-data-up'}`} />}
              </div>
            </button>

            <button 
              onClick={() => setActiveScan(activeScan === 'near52WeekHigh' ? null : 'near52WeekHigh')}
              className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                activeScan === 'near52WeekHigh' ? 'bg-primary/20 border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] text-primary ring-1 ring-primary' : 
                matches.near52WeekHigh ? 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10' : 
                'bg-paper border-hairline text-ink-light hover:bg-surface'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm">Near 52W High (within 5%)</span>
                {matches.near52WeekHigh && <span className={`w-2 h-2 rounded-full ${activeScan === 'near52WeekHigh' ? 'bg-primary animate-pulse' : 'bg-primary'}`} />}
              </div>
            </button>
          </div>
          
          <p className="text-xs text-ink-light mt-6 italic">
            Signals are computed locally against the latest end-of-day market close.
          </p>
        </div>

      </div>
    </div>
  );
}
