# StockBros — New Implementation Plan

> **Created**: 2026-07-19  
> **Status**: Draft — Awaiting Team Review  
> **Teams**: Team A (Backend + Data Layer) · Team B (Frontend + UX)

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Problem Summary](#2-problem-summary)
3. [Architecture Decisions](#3-architecture-decisions)
4. [Team Split Strategy](#4-team-split-strategy)
5. [Team A — Backend, Data, Performance](#5-team-a--backend-data-performance)
6. [Team B — Frontend, UX, Charts](#6-team-b--frontend-ux-charts)
7. [Shared Contracts (API Interfaces)](#7-shared-contracts-api-interfaces)
8. [Database Migrations](#8-database-migrations)
9. [Dependency Additions](#9-dependency-additions)
10. [Risk & Rollback Plan](#10-risk--rollback-plan)
11. [Definition of Done](#11-definition-of-done)

---

## 1. Current State Analysis

### Tech Stack
| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| UI | React 19, Tailwind CSS 3.4, Framer Motion |
| Auth & DB | Supabase (Auth, PostgreSQL, RLS) |
| Data Source | AngelOne SmartAPI (174 Nifty 200 stocks) |
| Charts | Custom canvas-based `CandlestickChart` + `MiniChart` |

### Current Pages
| Page | Description | Key Issues |
|------|-------------|------------|
| `/dashboard` | Main chart + mini grid + ledger | Fixed layout (not resizable), mini charts fail ("historical data not available"), ticker duplicates, hardcoded 8 symbols |
| `/screener` | Scans all 174 stocks by rule | Takes 30+ seconds, no pagination, no grid controls, `window.alert()` |
| `/scanner` | Single stock + rule analysis | Scan results not shown on chart, no notes, slow 2-year fetch, alerts |
| `/watchlist` | User's saved stocks + mini charts | No pagination, no load-more, full text buttons, grid not adjustable |
| `/journal` | Generic journal entries | No stock association, no chart integration, no pagination |

### Database Tables
- `profiles` — User profiles (auto-created on signup)
- `watchlist` — Saved stock symbols per user
- `journal_entries` — Generic journal with mood/tags
- `scanner_history` — Past scan results (JSONB)
- ❌ **Missing**: `stock_notes`, `cached_candles`

### Critical Performance Bottlenecks
1. **Screener scans ALL 174 stocks sequentially** — each is a separate AngelOne API call
2. **Zero caching** — every page load re-fetches from AngelOne
3. **No pagination** on any page (screener, watchlist, journal, history)
4. **Mini charts each fetch independently** — 8 parallel API calls on dashboard load
5. **Scanner fetches 2 years of data** per scan with no chunking

---

## 2. Problem Summary

### UX Problems
- [ ] `window.alert()` used everywhere — needs modals/toasts
- [ ] Watchlist buttons say "Add to Watchlist" / "Remove from Watchlist" in big text — needs icons
- [ ] No skeleton loading states — just spinners or blank space
- [ ] Date picker is basic HTML input — needs proper date picker
- [ ] No tactile feedback on interactions
- [ ] No resizable panels on dashboard
- [ ] Chart grid columns hardcoded — no user control
- [ ] Scanner results listed as text, not shown on chart

### Feature Gaps
- [ ] Only 2 EMAs (20 & 50) — needs combinable multi-EMA support
- [ ] No per-stock notes (for scanner → journal flow)
- [ ] No chart event markers (scanner matches on chart)
- [ ] Screener and Scanner are confusingly similar — needs clearer differentiation
- [ ] Journal entries not linked to stocks/charts

### Performance Problems
- [ ] No data caching layer
- [ ] No API request batching or rate limiting
- [ ] No pagination or lazy loading
- [ ] All results rendered at once

---

## 3. Architecture Decisions

### 3.1 Screener vs Scanner — Clear Differentiation

| Aspect | Screener | Scanner |
|--------|----------|---------|
| **Purpose** | Browse stocks matching a filter | Deep-dive analysis of ONE stock |
| **Input** | Toggle filter rules (EMA Stack, Consolidation, Volume Surge) | Select ONE stock + ONE rule |
| **Output** | Grid of matching stocks with mini charts | Single full chart with historical pattern markers |
| **Interaction** | Browse, toggle, add to watchlist | Analyze, annotate, take notes |
| **Pagination** | 5 results default, "Load More" for next 5 | N/A (one stock at a time) |
| **Grid Control** | 2/3/4/5 columns (user adjustable) | Always 1 full chart |

### 3.2 Caching Strategy

```
AngelOne API → API Route → In-Memory Cache (LRU, 15min TTL) → Client
                              ↓ (async)
                    Supabase `cached_candles` table (daily refresh)
```

- **L1: In-Memory LRU Cache** — 15-minute TTL for hot data, in API routes
- **L2: Supabase `cached_candles`** — Persistent cache, refreshed daily
- **Result**: First load hits AngelOne, subsequent loads are instant

### 3.3 UI Component Library

Adopt **shadcn/ui** for high-quality, accessible, composable components:
- `Dialog` (replaces `window.alert()`)
- `Sheet` (side panels)
- `Tooltip` (icon hover descriptions)
- `Popover` (date picker, EMA selector)
- `Skeleton` (loading states)
- `ResizablePanelGroup` (dashboard resizable layout)
- `ToggleGroup` (screener filter toggles)
- `Command` (stock symbol search)

### 3.4 Pagination Model

```
Default: fetch 5 results
"Load More" button → fetch next 5
Server-side: offset/limit pagination via API query params
```

Applied to: Screener results, Watchlist items, Journal entries, Scanner history.

---

## 4. Team Split Strategy

### Principle: No Merge Conflicts

Teams work on **completely independent file sets**. The contract between them is the **API interface** (request/response shapes). Teams agree on interfaces first, then work independently.

```
Team A (Backend + Data)          Team B (Frontend + UX)
─────────────────────           ─────────────────────
app/api/**                      app/dashboard/page.tsx
features/angelone/**            app/screener/page.tsx
features/screener/engine.ts     app/scanner/page.tsx
features/screener/utils.ts      app/watchlist/page.tsx
features/journal/actions.ts     app/journal/page.tsx
features/watchlist/actions.ts   features/charts/**
features/scanner/**  (new)      components/**
lib/cache/**  (new)             app/globals.css
lib/types/index.ts              app/layout.tsx
supabase/migrations/**  (new)
```

### Integration Points (Agreed Upfront)
1. API route request/response shapes (Section 7)
2. Type definitions in `lib/types/index.ts` (Team A owns, Team B consumes)
3. Server actions signatures (Team A owns, Team B calls)

---

## 5. Team A — Backend, Data, Performance

### Phase A1: Data Caching Layer (Priority: 🔴 Critical)

> **Goal**: Eliminate redundant AngelOne API calls, make page loads instant.

**Files to create/modify:**
- `lib/cache/memory-cache.ts` — LRU in-memory cache with TTL
- `lib/cache/candle-cache.ts` — Supabase-backed persistent cache
- `supabase/migrations/20260719000001_cached_candles.sql` — New table
- `app/api/angelone/historical/route.ts` — Add caching layer

**New Table: `cached_candles`**
```sql
CREATE TABLE cached_candles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT 'ONE_DAY',
  date DATE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol, interval, date)
);

CREATE INDEX idx_cached_candles_symbol_date ON cached_candles(symbol, interval, date);
```

**In-Memory Cache (`lib/cache/memory-cache.ts`):**
```typescript
// LRU cache with configurable TTL (default 15 min)
// Key: `${symbol}:${interval}:${fromDate}:${toDate}`
// Value: StockCandle[]
```

**Cache Flow in API Route:**
1. Check in-memory LRU → hit? return immediately
2. Check Supabase `cached_candles` → hit? populate memory, return
3. Fetch from AngelOne → store in both caches, return

**Estimated Impact**: Page loads go from 5-30s → <500ms for cached data.

---

### Phase A2: Paginated API Routes (Priority: 🔴 Critical)

> **Goal**: Default 5 results, "load more" returns next 5.

**Files to modify:**
- `app/api/screener/route.ts` — Add `offset`, `limit`, `rule` params
- `features/screener/engine.ts` — Accept offset/limit, process subset
- `features/watchlist/actions.ts` — Add pagination params
- `features/journal/actions.ts` — Add pagination params

**Screener Pagination Strategy:**

The screener currently scans all 174 stocks. New approach:
```
1. Pre-sort symbols by market cap / volume (static ranking)
2. On request: take symbols[offset..offset+limit]
3. Run screening rule on only those symbols
4. Return { results, total, hasMore }
```

**API Contract:**
```typescript
// GET /api/screener?rule=ema_stack&offset=0&limit=5
// Response:
{
  results: ScreenerResult[],  // max 5 items
  total: number,              // total matching count (if available)
  hasMore: boolean
}
```

**Watchlist Pagination:**
```typescript
// getWatchlist(offset: number = 0, limit: number = 5)
// Returns: { items: WatchlistItem[], total: number, hasMore: boolean }
```

**Journal Pagination:**
```typescript
// getJournalEntries(offset: number = 0, limit: number = 5)
// Returns: { entries: JournalEntry[], total: number, hasMore: boolean }
```

---

### Phase A3: Optimized Screener Engine (Priority: 🟡 High)

> **Goal**: Parallel API calls, batch processing, faster scans.

**Files to modify:**
- `features/screener/engine.ts` — Complete rewrite

**Changes:**
1. **Parallel fetching** with concurrency limit (max 5 concurrent API calls)
2. **Cache-first**: Check `cached_candles` before calling AngelOne
3. **Batch writes**: Save fetched candles to cache in bulk
4. **Error resilience**: If one stock fails, skip it, don't block the rest
5. **Pre-computation**: Run EMA calculations on cache write, store signals

```typescript
// Pseudocode
async function screenStocks(rule, offset, limit) {
  const symbols = NIFTY200_SYMBOLS.slice(offset, offset + limit);
  
  // Parallel fetch with concurrency control
  const results = await pMap(symbols, async (sym) => {
    const candles = await getCachedOrFetch(sym.symbol);
    if (!candles) return null; // skip failed
    
    const signal = evaluateRule(candles, rule);
    if (!signal) return null; // didn't match
    
    return { symbol: sym.symbol, name: sym.name, candles, signal };
  }, { concurrency: 5 });
  
  return results.filter(Boolean);
}
```

---

### Phase A4: Scanner Engine Improvements (Priority: 🟡 High)

> **Goal**: Fast single-stock analysis with historical pattern detection.

**Files to create/modify:**
- `features/scanner/engine.ts` — New dedicated scanner engine
- `features/scanner/rules.ts` — Rule evaluation functions
- `app/api/scanner/route.ts` — Improved route with caching

**Changes:**
1. Use cached candle data (avoid 2-year fresh fetch every time)
2. Return scan results as **chart annotations** (date + price + description)
3. Support all 3 rules (EMA Stack, Consolidation, Volume Surge) with sliding window
4. Each match becomes a marker that Team B renders on the chart

**Response Format:**
```typescript
{
  symbol: string;
  name: string;
  candles: StockCandle[];
  matches: {
    date: string;        // "2025-03-15"
    price: number;       // Price at the match point
    description: string; // "EMA 10 crossed above EMA 20 and 50"
    type: 'entry' | 'exit' | 'signal';
  }[];
  stats: {
    totalMatches: number;
    successRate: number;  // Based on price action after signal
    avgReturn: number;
  };
}
```

---

### Phase A5: Stock Notes System (Priority: 🟢 Medium)

> **Goal**: Per-stock notes in scanner, visible in journal with chart context.

**Files to create:**
- `supabase/migrations/20260719000002_stock_notes.sql`
- `features/scanner/notes.ts` — Server actions for notes CRUD

**New Table: `stock_notes`**
```sql
CREATE TABLE stock_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  content TEXT NOT NULL,
  chart_date DATE,  -- Optional: pin note to specific date on chart
  chart_price NUMERIC,  -- Optional: pin note to specific price level
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON stock_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_stock_notes_user_symbol ON stock_notes(user_id, symbol);
```

**Server Actions:**
```typescript
getStockNotes(symbol: string): Promise<StockNote[]>
createStockNote(symbol: string, content: string, chartDate?: string, chartPrice?: number): Promise<StockNote>
updateStockNote(id: string, content: string): Promise<StockNote>
deleteStockNote(id: string): Promise<void>
getAllUserNotes(): Promise<StockNote[]>  // For journal page
```

---

### Phase A6: Type Definitions Update (Priority: 🔴 Critical — Do First)

> **Goal**: Shared types that both teams use. Team A defines, Team B consumes.

**File to modify:** `lib/types/index.ts`

**New/Updated Types:**
```typescript
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
  candles: StockCandle[];
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

// Screener filter rule (toggleable)
export type ScreenerRule = 'ema_stack' | 'consolidation' | 'volume_surge';

// Grid layout option
export type GridColumns = 2 | 3 | 4 | 5;
```

---

### Team A Task Checklist

| # | Task | Phase | Est. Hours | Dependencies |
|---|------|-------|------------|--------------|
| A1 | Define shared types (`lib/types/index.ts`) | A6 | 2h | None |
| A2 | Create in-memory LRU cache | A1 | 3h | None |
| A3 | Create `cached_candles` migration + cache service | A1 | 4h | A1 |
| A4 | Add caching to `/api/angelone/historical` route | A1 | 3h | A2, A3 |
| A5 | Paginate screener API + engine rewrite | A2, A3 | 6h | A4 |
| A6 | Paginate watchlist server actions | A2 | 2h | A1 |
| A7 | Paginate journal server actions | A2 | 2h | A1 |
| A8 | Build scanner engine with pattern detection | A4 | 6h | A4 |
| A9 | Create `stock_notes` migration + server actions | A5 | 4h | A1 |
| A10 | Add scanner history pagination | A2 | 2h | A1 |
| **Total** | | | **34h** | |

---

## 6. Team B — Frontend, UX, Charts

### Phase B1: Install & Configure shadcn/ui (Priority: 🔴 Critical — Do First)

> **Goal**: Replace all `window.alert()`, add modals, tooltips, skeleton loading.

**Steps:**
1. Run `npx shadcn@latest init` (select default theme, CSS variables)
2. Install needed components:
   ```bash
   npx shadcn@latest add dialog tooltip skeleton toggle-group
   npx shadcn@latest add popover command separator badge
   npx shadcn@latest add resizable sheet scroll-area
   ```
3. This creates files in `components/ui/` — Team A doesn't touch this folder.

**Components to Use:**
| shadcn Component | Replaces | Used In |
|-----------------|----------|---------|
| `Dialog` | `window.alert()` | All pages |
| `Tooltip` | Text labels on buttons | Watchlist icon, grid controls |
| `Skeleton` | Blank loading state | All chart grids |
| `ToggleGroup` | Dropdown rule selector | Screener filter toggles |
| `ResizablePanelGroup` | Fixed `w-3/5`/`w-2/5` | Dashboard layout |
| `Command` | Basic text input search | Symbol search (scanner) |
| `Popover` | HTML date input | Date picker |
| `Sheet` | N/A | Mobile nav, notes panel |
| `ScrollArea` | Native scroll | Ledger, history lists |

---

### Phase B2: Dashboard Overhaul (Priority: 🔴 Critical)

> **Goal**: TradingView-dominant layout, resizable panels, responsive mini grid.

**File:** `app/dashboard/page.tsx` — Full rewrite

**Layout Changes:**
```
┌─────────────────────────────────────────────────────┐
│  NAVBAR                                              │
├─────────────────────────────────┬───────────────────┤
│                                 │                   │
│    MAIN TRADINGVIEW CHART       │    LEDGER PANEL   │
│    (Full candlestick chart      │    - Watchlist     │
│     with EMA controls)          │    - Quick Stats   │
│                                 │    - Recent Scans  │
│    ← RESIZABLE DIVIDER →       │                   │
│                                 │                   │
├─────────────────────────────────┴───────────────────┤
│  MINI CHART GRID (responsive, auto-columns)          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│  │RELI  │ │TCS   │ │INFY  │ │HDFC  │               │
│  └──────┘ └──────┘ └──────┘ └──────┘               │
└─────────────────────────────────────────────────────┘
```

**Key Changes:**
1. **Resizable Panels**: Use `ResizablePanelGroup` from shadcn — user drags divider between chart and ledger
2. **Main Chart takes ~70%** of the viewport by default
3. **Mini Chart Grid**: Responsive with per-row count based on screen width:
   - `< 768px`: 1 per row
   - `768-1024px`: 2 per row
   - `1024-1440px`: 3 per row
   - `> 1440px`: 4 per row
4. **No duplicate tickers**: If selected stock is in mini grid, highlight it instead of showing twice
5. **Skeleton loading**: Show skeleton grid while mini charts load
6. **Error handling**: Retry button on failed mini charts instead of "historical data not available"
7. **Symbol picker**: Use `Command` component for fuzzy search

---

### Phase B3: CandlestickChart Upgrade (Priority: 🔴 Critical)

> **Goal**: Better visuals, combinable EMAs, chart annotations, responsive sizing.

**File:** `features/charts/CandlestickChart.tsx` — Major refactor

**Changes:**

#### 3a. Visual Improvements
- **Grid lines**: Make very dull (opacity 0.05-0.08 instead of current)
- **Candlesticks**: Improve visual quality
  - Green candles: filled with `#22c55e` (green-500), subtle glow
  - Red candles: filled with `#ef4444` (red-500), subtle glow
  - Wicks: thinner, match candle color
  - Body: slight rounded corners, minimum width 3px
- **Current price line**: Dashed horizontal line with price label on right axis
- **Background**: Match dark theme perfectly, no jarring contrast

#### 3b. Multi-EMA Support
```typescript
interface EMAConfig {
  period: number;    // e.g., 9, 20, 50, 100, 200
  color: string;     // Unique color per EMA
  enabled: boolean;  // Toggle on/off
}

// Preset EMAs available:
const AVAILABLE_EMAS = [
  { period: 9,   color: '#f59e0b', label: 'EMA 9' },
  { period: 20,  color: '#3b82f6', label: 'EMA 20' },
  { period: 50,  color: '#8b5cf6', label: 'EMA 50' },
  { period: 100, color: '#ec4899', label: 'EMA 100' },
  { period: 200, color: '#14b8a6', label: 'EMA 200' },
];
```

- User can toggle any combination of EMAs via a popover/dropdown
- EMA pills/chips shown above chart: click to toggle, color-coded
- Selected EMAs render as smooth lines on chart

#### 3c. Chart Annotations (for Scanner)
```typescript
interface ChartAnnotation {
  date: string;
  price: number;
  label: string;
  type: 'entry' | 'exit' | 'signal';
  color: string;
}
```
- Render markers (diamonds/arrows) at annotation points on the chart
- On hover, show tooltip with label and details
- Used by scanner to show where patterns were detected

#### 3d. Responsive Sizing
- Chart auto-sizes to container via `ResizeObserver`
- Proper DPI scaling for Retina displays
- Minimum size guards (don't render if container < 200px)

---

### Phase B4: MiniChart Upgrade (Priority: 🟡 High)

> **Goal**: Responsive, better looking, consistent with main chart.

**File:** `features/charts/MiniChart.tsx` — Refactor

**Changes:**
1. **Auto-size to container**: Use `ResizeObserver`, no fixed dimensions
2. **Simplified visuals**: No axes labels, just candlesticks + current price line
3. **Grid**: Ultra-subtle or none in mini view
4. **Current price**: Show as a badge overlay (top-right corner)
5. **Loading state**: Render `Skeleton` while data loads
6. **Error state**: Small retry icon, not a wall of error text
7. **Click handler**: Click mini chart → navigate to full view in dashboard/screener

---

### Phase B5: Screener Page Overhaul (Priority: 🔴 Critical)

> **Goal**: Toggleable filters, adjustable grid, icon buttons, pagination.

**File:** `app/screener/page.tsx` — Full rewrite

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  FILTER BAR                                          │
│  [EMA Stack] [Consolidation] [Volume Surge]  (toggles)│
│                                                      │
│  GRID CONTROLS                      [2] [3] [4] [5] │
├─────────────────────────────────────────────────────┤
│  RESULTS GRID (default 2 per row)                    │
│  ┌────────────────────┐  ┌────────────────────┐     │
│  │ RELIANCE    [♡/✓]  │  │ TCS         [♡/✓]  │     │
│  │ EMA Stack ✓        │  │ EMA Stack ✓        │     │
│  │ ░░░░░ mini chart   │  │ ░░░░░ mini chart   │     │
│  └────────────────────┘  └────────────────────┘     │
│                                                      │
│            [ Load More (showing 5 of 23) ]           │
└─────────────────────────────────────────────────────┘
```

**Key Changes:**
1. **Filter Toggles**: Use `ToggleGroup` — EMA Stack, Consolidation, Volume Surge as toggleable pills (not a dropdown). Whichever is selected, show those results. Can select multiple.
2. **Grid Columns**: Row of buttons `[2] [3] [4] [5]` — user clicks to change grid. Default 2. Show options based on screen width (hide 5 on small screens).
3. **Pagination**: Default show 5 results. "Load More" button fetches next 5 from API with `offset` param.
4. **Watchlist Button**: 
   - Not in watchlist: outline heart icon (♡) — on hover tooltip says "Add to watchlist"
   - In watchlist: filled checkmark icon (✓) — on hover tooltip says "Remove from watchlist"
   - Click: instantly toggles state, no alert, no modal. Just icon change + toast notification.
5. **Loading**: Show skeleton grid (5 skeleton cards matching current column layout)
6. **No big text labels**: Icons with tooltips. Stock name and signal only.

---

### Phase B6: Scanner Page Overhaul (Priority: 🔴 Critical)

> **Goal**: Single stock deep-dive with chart annotations, notes, premium loading.

**File:** `app/scanner/page.tsx` — Full rewrite

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  STOCK SELECTOR (Command/Search)  │  RULE SELECTOR  │
│  [🔍 Search stocks...]           │  [EMA Stack ▾]  │
│                                   │  [Scan ▶]       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  FULL CANDLESTICK CHART (with annotations)           │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │
│  ░░░ ▲ signal markers on chart  ░░░░░░░░░░         │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░         │
│                                                      │
├──────────────────────────┬──────────────────────────┤
│  SCAN RESULTS            │  NOTES PANEL              │
│  📍 Mar 15 - EMA cross   │  📝 Add a note...         │
│  📍 Apr 02 - EMA cross   │  ─────────────────────── │
│  📍 Jun 11 - EMA cross   │  "Looks like breakout"   │
│  (click to jump on chart)│  "Watch for retest"       │
│                          │                           │
│  ──────── History ────── │                           │
│  Past scans (paginated)  │                           │
└──────────────────────────┴──────────────────────────┘
```

**Key Changes:**
1. **Symbol Search**: Use `Command` component with fuzzy search, shows recent searches
2. **Chart with Annotations**: When scan completes, render markers (▲/◆) on the chart at each match date/price. Clicking a result in the list scrolls/zooms chart to that date.
3. **Notes Panel**: Side panel (or bottom panel) for per-stock notes
   - Text input with "Add Note" button
   - Notes list with edit/delete
   - Notes pinned to chart date (optional — click on chart to pin)
   - Notes saved to `stock_notes` table
4. **Loading Experience**: 
   - Full-screen shimmer/skeleton over chart area during scan
   - Progress indicator: "Fetching data... Analyzing patterns... Found X matches"
   - Smooth transition from loading → results
5. **No alerts anywhere**: Toast for success/error, inline for validation
6. **Date Selection**: Use shadcn `Popover` + calendar date picker
7. **History**: Paginated (5 items), "Show More" button

---

### Phase B7: Watchlist Page Overhaul (Priority: 🟡 High)

> **Goal**: Chart-first view with icon controls, pagination.

**File:** `app/watchlist/page.tsx` — Rewrite

**Key Changes:**
1. **Grid Layout**: Default 2 per row, adjustable (2/3/4/5)
2. **Pagination**: Show max 5 stocks, "Show More" adds 5 more
3. **Remove Button**: Small `×` icon in top-right corner of card
   - On hover: tooltip "Remove from watchlist"
   - Click: instantly removes, no confirmation alert
   - Shows brief toast: "RELIANCE removed"
4. **Charts**: Each card is primarily a mini chart with stock name overlay
5. **Empty State**: Nice illustration + "Add stocks from Screener" CTA
6. **Loading**: Skeleton cards matching grid layout

---

### Phase B8: Journal Page Overhaul (Priority: 🟡 High)

> **Goal**: Stock-linked entries, chart integration, pagination.

**File:** `app/journal/page.tsx` — Rewrite

**Key Changes:**
1. **Two Sections**: 
   - Stock Notes (from `stock_notes` table — shows all per-stock notes)
   - Journal Entries (existing `journal_entries`)
2. **Stock Notes View**: 
   - Grouped by stock symbol
   - Click on a note → opens chart with note pinned at the date
   - Shows mini chart alongside each stock group
3. **Journal Entries**: Existing functionality with pagination (5 default + load more)
4. **New Entry Form**: Use `Dialog` instead of inline form
5. **Tags**: Use badge-style tag input (click to add/remove)

---

### Phase B9: Global Loading & Feedback System (Priority: 🔴 Critical)

> **Goal**: Premium feel throughout the app, no jank, great tactile feedback.

**Components to create/modify:**

#### 9a. Toast System
- Replace `components/ui/Toast.tsx` with shadcn toast or a custom solution
- Auto-dismiss after 3s
- Types: success (green), error (red), info (blue)
- Position: bottom-right
- No stacking (replace current toast with new one)

#### 9b. Skeleton Loading System
- Create skeleton variants:
  - `ChartSkeleton`: Mimics chart area with animated gradient
  - `CardSkeleton`: Mimics stock card with chart skeleton inside
  - `GridSkeleton(columns, rows)`: Grid of card skeletons
  - `TableSkeleton(rows)`: For ledger/list views
- Use everywhere a component is loading data

#### 9c. Micro-Interactions
- Button press: scale down 0.97 on click, spring back
- Card hover: subtle lift (translateY -2px) + shadow increase
- Toggle: smooth color transition (200ms ease)
- Icon buttons: rotate/scale on hover
- Page transitions: fade-in with slight translateY (framer-motion)

#### 9d. Tactile Feedback
- All clickable elements: `cursor-pointer` + hover state
- Active state: visible press feedback (scale or opacity)
- Focus rings: visible for keyboard navigation (accessibility)
- Disabled states: reduced opacity + `cursor-not-allowed`

---

### Phase B10: Responsive Chart Grid System (Priority: 🟡 High)

> **Goal**: Reusable grid component for screener, watchlist, dashboard.

**File to create:** `components/ChartGrid.tsx`

```typescript
interface ChartGridProps {
  items: { symbol: string; name: string; candles: StockCandle[] }[];
  columns: GridColumns;              // 2 | 3 | 4 | 5
  onColumnsChange: (cols: GridColumns) => void;
  renderCard: (item, index) => ReactNode;
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  total?: number;
}
```

- Shared between screener, watchlist, and dashboard mini grid
- Column selector UI built in
- "Load More" button built in
- Skeleton loading built in
- Responsive: auto-reduces columns on smaller screens (e.g., max 3 on tablet, max 2 on mobile)

---

### Team B Task Checklist

| # | Task | Phase | Est. Hours | Dependencies |
|---|------|-------|------------|--------------|
| B1 | Install & configure shadcn/ui | B1 | 2h | None |
| B2 | Build ChartGrid shared component | B10 | 4h | B1 |
| B3 | Build global toast system | B9a | 2h | B1 |
| B4 | Build skeleton loading system | B9b | 3h | B1 |
| B5 | Upgrade CandlestickChart (visuals, multi-EMA) | B3 | 8h | None |
| B6 | Upgrade MiniChart (responsive, error states) | B4 | 4h | B5 |
| B7 | Add chart annotations support | B3c | 4h | B5 |
| B8 | Rewrite Dashboard page | B2 | 8h | B2, B5, B6 |
| B9 | Rewrite Screener page | B5 | 6h | B2, B3, B4, B6 |
| B10 | Rewrite Scanner page | B6 | 8h | B5, B7, B3, B4 |
| B11 | Rewrite Watchlist page | B7 | 4h | B2, B3, B6 |
| B12 | Rewrite Journal page | B8 | 4h | B3, B4 |
| B13 | Add micro-interactions & tactile feedback | B9c, B9d | 4h | All pages |
| **Total** | | | **61h** | |

---

## 7. Shared Contracts (API Interfaces)

> Both teams must agree on these interfaces BEFORE starting development.

### 7.1 Historical Data API

```typescript
// GET /api/angelone/historical?symbol=RELIANCE&interval=ONE_DAY&days=365
// Response: StockCandle[]
// ✅ Now served from cache (Team A responsibility)
// ✅ Team B calls this the same way — no code change needed
```

### 7.2 Screener API

```typescript
// GET /api/screener?rule=ema_stack&offset=0&limit=5
// GET /api/screener?rule=ema_stack,volume_surge&offset=0&limit=5  (multi-rule)

interface ScreenerAPIResponse {
  results: ScreenerResult[];
  total: number;
  hasMore: boolean;
  offset: number;
  limit: number;
}
```

### 7.3 Scanner API

```typescript
// GET /api/scanner?symbol=RELIANCE&rule=ema_stack

interface ScannerAPIResponse {
  symbol: string;
  name: string;
  candles: StockCandle[];
  matches: ScanMatch[];
  stats: {
    totalMatches: number;
    successRate: number;
    avgReturn: number;
  };
}
```

### 7.4 Watchlist Server Actions

```typescript
// Team A implements, Team B calls
getWatchlist(offset?: number, limit?: number): Promise<PaginatedResponse<WatchlistItem>>
addToWatchlist(symbol: string, name: string): Promise<WatchlistItem>
removeFromWatchlist(id: string): Promise<void>
isInWatchlist(symbol: string): Promise<boolean>
```

### 7.5 Journal Server Actions

```typescript
getJournalEntries(offset?: number, limit?: number): Promise<PaginatedResponse<JournalEntry>>
createJournalEntry(data: Partial<JournalEntry>): Promise<JournalEntry>
updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry>
deleteJournalEntry(id: string): Promise<void>
```

### 7.6 Stock Notes Server Actions

```typescript
getStockNotes(symbol: string): Promise<StockNote[]>
createStockNote(symbol: string, content: string, chartDate?: string, chartPrice?: number): Promise<StockNote>
updateStockNote(id: string, content: string): Promise<StockNote>
deleteStockNote(id: string): Promise<void>
getAllUserNotes(): Promise<StockNote[]>  // For journal
```

---

## 8. Database Migrations

### Migration 1: `20260719000001_cached_candles.sql` (Team A)
```sql
-- Candle data cache for fast chart loading
CREATE TABLE IF NOT EXISTS cached_candles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT 'ONE_DAY',
  date DATE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume BIGINT NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(symbol, interval, date)
);

CREATE INDEX idx_cached_candles_lookup 
  ON cached_candles(symbol, interval, date DESC);

ALTER TABLE cached_candles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON cached_candles
  FOR ALL USING (true);
```

### Migration 2: `20260719000002_stock_notes.sql` (Team A)
```sql
CREATE TABLE IF NOT EXISTS stock_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  content TEXT NOT NULL,
  chart_date DATE,
  chart_price NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE stock_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notes" ON stock_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_stock_notes_user_symbol 
  ON stock_notes(user_id, symbol);
```

### Migration 3: `20260719000003_scanner_history_index.sql` (Team A)
```sql
CREATE INDEX IF NOT EXISTS idx_scanner_history_user_symbol 
  ON scanner_history(user_id, symbol, scanned_at DESC);
```

---

## 9. Dependency Additions

### Team B (Frontend)
```bash
# shadcn/ui (requires these peer deps)
npx shadcn@latest init
# Then add individual components as needed

# Better icons (Heroicons)
npm install @heroicons/react

# Resize observer hook
npm install @react-hook/resize-observer
```

### Team A (Backend)
```bash
# Concurrency control for parallel API calls
npm install p-map

# LRU cache
npm install lru-cache
```

> **Note**: Both teams should coordinate on `package.json` changes — do them at the start in a single commit to avoid conflicts.

---

## 10. Risk & Rollback Plan

| Risk | Mitigation |
|------|-----------|
| AngelOne API rate limits | In-memory cache + DB cache reduces calls by ~95% |
| shadcn/ui conflicts with existing Tailwind setup | Init shadcn carefully, test with existing components first |
| Merge conflicts between teams | Strict file ownership (Section 4), shared types defined first |
| Canvas chart performance with many EMAs | Limit to max 5 concurrent EMAs, use requestAnimationFrame |
| Large cached_candles table | Add `fetched_at` TTL cleanup job (delete rows > 30 days) |
| Breaking API changes | Version API routes if needed, maintain backward compat |

### Rollback Strategy
- Each phase is independently deployable
- Use feature flags for new pages (if needed)
- Keep old page code in git history — can revert per-file
- Database migrations are additive (new tables only, no destructive changes)

---

## 11. Definition of Done

### For Each Task
- [ ] Feature works correctly with test data
- [ ] Loading states shown during data fetch
- [ ] Error states handled gracefully (retry option, not error walls)
- [ ] No `window.alert()` or `console.log()` in production code
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark mode compatible
- [ ] TypeScript — no `any` types
- [ ] Accessible: keyboard navigation, focus management, ARIA labels

### For Full Release
- [ ] All pages load in < 2 seconds (cached data)
- [ ] Screener returns first 5 results in < 5 seconds
- [ ] Scanner analysis completes in < 3 seconds (cached data)
- [ ] No duplicate tickers on dashboard
- [ ] EMA overlay supports any combination of 5 EMAs
- [ ] Chart annotations visible in scanner
- [ ] Stock notes saveable and visible in journal
- [ ] All grids adjustable (2-5 columns)
- [ ] All lists paginated (5 default, load more)
- [ ] Zero `window.alert()` calls in entire codebase
- [ ] Micro-interactions on all interactive elements

---

## Execution Timeline

### Week 1 — Foundation
| Team A | Team B |
|--------|--------|
| A1: Define shared types | B1: Install shadcn/ui |
| A2: Build memory cache | B5: Upgrade CandlestickChart |
| A3: Build DB cache + migration | B3: Build toast system |
| A4: Add caching to API routes | B4: Build skeleton system |

### Week 2 — Core Features
| Team A | Team B |
|--------|--------|
| A5: Paginate screener engine | B6: Upgrade MiniChart |
| A6: Paginate watchlist actions | B2: Build ChartGrid component |
| A7: Paginate journal actions | B7: Add chart annotations |
| A8: Build scanner engine | B8: Rewrite Dashboard page |

### Week 3 — Pages & Polish
| Team A | Team B |
|--------|--------|
| A9: Stock notes system | B9: Rewrite Screener page |
| A10: Scanner history pagination | B10: Rewrite Scanner page |
| (Bug fixes, optimization) | B11: Rewrite Watchlist page |
| | B12: Rewrite Journal page |

### Week 4 — Polish & Release
| Team A | Team B |
|--------|--------|
| Performance testing | B13: Micro-interactions |
| Cache optimization | Cross-browser testing |
| API error handling hardening | Responsive testing |
| Integration testing | Final visual polish |

---

> **Next Step**: Both teams review this plan, agree on the API interfaces in Section 7, then start with their respective Week 1 tasks. Team A starts with `lib/types/index.ts` updates, Team B starts with `shadcn/ui` installation.

---

## 12. Addendum: Missed Points / Needed Additions & Changes
*(Based on client feedback)*

### 1. True TradingView Integration
- **Remove Custom Charts**: Do not just "upgrade" the existing custom canvas chart. Completely replace it with the official **`lightweight-charts`** TradingView library (`npm install lightweight-charts`).
- **Dashboard Main Chart**: Implement actual TradingView charting for the massive 70% screen chunk to natively support dull grids, combinable EMAs, and high-performance zooming/panning.
- **Mini-Frames (Screener & Watchlist)**: Strip down the `lightweight-charts` instances (no axes, no grid lines) to create the uniform "trading view frames" for all grid cards. 

### 2. Fully Adjustable Layouts & Grids
- **Resizable Panels**: Use a proper layout grid (e.g., `react-grid-layout`) or `ResizeObserver`-based flex panels so the TradingView sections and Ledger are entirely adjustable by the user.
- **Responsive Screen Adjustments**: The row counts for the mini frames MUST respond dynamically to screen sizes (2, 3, 4, or 5 columns) based on user toggles and screen limits.

### 3. Qullamaggie-Style Proprietary Scanner & Algos
- **Pattern Algorithms**: The scanner must not just run simple EMA rules; it needs fast backend algorithmic detection for Qullamaggie-style setups (Episodic Pivots, High Tight Flags, breakout detection, volume dry-ups).
- **Historical Event Mapping**: When these algorithms flag a historical match, they must be plotted exactly on the TradingView chart natively via chart markers (arrows/text) at the specific timestamp and price.

### 4. Advanced Multi-Stage Loading
- Skeletons alone are not enough for the scanner. 
- Implement a premium, orchestrated loading sequence to avoid any "choppy or crashy" feel:
  1. *Stage 1*: "Fetching historical data..." (Skeleton frame rendering).
  2. *Stage 2*: "Running Qullamaggie pattern algorithms..." (Animated scan indicator).
  3. *Stage 3*: "Plotting events..." (Seamless transition into the interactive TradingView UI).

### 5. Shared Data Caching for Mini-Frames
- **Fix "Historical Data Not Available"**: Mini TradingView frames must use a shared global data cache (e.g., Zustand or React Query). If data for a ticker was already fetched by the main chart or screener, the mini-frame must use it instantly without re-fetching or failing.

### 6. In-Chart Notes System & Journal
- **Visual Notes**: User notes must not just be text in a side panel. When a user creates a note for a stock in the Scanner, it should optionally render directly ON the TradingView chart (similar to TradingView's text drawing tool) at the specific date/price.
- Clicking a journal entry should immediately open the stock chart and jump to that specific note's location on the chart.

### 7. UX, Icons, and Inputs
- **Heroicons**: Replace all clunky text buttons ("Add to Watchlist", "Remove") with clean **Heroicons** that use hover tooltips. The interface must rely on iconography over big words.
- **No Alerts**: Strictly ban `window.alert()`. Use Shadcn modals/toasts exclusively.
- **Date Selection**: Entirely replace HTML date inputs with a robust Shadcn Calendar/Date Picker component for a premium feel.

---

## 13. Phase C: Integration, Testing & Addendum Handshake
Because Team A and Team B are building in parallel on separate file sets to avoid merge conflicts, a final integration phase is strictly required to tie the full application together.

### C1. API & Global State Wiring
- Team B must strip out any mocked data used during UI development.
- Wire the UI exclusively to Team A's endpoints.
- Establish a **Global Caching Layer** (Zustand or React Query) on the frontend so the Main Chart and Mini-Frames share the identical dataset without re-fetching from the backend.

### C2. The Qullamaggie Data Handshake
- Team A's Qullamaggie scanner will return raw array data pinpointing exact timestamps and prices for breakout events.
- Team B must map this backend response perfectly into `lightweight-charts` native markers to visually plot the arrows/flags directly onto the candlesticks.

### C3. End-to-End Testing (Playwright)
- Utilize the existing `playwright` test setup to run automated E2E tests simulating standard user flows.
- **Key Flows to Test:**
  - Filtering stocks via Screener toggles.
  - Selecting a stock and running a Qullamaggie scan.
  - Ensuring the sequenced loader (Stage 1 -> Stage 2 -> Stage 3) fires smoothly.
  - Adding an in-chart note.
  - Verifying the note appears in the Journal and successfully routes back to the Chart upon clicking.




# StockBros — Section 12 & 13, Revised

This replaces Section 12 (Addendum) and Section 13 (Phase C) in the main
plan. It keeps every original goal but resolves five real conflicts and
gaps that would otherwise cause the two teams to build things that don't
line up, or burn a day discovering a library limitation mid-sprint.

## What changed and why

1. **Item 5's "Zustand or React Query" was left as an open choice.**
   That's the kind of ambiguity that gets resolved twice, differently, by
   two teams. Resolved: **React Query (TanStack Query)** for all
   server-derived data (candles, screener results, scanner results,
   watchlist, journal) — it deduplicates identical requests by cache key
   automatically, which is exactly what "mini-frames shouldn't refetch
   data the main chart already has" needs. Zustand (or plain
   `useState`/context) stays for genuinely client-only state — selected
   grid columns, which EMAs are toggled, which stock is highlighted.
   These solve different problems; using React Query for both eliminates
   a whole category of manual cache-invalidation bugs.

2. **Item 1 says "the official lightweight-charts TradingView library,"
   and item 6 asks for TradingView-style text-drawing annotations.**
   These are not the same product. `lightweight-charts` (free,
   open-source, npm-installable) supports **series markers** — small
   shapes (arrow, circle, square) with a short text label, positioned via
   a separate `createSeriesMarkers()` call in the current major version.
   It does not support boxed, wrapped, free-text annotations — the
   library's own maintainers have confirmed this isn't supported when
   asked directly. That functionality exists only in TradingView's
   separate, licensed Charting Library product, which item 1 correctly
   does *not* propose using. **Resolved:** item 3/C2's pattern markers
   (short-label events) map cleanly to native series markers. Item 6's
   free-text notes need a custom solution — spec'd below — not a library
   feature.

3. **Item 2 proposes `react-grid-layout`, which conflicts with Section
   6's Phase B1/B2, which already chose shadcn's `ResizablePanelGroup`
   for the dashboard split.** Introducing a second, heavier grid library
   for what's actually two different problems (a two-pane resizable
   split vs. a fixed-order card grid with a column-count toggle) is
   unnecessary. **Resolved:** keep `ResizablePanelGroup` for the
   chart/ledger split (already decided, don't redo it); use a plain CSS
   grid with a `columns` state value for the mini-chart grids in
   screener/watchlist/dashboard — no new dependency needed for that part.
   Drop `react-grid-layout` from the plan entirely.

4. **Item 3 names "Qullamaggie-style setups" without defining them**,
   which means two developers implementing "Episodic Pivot" would
   plausibly write two different things. Concrete definitions below,
   written to slot into the existing rule-engine pattern from Section 5
   Phase A3/A4 — extending it, not replacing it. One real structural
   note: unlike the existing single-bar rules (EMA Stack, Consolidation,
   Volume Surge), High Tight Flag is a **multi-window** pattern — it
   can't be evaluated at a single bar in isolation, so its function shape
   is genuinely different. That's called out explicitly below so nobody
   tries to force-fit it into the existing `(bars, index) => boolean`
   signature and gets subtly wrong results.

5. **Addendum item 5 ("shared caching for mini-frames") and Phase C1
   ("establish a global caching layer on the frontend") describe the
   same piece of work twice**, once as a Team B addendum task and once
   as an integration-phase task. Consolidated into one task, owned by
   Team B, done during the addendum phase — not redone during
   integration.

---

## Revised Section 12 — Addendum Work

These slot into the existing Team A / Team B task-checklist format
(Section 5 / Section 6) as new phases, so hour estimates and dependencies
read the same way as the rest of the plan.

### Team A additions

#### Phase A11: Qullamaggie-Style Pattern Rules (Priority: 🔴 Critical)

**Files to modify:** `features/scanner/rules.ts`, `lib/types/index.ts`

**Rule definitions** (extend the `ScreenerRule` type union with
`'episodic_pivot' | 'high_tight_flag' | 'volume_dry_up'`):

**Episodic Pivot** — single-bar rule, same shape as existing rules:
```typescript
// Large gap on high volume, closing strong — classic EP signature
function isEpisodicPivot(bars: StockCandle[], i: number): boolean {
  const gapPct = (bars[i].open - bars[i - 1].close) / bars[i - 1].close;
  const avgVol20 = averageVolume(bars, i - 20, i - 1);
  const closedStrong =
    (bars[i].close - bars[i].low) / (bars[i].high - bars[i].low) >= 0.6;
  return Math.abs(gapPct) >= 0.10 && bars[i].volume >= 2 * avgVol20 && closedStrong;
}
```

**High Tight Flag** — multi-window rule, a genuinely different function
shape from the rest of the engine. Returns a match object with the
detected window bounds (needed for chart drawing in C2), not just a
boolean:
```typescript
interface HTFMatch {
  rallyStartIndex: number;
  rallyEndIndex: number;
  rallyGainPct: number;
  consolidationEndIndex: number;
  consolidationRangePct: number;
}

function findHighTightFlag(
  bars: StockCandle[],
  i: number,
  config = { rallyLookback: 40, rallyMinGainPct: 0.9, consolidationWindow: 15, consolidationMaxRangePct: 0.25 }
): HTFMatch | null {
  // 1. Find the strongest rally ending at or before i within rallyLookback bars
  // 2. Require rallyGainPct >= config.rallyMinGainPct
  // 3. Check the consolidationWindow bars following the rally peak stay within
  //    consolidationMaxRangePct of the peak price
  // 4. Require average volume during consolidation < average volume during rally
  // Return null if any condition fails, otherwise the match with window bounds
}
```

**Volume Dry-Up** — standalone single-bar rule, also usable as a
component check inside High Tight Flag:
```typescript
function isVolumeDryUp(bars: StockCandle[], i: number, shortWindow = 10, longWindow = 40): boolean {
  const recentAvg = averageVolume(bars, i - shortWindow, i);
  const priorAvg = averageVolume(bars, i - longWindow, i - shortWindow);
  return recentAvg < 0.5 * priorAvg;
}
```

**Breakout detection** (used to flag when a High Tight Flag consolidation
resolves): close above the highest high of the consolidation window, on
volume above the recent average.

**Task:** Est. 8h. Depends on A4 (scanner engine) already existing.
Definition of done: unit tests for all three new rules using hand-built
fixture data where the correct answer is known by construction — same
standard as the original screener rules, this is not optional.

#### Phase A12: Scanner Response Shape for Windowed Matches (Priority: 🔴 Critical)

**Files to modify:** `lib/types/index.ts`, `app/api/scanner/route.ts`

The existing `ScanMatch` type (single date + price + description) only
fits single-bar rules. High Tight Flag matches need a **range**, not a
point, so the chart can draw the rally and consolidation zones, not just
a marker. Extend the type rather than force HTF into the existing shape:

```typescript
export interface ScanMatch {
  date: string;
  price: number;
  description: string;
  type: 'entry' | 'exit' | 'signal';
}

// New: for range-based patterns (High Tight Flag)
export interface ScanRangeMatch {
  startDate: string;
  endDate: string;
  rangeType: 'rally' | 'consolidation';
  description: string;
}

export interface ScanResult {
  symbol: string;
  name: string;
  candles: StockCandle[];
  matches: ScanMatch[];
  rangeMatches?: ScanRangeMatch[]; // present only for HTF-type results
  stats: { totalMatches: number; successRate: number; avgReturn: number };
}
```

**Task:** Est. 2h. Depends on A11. Team B's C2 work below consumes this
directly, so this must be agreed and merged before C2 starts.

### Team B additions

#### Phase B14: Shared Chart Component on lightweight-charts v5 (Priority: 🔴 Critical)

**Files to modify:** `features/charts/PriceChart.tsx` (new, replaces the
internals of both `CandlestickChart.tsx` and `MiniChart.tsx` — both
become thin wrappers around this one component so there's one place that
knows the lightweight-charts API, not two).

1. Pin an exact `lightweight-charts` version in `package.json` (not a
   caret range) — the v4→v5 API change (`addCandlestickSeries()` →
   `addSeries(CandlestickSeries, options)`, and markers moving to a
   separate `createSeriesMarkers()` call) means an unpinned auto-upgrade
   mid-project silently breaks every chart. Confirm the actual installed
   version via `node_modules/lightweight-charts/package.json` before
   writing any chart code, don't assume from memory or an old tutorial.
2. Implement multi-EMA rendering as separate line series added via
   `addSeries(LineSeries, { color })`, one per enabled EMA — this library
   doesn't have a single "add these 5 EMAs" call, each is its own series
   that needs adding/removing as the user toggles EMAs.
3. Implement pattern markers via `createSeriesMarkers(series, markers)`,
   not a `.setMarkers()` call on the series itself — that method doesn't
   exist in this version. Map `ScanMatch` items directly to marker
   objects (`shape`, `text`, `position`, `color` by match type).
4. For `ScanRangeMatch` (rally/consolidation zones from High Tight Flag),
   markers alone don't communicate a range — render a subtle shaded
   background band for the date range instead (a positioned overlay
   `<div>`, same technique as B15 below, or a series with area styling
   spanning that range — pick whichever renders more clearly once you
   see it against real data).

**Task:** Est. 10h (increased from the original B5+B7's 12h combined
estimate since this consolidates both charts into one shared component —
net time is similar or less, but it's now one task instead of two
independent ones).

#### Phase B15: In-Chart Notes via HTML Overlay (Priority: 🟡 High)

**Files to create:** `features/charts/ChartNoteOverlay.tsx`

Free-text notes cannot use lightweight-charts' marker system (see
resolution #2 above). Build a positioned HTML overlay instead:

1. Render a `<div>` absolutely positioned over the chart container.
2. For each note with a `chart_date`/`chart_price`, compute its pixel
   position using `chart.timeScale().timeToCoordinate(time)` for x and
   `series.priceToCoordinate(price)` for y.
3. Re-run that calculation on `chart.timeScale().subscribeVisibleTimeRangeChange()`
   and on container resize, so notes stay pinned to the correct
   date/price as the user pans or zooms — this is the part that's easy
   to get wrong (notes drift out of place on interaction if this isn't
   wired up).
4. Render each note as a small clickable icon; clicking opens the note
   content (a shadcn `Popover` anchored to that icon is a good fit —
   reuses B1's component set rather than building a new tooltip system).
5. Handle the case where `timeToCoordinate`/`priceToCoordinate` return
   `null` (point is currently off-screen) — hide that note's icon rather
   than rendering it at a wrong position.

**Task:** Est. 6h. Depends on B14.

#### Phase B16: React Query Migration for Data Fetching (Priority: 🔴 Critical)

**Files to modify:** all pages currently using ad hoc `useEffect` + `fetch`
for candles, screener results, scanner results, watchlist, journal.

1. Install `@tanstack/react-query`, wrap the app in a `QueryClientProvider`
   in `app/layout.tsx`.
2. Replace every manual fetch with a `useQuery` call keyed by
   `['candles', symbol, interval, days]` (and equivalent keys for
   screener/scanner/watchlist/journal) — this is what makes mini-frames
   reuse data the main chart already fetched, automatically, with no
   manual cache object to maintain.
3. Keep Zustand (or plain state) only for UI-only state: selected grid
   column count, toggled EMA set, currently-highlighted symbol.

**Task:** Est. 5h. This absorbs and replaces the original addendum item
5 and Phase C1's "global caching layer" — do not build it twice.

#### Phase B17: Icon & Interaction Consistency Pass (Priority: 🟢 Medium)

shadcn's default components ship with Lucide icons already. Adding
Heroicons on top means two icon sets rendering side by side, which reads
as inconsistent rather than premium. **Recommendation: stay on Lucide**
(already present via shadcn) instead of adding Heroicons as a second
dependency, unless there's a specific icon Lucide is missing that the
design actually needs — check before installing a second icon library
for a handful of icons.

**Task:** Est. 2h (icon audit + swap any inconsistent usages, remove
Heroicons from Section 9's dependency list if not adopted).

### Updated Team task checklists (append to existing tables)

| # | Task | Team | Est. Hours | Dependencies |
|---|------|------|------------|--------------|
| A11 | Qullamaggie pattern rules (EP, HTF, volume dry-up) | A | 8h | A4 |
| A12 | Extend scan result types for range matches | A | 2h | A11 |
| B14 | Shared PriceChart on lightweight-charts v5 | B | 10h | B1 |
| B15 | In-chart notes via HTML overlay | B | 6h | B14 |
| B16 | React Query migration | B | 5h | B1 |
| B17 | Icon consistency pass (Lucide vs Heroicons decision) | B | 2h | B1 |

**New running totals:** Team A +10h (44h total), Team B +21h (82h total,
with B5/B6/B7's original 16h absorbed into B14's 10h — net addendum
addition to Team B is closer to +15h once you account for that overlap).

---

## Revised Section 13 — Phase C: Integration, Testing & Handshake

This phase is inherently sequential/joint — both teams' file sets
converge here. Don't start it until every addendum task above and every
Section 5/6 task is merged into `main`.

### C1. Data Layer Wiring *(joint, ~2h)*

- Confirm Phase B16's React Query migration is fully merged — this *is*
  the "global caching layer," not a separate thing to build now.
- Team B removes any remaining mocked data used during addendum UI
  development, points every `useQuery` at Team A's real endpoints.
- Smoke-test that a symbol shown on the main dashboard chart, the mini
  grid, and the screener all resolve to the same React Query cache entry
  — open React Query Devtools and confirm only one network request fires
  per symbol per session, not three.

### C2. Qullamaggie Handshake *(joint, ~3h)*

- Team A confirms the `ScanResult` shape (Phase A12) matches what Team
  B's `PriceChart` (Phase B14) expects — this is the one contract most
  likely to drift since it was defined across two separate work streams.
- Wire `matches` → `createSeriesMarkers()` calls and `rangeMatches` → the
  shaded-band rendering from B14, item 4.
- Verify visually against at least one real historical High Tight Flag
  example (pick a known past instance in your Nifty 200 universe) rather
  than only synthetic test data — pattern-matching logic that looks
  right in a unit test can still look wrong plotted against real price
  action, and that's only obvious by eye.

### C3. End-to-End Testing *(joint, ~6h)*

**Test data strategy — decide this before writing tests, not during:**
Hitting the real Angel One API in every CI run is slow, rate-limited, and
flaky by nature of depending on an external service. Mock Angel One
responses at the API route boundary for the Playwright suite (fixture
data covering a normal case, a High Tight Flag case, and a no-match
case), and reserve a real-API run for one manual smoke test before each
release rather than every CI run.

**Key flows to test** (from the original plan, plus one addition):
- Filtering stocks via Screener toggles, confirming pagination
  (`offset`/`limit`) behaves correctly across "Load More" clicks.
- Selecting a stock and running a Qullamaggie scan, confirming both point
  matches and range matches render.
- The staged loader (fetch → analyze → plot) — **test via explicit
  state/`data-testid` assertions on each stage, not via timing/sleep
  calls.** Asserting "stage 2 element is visible" is reliable; asserting
  "stage 2 appears after exactly 800ms" is a flaky test waiting to
  happen, since real network/computation timing varies run to run.
- Adding an in-chart note (Phase B15), confirming it appears in the
  Journal, and confirming clicking it from the Journal opens the correct
  chart at the correct position.
- Cross-user isolation: a second test account cannot see the first
  account's watchlist, journal entries, or notes — this should already
  be covered by RLS, but a dedicated E2E assertion here is cheap
  insurance given how much has been added since it was last verified.

### C4. Definition of Done for Phase C

- [ ] React Query Devtools confirms no duplicate fetches for the same
      symbol across main chart, mini-frames, and screener in one session
- [ ] Every `ScanResult` with `rangeMatches` renders both the point
      markers and the shaded range correctly on a real historical example
- [ ] In-chart notes stay correctly positioned through pan/zoom (manually
      verified, not just unit tested — this is a rendering behavior)
- [ ] Full Playwright suite passes against mocked Angel One fixtures
- [ ] One manual smoke test passes against the real Angel One API
      immediately before release
- [ ] Zero `window.alert()` calls remain anywhere in the codebase
      (grep the whole repo, don't rely on memory of what was changed)

---

## Updated Timeline

Add a Week 5 for the addendum + integration work rather than compressing
it into the original Week 3/4, since this is genuinely additional scope
beyond the original plan, not a subset of it:

| Team A | Team B |
|--------|--------|
| A11: Qullamaggie pattern rules | B14: Shared PriceChart on v5 |
| A12: Extended scan result types | B15: In-chart notes overlay |
| (support C2 handshake) | B16: React Query migration |
| | B17: Icon consistency pass |

### Week 6 — Integration & Release
| Joint |
|---|
| C1: Data layer wiring |
| C2: Qullamaggie handshake |
| C3: E2E testing (mocked + one real smoke test) |
| C4: Definition-of-done checklist, then release |