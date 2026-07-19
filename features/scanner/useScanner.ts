import { useState, useEffect } from 'react';
import { PriceBar, ScannerMatch } from '@/lib/types';
import { useMarketDataStore } from '@/lib/store/useMarketDataStore';

export type ScannerStage = 'IDLE' | 'FETCHING_DATA' | 'RUNNING_ALGOS' | 'PLOTTING';

export function useScanner(symbol: string, initialBars: PriceBar[]) {
  const [stage, setStage] = useState<ScannerStage>('IDLE');
  const [chartMarkers, setChartMarkers] = useState<ScannerMatch[]>([]);
  const setCandles = useMarketDataStore(state => state.setCandles);

  useEffect(() => {
    if (!initialBars || initialBars.length === 0) {
      setStage('IDLE');
      return;
    }

    setCandles(symbol, initialBars);
    let isMounted = true;
    
    const runPipeline = async () => {
      setStage('FETCHING_DATA');
      await new Promise(r => setTimeout(r, 400));
      if (!isMounted) return;

      setStage('RUNNING_ALGOS');
      try {
        const res = await fetch(`/api/scanner?symbol=${symbol}&rule=ema_stack`);
        const data = await res.json();
        if (data.chartMarkers && isMounted) {
          setChartMarkers(data.chartMarkers);
        }
      } catch (e) {
        console.error("Scanner fetch failed", e);
      }
      
      if (!isMounted) return;
      setStage('PLOTTING');
    };

    runPipeline();

    return () => {
      isMounted = false;
    };
  }, [symbol, initialBars, setCandles]);

  return { stage, chartMarkers };
}
