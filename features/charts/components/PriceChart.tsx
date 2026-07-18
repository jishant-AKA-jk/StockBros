'use client';
import { useEffect, useRef, useState } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';
import { PriceBar } from '@/lib/types';
import { calculateEma } from '../utils';

interface PriceChartProps {
  bars: PriceBar[];
  timeframe: '1D' | '1W';
  showEma: 'off' | 10 | 20;
  markers?: any[];
  symbol: string;
}

export function PriceChart({ bars, timeframe, showEma, markers = [], symbol }: PriceChartProps) {
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
        textColor: '#D9D9D9',
      },
      grid: {
        vertLines: { color: '#2B2B2B' },
        horzLines: { color: '#2B2B2B' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 300,
      timeScale: {
        borderColor: '#2B2B2B',
      },
      rightPriceScale: {
        borderColor: '#2B2B2B',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || displayBars.length === 0) return;

    const formattedData = displayBars.map(bar => ({
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
      const emaData = calculateEma(displayBars, displayShowEma);
      emaSeriesRef.current = chartRef.current.addLineSeries({
        color: displayShowEma === 10 ? '#2962FF' : '#FF6D00',
        lineWidth: 2,
        crosshairMarkerVisible: false,
      });
      emaSeriesRef.current.setData(emaData as any);
    }
    
    chartRef.current.timeScale().fitContent();

  }, [displayBars, displayShowEma, displayMarkers, displayTimeframe]);

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-md overflow-hidden relative">
      <div className="flex justify-between items-center p-3 z-10 border-b border-neutral-800 bg-neutral-900/50">
        <h3 className="text-white font-semibold flex items-baseline gap-2">
          {symbol} 
          <span className="text-xs text-neutral-400 font-normal">({displayTimeframe})</span>
        </h3>
        <span className="text-xs text-neutral-400">Data as of last close: {asOfDate}</span>
      </div>
      <div className="relative flex-1 w-full min-h-[300px] p-2 bg-neutral-950">
        <div 
          ref={chartContainerRef} 
          className={`absolute inset-0 m-2 signature-transition ${isFading ? 'opacity-0' : 'opacity-100'}`} 
        />
        {bars.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950 text-neutral-400 text-sm font-sans p-4 text-center z-20">
            <svg className="w-8 h-8 text-neutral-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="font-medium text-neutral-300">No historical price data available for {symbol}</span>
            <span className="text-xs text-neutral-500 mt-1">Check if API credentials are correct or try seeding the symbol.</span>
          </div>
        )}
      </div>
    </div>
  );
}
