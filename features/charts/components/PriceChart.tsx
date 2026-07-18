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
  const [isFading, setIsFading] = useState(false);
  const prevProps = useRef({ timeframe, showEma });

  const formattedData = bars.map(bar => ({
    time: bar.date,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }));

  const asOfDate = bars.length > 0 ? bars[bars.length - 1].date : '';

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
    if (!seriesRef.current || !chartRef.current || bars.length === 0) return;

    // Trigger cross-fade if timeframe or EMA changed
    if (prevProps.current.timeframe !== timeframe || prevProps.current.showEma !== showEma) {
      setIsFading(true);
      setTimeout(() => setIsFading(false), 180);
      prevProps.current = { timeframe, showEma };
    }

    seriesRef.current.setData(formattedData as any);
    
    if (markers.length > 0) {
      seriesRef.current.setMarkers(markers);
    }

    if (emaSeriesRef.current) {
      chartRef.current.removeSeries(emaSeriesRef.current);
      emaSeriesRef.current = null;
    }

    if (showEma !== 'off') {
      const emaData = calculateEma(bars, showEma);
      emaSeriesRef.current = chartRef.current.addLineSeries({
        color: showEma === 10 ? '#2962FF' : '#FF6D00',
        lineWidth: 2,
        crosshairMarkerVisible: false,
      });
      emaSeriesRef.current.setData(emaData as any);
    }
    
    chartRef.current.timeScale().fitContent();

  }, [bars, showEma, markers, timeframe]);

  return (
    <div className="flex flex-col h-full w-full bg-neutral-900 border border-neutral-800 rounded-lg shadow-md overflow-hidden relative">
      <div className="flex justify-between items-center p-3 z-10 border-b border-neutral-800 bg-neutral-900/50">
        <h3 className="text-white font-semibold flex items-baseline gap-2">
          {symbol} 
          <span className="text-xs text-neutral-400 font-normal">({timeframe})</span>
        </h3>
        <span className="text-xs text-neutral-400">Data as of last close: {asOfDate}</span>
      </div>
      <div className="relative flex-1 w-full min-h-[300px] p-2 bg-neutral-950">
        <div 
          ref={chartContainerRef} 
          className={`absolute inset-0 m-2 signature-transition ${isFading ? 'opacity-0' : 'opacity-100'}`} 
        />
      </div>
    </div>
  );
}
