import { create } from 'zustand';
import { PriceBar } from '@/lib/types';

interface MarketDataState {
  candles: Record<string, PriceBar[]>;
  setCandles: (symbol: string, bars: PriceBar[]) => void;
  isLoading: Record<string, boolean>;
  setLoading: (symbol: string, loading: boolean) => void;
  errors: Record<string, string | null>;
  setError: (symbol: string, error: string | null) => void;
}

export const useMarketDataStore = create<MarketDataState>((set) => ({
  candles: {},
  setCandles: (symbol, bars) => set((state) => ({
    candles: { ...state.candles, [symbol]: bars }
  })),
  isLoading: {},
  setLoading: (symbol, loading) => set((state) => ({
    isLoading: { ...state.isLoading, [symbol]: loading }
  })),
  errors: {},
  setError: (symbol, error) => set((state) => ({
    errors: { ...state.errors, [symbol]: error }
  })),
}));
