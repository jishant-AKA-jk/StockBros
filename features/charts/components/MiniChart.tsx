'use client';
import { useEffect, useRef, memo } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { PriceBar } from '@/lib/types';
import { CardSkeleton } from '@/components/Skeletons';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

interface MiniChartProps {
  symbol: string;
  bars?: PriceBar[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onClick?: () => void;
}

export const MiniChart = memo(function MiniChart({ symbol, bars = [], loading = false, error = false, onRetry, onClick }: MiniChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!chartContainerRef.current || loading || error || bars.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: {
        mode: 0,
        vertLine: { visible: false, labelVisible: false },
        horzLine: { visible: false, labelVisible: false },
      },
      timeScale: {
        visible: false,
        borderVisible: false,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
      },
      handleScroll: false,
      handleScale: false,
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      priceLineVisible: true,
      priceLineColor: 'rgba(163, 163, 163, 0.5)',
      priceLineStyle: LineStyle.Dashed,
      lastValueVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const formattedData = bars.map(bar => ({
      time: bar.date,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }));
    seriesRef.current.setData(formattedData as any);
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
      const newRect = entries[0].contentRect;
      if (newRect.width > 50 && newRect.height > 50) {
        chart.applyOptions({ width: newRect.width, height: newRect.height });
      }
    });
    
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [bars, loading, error]);

  const currentPrice = bars.length > 0 ? bars[bars.length - 1].close : 0;
  const prevPrice = bars.length > 1 ? bars[bars.length - 2].close : currentPrice;
  const isUp = currentPrice >= prevPrice;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/scanner?symbol=${symbol}`);
    }
  };

  if (loading) {
    return <CardSkeleton />;
  }

  if (error || bars.length === 0) {
    return (
      <div className="flex flex-col p-4 bg-surface rounded-xl border border-hairline h-[250px] items-center justify-center hover:bg-surface/80 transition-colors">
        <h4 className="font-bold text-ink mb-2">{symbol}</h4>
        {error ? (
          <button onClick={(e) => { e.stopPropagation(); onRetry?.(); }} className="p-2 rounded-full bg-paper hover:bg-surface border border-hairline transition-colors text-ink-light hover:text-ink flex flex-col items-center gap-2">
            <ArrowPathIcon className="w-5 h-5" />
            <span className="text-xs">Retry</span>
          </button>
        ) : (
          <span className="text-xs text-ink-light">No data</span>
        )}
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col p-4 bg-surface rounded-xl border border-hairline h-[250px] cursor-pointer hover:border-ink/20 hover:shadow-md transition-all group relative overflow-hidden"
      onClick={handleClick}
    >
      <div className="flex justify-between items-start mb-2 z-10 relative">
        <h4 className="font-bold text-ink group-hover:text-primary transition-colors">{symbol}</h4>
        <div className={`px-2 py-0.5 rounded text-xs font-semibold ${isUp ? 'bg-data-up/10 text-data-up border border-data-up/20' : 'bg-data-down/10 text-data-down border border-data-down/20'}`}>
          ${currentPrice.toFixed(2)}
        </div>
      </div>
      <div className="flex-1 w-full relative">
        <div ref={chartContainerRef} className="absolute inset-0" />
      </div>
    </div>
  );
});
