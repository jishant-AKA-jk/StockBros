'use client';
import { useEffect, useRef, useState, memo, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';
import { PriceBar } from '@/lib/types';
import { calculateEma, resampleDailyToWeekly } from '../utils';

interface PriceChartProps {
  bars: PriceBar[];
  timeframe: '1D' | '1W';
  showEma: 'off' | 10 | 20;
  markers?: any[];
  symbol: string;
}

export const PriceChart = memo(function PriceChart({ bars, timeframe, showEma, markers = [], symbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // Decoupled states for smooth cross-fade
  const [displayBars, setDisplayBars] = useState<PriceBar[]>(bars);
  const [displayTimeframe, setDisplayTimeframe] = useState<'1D' | '1W'>(timeframe);
  const [displayShowEma, setDisplayShowEma] = useState<'off' | 10 | 20>(showEma);
  const [displayMarkers, setDisplayMarkers] = useState<any[]>(markers);
  const [isFading, setIsFading] = useState(false);

  // Date formatter for last close date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const asOfDate = displayBars.length > 0 ? formatDate(displayBars[displayBars.length - 1].date) : 'N/A';

  // Synchronize props to display states with animation delay
  useEffect(() => {
    const hasChanged = timeframe !== displayTimeframe || showEma !== displayShowEma;
    if (hasChanged) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setDisplayBars(bars);
        setDisplayTimeframe(timeframe);
        setDisplayShowEma(showEma);
        setDisplayMarkers(markers);
        setIsFading(false);
      }, 180);
      return () => clearTimeout(timer);
    } else {
      // Direct updates when timeframe/EMA do not change (initial load or update of bars/markers)
      setDisplayBars(bars);
      setDisplayMarkers(markers);
    }
  }, [bars, timeframe, showEma, markers, displayTimeframe, displayShowEma]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#2c2c2a', // text-ink-light approx
      },
      grid: {
        vertLines: { color: '#e5e0d8' }, // hairline approx
        horzLines: { color: '#e5e0d8' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 300,
      timeScale: {
        borderColor: '#e5e0d8',
      },
      rightPriceScale: {
        borderColor: '#e5e0d8',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#3a664e', // data-up
      downColor: '#9c3d38', // data-down
      borderVisible: false,
      wickUpColor: '#3a664e',
      wickDownColor: '#9c3d38',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      chart.applyOptions({ width: newRect.width, height: newRect.height });
    });
    
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || displayBars.length === 0) return;

    // Apply resampling based on displayTimeframe
    const finalBars = displayTimeframe === '1W' ? resampleDailyToWeekly(displayBars) : displayBars;

    const formattedData = finalBars.map(bar => ({
      time: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));

    seriesRef.current.setData(formattedData as any);
    
    if (displayMarkers.length > 0) {
      seriesRef.current.setMarkers(displayMarkers);
    } else {
      seriesRef.current.setMarkers([]);
    }

    if (emaSeriesRef.current) {
      chartRef.current.removeSeries(emaSeriesRef.current);
      emaSeriesRef.current = null;
    }

    if (displayShowEma !== 'off') {
      const emaData = calculateEma(finalBars, displayShowEma);
      emaSeriesRef.current = chartRef.current.addLineSeries({
        color: displayShowEma === 10 ? '#2a4365' : '#8c4a32', // primary and signature approx
        lineWidth: 2,
        crosshairMarkerVisible: false,
      });
      emaSeriesRef.current.setData(emaData as any);
    }
    
    chartRef.current.timeScale().fitContent();

  }, [displayBars, displayShowEma, displayMarkers, displayTimeframe]);

  return (
    <div className="flex flex-col h-full w-full bg-surface border border-hairline rounded-lg shadow-card overflow-hidden relative font-sans">
      <div className="flex justify-between items-center p-3 z-10 border-b border-hairline bg-surface/50">
        <h3 className="text-ink font-semibold flex items-baseline gap-2">
          {symbol} 
          <span className="text-xs text-ink-light font-normal">({displayTimeframe})</span>
        </h3>
        <span className="text-xs text-ink-light">Data as of last close: {asOfDate}</span>
      </div>
      <div className="relative flex-1 w-full min-h-[300px] p-2 bg-surface">
        <div 
          ref={chartContainerRef} 
          className={`absolute inset-0 m-2 signature-transition ${isFading ? 'opacity-0' : 'opacity-100'}`} 
        />
        {bars.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface text-ink-light text-sm p-4 text-center z-20">
            <svg className="w-8 h-8 text-ink-light mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-ink">No historical price data available for {symbol}</span>
            <span className="text-xs text-ink-light mt-1">Check if API credentials are correct or try seeding the symbol.</span>
          </div>
        )}
      </div>
    </div>
  );
});
