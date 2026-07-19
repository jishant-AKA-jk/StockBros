# Detailed Plan for Points 12 and 13 (Addendum & Phase C Integration)

> **Goal:** Provide a comprehensive, actionable, step-by-step breakdown for Team A and Team B to implement the critical additions and final integration phase that were originally missed.

---

## 12. Addendum Execution (Detailed Breakdown)

### 12.1 True TradingView Integration (`lightweight-charts`)
**Assigned To:** Team B
1. **Dependency Installation:** Run `npm install lightweight-charts`.
2. **Main Dashboard Chart (`features/charts/TradingViewChart.tsx`)**:
   - Initialize the chart using `createChart(container, options)`.
   - Apply strict layout options for the TradingView dark theme (e.g., `layout: { background: { type: ColorType.Solid, color: '#09090B' }, textColor: '#A1A1AA' }`).
   - Configure grid lines to be ultra-dull: `grid: { vertLines: { color: 'rgba(255, 255, 255, 0.05)' }, horzLines: { color: 'rgba(255, 255, 255, 0.05)' } }`.
   - Add the Candlestick series with glowing green (`#22c55e`) and red (`#ef4444`) colors.
3. **Combinable EMAs**:
   - Create a React state array for active EMAs (e.g., `[20, 50]`).
   - For each active EMA, calculate the data points client-side and add a `addLineSeries()` to the chart instance with a unique color.
4. **Mini-Frames (`features/charts/MiniTradingView.tsx`)**:
   - Create a stripped-down version of the chart.
   - Disable axes: `timeScale: { visible: false }`, `rightPriceScale: { visible: false }`.
   - Disable all grid lines.
   - Lock crosshair and scrolling: `handleScroll: false, handleScale: false`.

### 12.2 Fully Adjustable Layouts & Grids
**Assigned To:** Team B
1. **Dependency Installation:** Run `npm install react-grid-layout`.
2. **Dashboard Layout (`app/dashboard/page.tsx`)**:
   - Wrap the TradingView chart and Ledger in a `<ResponsiveGridLayout>`.
   - Allow dragging the divider left/right. State should be persisted to `localStorage` so the layout is remembered.
3. **Responsive Grid System (`components/ChartGrid.tsx`)**:
   - Define exact breakpoints: `{ lg: 1200, md: 996, sm: 768, xs: 480 }`.
   - The user selects column counts (2, 3, 4, 5). Map this to grid fractions (e.g., 5 columns = 20% width per item).
   - Use `ResizeObserver` within the `MiniTradingView` component to ensure the `lightweight-charts` instance calls `chart.resize(width, height)` instantly when the grid changes.

### 12.3 Qullamaggie-Style Scanner & Algos
**Assigned To:** Team A
1. **Algorithm Engine (`features/scanner/algorithms/qullamaggie.ts`)**:
   - **High Tight Flags (HTF)**: Scan for a >90% move in <8 weeks, followed by a tight consolidation (ATR dropping) of <20% depth.
   - **Episodic Pivots (EP)**: Scan for a sudden massive volume spike (e.g., >300% relative volume) combined with a gap up or large range candle breaking out of a multi-month base.
   - **Volume Dry-Ups**: Scan the consolidation phase for volume dropping below the 50-day average volume right before the breakout.
2. **Endpoint Enhancement (`app/api/scanner/route.ts`)**:
   - Return mapped events: `[{ date: '2026-03-10', price: 152.00, type: 'EP_BREAKOUT', text: 'EP Breakout (350% Vol)' }]`.

### 12.4 Advanced Multi-Stage Loading
**Assigned To:** Team B
1. **Loading State Machine (`features/scanner/useScanner.ts`)**:
   - `IDLE`: Waiting for user input.
   - `FETCHING_DATA`: Render the skeleton of the main TradingView chart.
   - `RUNNING_ALGOS`: Overlay an animated glowing scan line moving left-to-right over the skeleton chart. Text: "Running Qullamaggie pattern algorithms..."
   - `PLOTTING`: Instantly swap the skeleton for the real `lightweight-charts` instance, rendering candles sequentially if possible.

### 12.5 Shared Data Caching for Mini-Frames
**Assigned To:** Team B
1. **Zustand Store (`lib/store/useMarketDataStore.ts`)**:
   - Store structure: `{ candles: Record<string, StockCandle[]> }`.
2. **Data Flow**:
   - When the dashboard or screener fetches `RELIANCE` data, it sets it in the store: `setCandles('RELIANCE', data)`.
   - The `MiniTradingView` component subscribes to `useMarketDataStore((state) => state.candles[symbol])`.
   - If data exists, it renders immediately (no "historical data not available" errors). If undefined, it shows a skeleton and triggers a fetch.

### 12.6 In-Chart Notes System & Journal
**Assigned To:** Team A & B
1. **Team A (Backend)**: Ensure `stock_notes` table has `timestamp` (UNIX) and `price` (Numeric) columns.
2. **Team B (Frontend)**:
   - When viewing the Scanner, add an "Add Note Mode" toggle.
   - User clicks on the chart -> captures timestamp/price from `lightweight-charts` crosshair -> opens a Shadcn modal to type the note.
   - Save via server action, then render on the chart using `series.setMarkers()`.
3. **Journal Link**: Clicking a journal entry passes `?symbol=XYZ&focusTime=1704067200` to the Scanner URL. The scanner mounts, fetches data, and calls `chart.timeScale().scrollToPosition()` to center on the note.

### 12.7 UX, Icons, and Inputs
**Assigned To:** Team B
1. **Heroicons Audit**: Search codebase for all text buttons ("Add", "Remove", "Scan", "Save"). Replace with `@heroicons/react/24/outline`.
2. **Alert Audit**: Search for `window.alert`. Replace with `toast.error()` or `toast.success()` from `sonner` or shadcn.
3. **Date Picker**: Use `npx shadcn@latest add calendar popover`. Replace all native `<input type="date">`.

---

## 13. Phase C: Integration, Testing & Addendum Handshake

### C1. API & Global State Wiring
- **Action**: Team B removes all `mockCandles.ts` or static JSON files.
- **Action**: All chart components are pointed to the Zustand store.
- **Verification**: Load the dashboard. Ensure the network tab shows exactly ONE request per symbol, and the mini-frames instantly render using the cached Zustand data.

### C2. The Qullamaggie Data Handshake
- **Action**: Team B takes the `matches` array from Team A's `/api/scanner` response.
- **Action**: Map it to TradingView markers:
  ```typescript
  const markers = matches.map(match => ({
    time: match.date, // Must be UNIX timestamp or YYYY-MM-DD
    position: 'aboveBar',
    color: '#e91e63',
    shape: 'arrowDown',
    text: match.text
  }));
  candlestickSeries.setMarkers(markers);
  ```

### C3. End-to-End Testing (Playwright)
- **Assigned To:** Both Teams (QA)
- **Test 1: Core Flow**:
  - Login -> Go to Screener -> Toggle "Episodic Pivot" -> Wait for grid to load.
- **Test 2: Scanner & Multi-Stage Loader**:
  - Click a stock from Screener -> Route to Scanner.
  - Assert the DOM contains "Fetching historical data..." -> then "Running Qullamaggie pattern algorithms...".
  - Assert the TradingView canvas renders.
- **Test 3: Interactive Notes**:
  - Simulate a chart click to open the note modal.
  - Type "Looks like a solid flag" -> Save.
  - Go to Journal -> Assert note exists -> Click note -> Assert routing back to Scanner chart.
