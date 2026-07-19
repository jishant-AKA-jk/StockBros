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
