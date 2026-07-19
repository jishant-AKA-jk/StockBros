# Phase 2 Development Plan: UX overhaul, Algorithmic Scanning & Performance

Based on your comprehensive feedback, the current architecture suffers from heavy server-side data loading (causing slow page transitions), overlapping responsibilities between Screener/Scanner, and a lack of premium tactile UX (resizability, modals, dynamic grids).

To execute this pivot rapidly without merge conflicts, we will split the development into two completely isolated domains for **Team Alpha** and **Team Beta**.

---

## 🏗 Architectural Upgrades (Global)
1. **Shadcn UI Integration**: Replace raw alerts and basic selects with premium Shadcn components (`Resizable`, `Dialog`, `Toast`, `Skeleton`, `Tooltip`).
2. **Client-Side Pagination**: Move heavy data fetching out of Server Components (`page.tsx`) into paginated API routes (`/api/...`). Use Skeletons while data fetches.
3. **Database Upgrade**: Add a `chart_notes` table in Supabase to link notes directly to specific timestamps on stock charts.

---

## 🛠 Team Alpha: Core UI, Charting Engine & Dashboard
**Domain Isolation:** `components/ui/*`, `features/charts/*`, `app/dashboard/*`, `app/api/charts/*`

**Responsibilities:**
1. **TradingView Engine Overhaul**:
   - Clean up candlestick visuals (dull grids, highlight only candle and current price).
   - Fix the "historical data not available" and duplicate ticker bugs in the chart mapping logic.
   - Build a dynamic grid wrapper to allow users to toggle column counts (2, 3, 4, or 5 charts per row) responsive to screen size.
   - Implement customizable and combinable EMAs on the charts.
2. **Dashboard Layout**:
   - Implement `shadcn/ui` **Resizable Panels** so the user can drag and adjust the width ratio between the Chart Grid and the Trading Ledger.
3. **Global UX System**:
   - Setup Shadcn Toasts to replace all `alert()` calls globally.
   - Build high-quality Loading Skeletons for charts to prevent the app from feeling "choppy" or "crashy".
   - Build an API route for fetching paginated chart data to speed up initial loads.

---

## 🔬 Team Beta: Algorithmic Scanners, Screener & Journal
**Domain Isolation:** `app/screener/*`, `app/scanner/*`, `app/watchlist/*`, `app/journal/*`, `features/screener/*`, `lib/supabase/*`

**Responsibilities:**
1. **Screener Page (Market-wide Filtering)**:
   - Convert to a paginated client-side view (fetch max 5 initially, add "Load More" button).
   - Add toggleable UI pills for rules (EMA Stack, Consolidation, Volume Surge).
   - Display results using Team Alpha's Chart Grid (default 2 per row, adjustable).
   - Implement Heroicon toggle for Watchlist (Add/Remove) with tooltips and silent Toasts (no alerts).
2. **Scanner Page (Single Stock Deep-Dive)**:
   - Redesign for a **Single Stock View**.
   - The user selects one stock and runs a proprietary historical scan (like Qullamaggie setups).
   - Render a large single chart highlighting the exact historical timestamps where the algorithm conditions were met.
   - Integrate a "Take Note" feature directly on the chart using modals.
   - Implement heavy loading screens (Skeletons/Spinners) while the proprietary algo runs on the backend to provide tactile feedback.
3. **Watchlist Page**:
   - Update to use the paginated Chart Grid (max 5 default, Load More).
4. **Journal Page**:
   - Improve the Date Selection UI.
   - Fetch and display the notes taken from the Scanner page.
   - Clicking a note should open a Modal/Dialog showing the historic chart view with the note pinned to it.

---

## 🚦 Execution Strategy to Prevent Merge Conflicts
- **Team Alpha** works exclusively on the visual components and the Charting library wrapper. They do not touch the business logic of the Screener or Scanner.
- **Team Beta** works exclusively on the data fetching, algorithmic logic, and page assembly. They will import the `ChartGrid` component and simply pass data into it.
- **Dependency Management**: Team Alpha must build the `ChartGrid` props interface (e.g., `columns`, `data`) first and communicate it to Team Beta so both teams can work concurrently against a shared contract.
