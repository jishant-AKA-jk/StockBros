// Shared TypeScript types defining core contracts across features

export interface PriceBar {
  date: string; // ISO date string (YYYY-MM-DD)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Symbol {
  ticker: string;
  angelOneSymbolToken: string;
  exchangeSegment: string;
  name: string;
}

export interface WatchlistItem {
  userId: string;
  symbol: string;
  tag?: string;
  notes?: string;
  createdAt: string; // ISO date string
}

export interface ScreenerRule {
  id: string;
  label: string;
  description: string;
}

export interface JournalEntry {
  userId: string;
  symbol: string;
  setupTag?: string;
  entryDate: string; // ISO date string
  entryPrice: number;
  exitDate?: string; // ISO date string
  exitPrice?: number;
  notes?: string;
  rMultiple?: number;
}

// Pagination wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}

// Scanner match (for chart annotations)
export interface ScanMatch {
  date: string;
  price: number;
  description: string;
  type: 'entry' | 'exit' | 'signal';
}

// Scanner result (enhanced)
export interface ScanResult {
  symbol: string;
  name: string;
  candles: PriceBar[];
  matches: ScanMatch[];
  stats: {
    totalMatches: number;
    successRate: number;
    avgReturn: number;
  };
}

// Stock note
export interface StockNote {
  id: string;
  user_id: string;
  symbol: string;
  content: string;
  chart_date?: string;
  chart_price?: number;
  created_at: string;
  updated_at: string;
}

// EMA configuration
export interface EMAConfig {
  period: number;
  color: string;
  enabled: boolean;
}

// Grid layout option
export type GridColumns = 2 | 3 | 4 | 5;

