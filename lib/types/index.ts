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
