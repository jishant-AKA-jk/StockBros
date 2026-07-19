'use client';
import { useEffect, useRef, useState, memo } from 'react';
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { PriceBar, EMAConfig, ChartAnnotation } from '@/lib/types';
import { calculateEma, resampleDailyToWeekly } from '../utils';

interface PriceChartProps {
  bars: PriceBar[];
  timeframe: '1D' | '1W';
  emas?: EMAConfig[];
  annotations?: ChartAnnotation[];
  symbol: string;
}

export const PriceChart = memo(function PriceChart({ bars, timeframe, emas = [], annotations = [], symbol }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const emaSeriesRefs = useRef<Map<number, ISeriesApi<'Line'>>>(new Map());

  // Decoupled states for smooth cross-fade
  const [displayBars, setDisplayBars] = useState<PriceBar[]>(bars);
  const [displayTimeframe, setDisplayTimeframe] = useState<'1D' | '1W'>(timeframe);
  const [displayEmas, setDisplayEmas] = useState<EMAConfig[]>(emas);
  const [displayAnnotations, setDisplayAnnotations] = useState<ChartAnnotation[]>(annotations);
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
    const hasChanged = timeframe !== displayTimeframe || JSON.stringify(emas) !== JSON.stringify(displayEmas);
    if (hasChanged) {
      setIsFading(true);
      const timer = setTimeout(() => {
        setDisplayBars(bars);
        setDisplayTimeframe(timeframe);
        setDisplayEmas(emas);
        setDisplayAnnotations(annotations);
        setIsFading(false);
      }, 180);
      return () => clearTimeout(timer);
    } else {
      // Direct updates when timeframe/EMA do not change
      setDisplayBars(bars);
      setDisplayAnnotations(annotations);
      setDisplayEmas(emas);
    }
  }, [bars, timeframe, emas, annotations, displayTimeframe, displayEmas]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Minimum size guard
    if (chartContainerRef.current.clientWidth < 200) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#a3a3a3', // neutral-400
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, // Ultra dull
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: 'rgba(163, 163, 163, 0.5)',
          style: LineStyle.Dotted,
        },
        horzLine: {
          color: 'rgba(163, 163, 163, 0.5)',
          style: LineStyle.Dotted,
          labelBackgroundColor: '#2c2c2a',
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 400,
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        rightOffset: 12,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e', // green-500
      downColor: '#ef4444', // red-500
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceLineColor: 'rgba(163, 163, 163, 0.5)',
      priceLineStyle: LineStyle.Dashed,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      if (newRect.width > 200 && newRect.height > 200) {
        chart.applyOptions({ width: newRect.width, height: newRect.height });
      }
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
    
    // Set Markers from ChartAnnotations
    if (displayAnnotations.length > 0) {
      const markers = displayAnnotations.map(ann => {
        let position: 'aboveBar' | 'belowBar' | 'inBar' = 'inBar';
        let shape: 'arrowUp' | 'arrowDown' | 'circle' = 'circle';
        
        if (ann.type === 'entry') {
          position = 'belowBar';
          shape = 'arrowUp';
        } else if (ann.type === 'exit') {
          position = 'aboveBar';
          shape = 'arrowDown';
        } else {
          position = 'aboveBar';
          shape = 'circle';
        }

        return {
          time: ann.date as any,
          position,
          color: ann.color,
          shape,
          text: ann.label,
          size: 1
        };
      });
      seriesRef.current.setMarkers(markers);
    } else {
      seriesRef.current.setMarkers([]);
    }

    // Handle EMAs
    // Remove disabled/old EMAs
    const currentEnabledPeriods = new Set(displayEmas.filter(e => e.enabled).map(e => e.period));
    for (const [period, series] of Array.from(emaSeriesRefs.current.entries())) {
      if (!currentEnabledPeriods.has(period)) {
        chartRef.current.removeSeries(series);
        emaSeriesRefs.current.delete(period);
      }
    }

    // Add/Update enabled EMAs
    displayEmas.filter(e => e.enabled).forEach(emaConfig => {
      let series = emaSeriesRefs.current.get(emaConfig.period);
      if (!series) {
        series = chartRef.current!.addLineSeries({
          color: emaConfig.color,
          lineWidth: 2,
          crosshairMarkerVisible: false,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        emaSeriesRefs.current.set(emaConfig.period, series);
      } else {
        series.applyOptions({ color: emaConfig.color });
      }

      const emaData = calculateEma(finalBars, emaConfig.period);
      series.setData(emaData as any);
    });
    
    chartRef.current.timeScale().fitContent();

  }, [displayBars, displayEmas, displayAnnotations, displayTimeframe]);

  return (
    <div className="flex flex-col h-full w-full bg-paper border border-hairline rounded-xl shadow-card overflow-hidden relative font-sans group">
      {/* Top Header */}
      <div className="flex justify-between items-center p-4 z-10 border-b border-hairline bg-surface/80 backdrop-blur-sm transition-colors">
        <h3 className="text-ink font-semibold flex items-baseline gap-2 text-lg">
          {symbol} 
          <span className="text-sm text-ink-light font-normal px-2 py-0.5 bg-paper rounded border border-hairline">
            {displayTimeframe}
          </span>
        </h3>
        
        {/* EMA Pills (Read-only view of enabled EMAs for now) */}
        <div className="flex gap-2">
          {displayEmas.filter(e => e.enabled).map(ema => (
            <div key={ema.period} className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-surface border border-hairline text-ink-light">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ema.color }} />
              EMA {ema.period}
            </div>
          ))}
        </div>
      </div>
      
      <div className="relative flex-1 w-full min-h-[400px] p-2">
        <div 
          ref={chartContainerRef} 
          className={`absolute inset-0 m-2 transition-opacity duration-300 ${isFading ? 'opacity-0' : 'opacity-100'}`} 
        />
        {bars.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper text-ink-light text-sm p-4 text-center z-20">
            <svg className="w-10 h-10 text-ink-light mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
