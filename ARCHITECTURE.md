# Architecture

This document describes the foundational architecture of the StockBros application, an end-of-day (EOD) swing-trading analytics web app.

## Folder Structure

The project is structured into logical domains to enforce separation of concerns.

- `/app`: Next.js App Router definitions. Contains all the page and API routes.
- `/components`: Shared, generic UI components (e.g., buttons, cards, inputs). Does not contain feature-specific logic.
- `/features`: Contains the core domains of the application. Each feature is self-contained.
  - `/features/angelone`: Angel One API data layer for historical OHLC data, rate limiting, and caching.
  - `/features/screener`: Screener and historical signal engine. Pure functions evaluating technical rules over price bars.
  - `/features/charts`: Chart grid UI and lightweight-charts wrappers.
  - `/features/watchlist`: Watchlist UI components and logic.
  - `/features/journal`: Trading journal UI components and logic.
- `/lib/supabase`: Supabase client initialization for server and client contexts.
- `/lib/types`: Shared TypeScript definitions across features.
- `/scripts`: One-off maintenance scripts, such as seeding the symbol universe and backfilling historical data.
- `/tests`: Unit and integration tests mirroring the `/features` structure.
- `/supabase/migrations`: SQL migrations defining the database schema and RLS policies.

## Shared Types

All core data structures are defined in `/lib/types` and shared across features:

- `PriceBar`: Represents EOD price data (`date, open, high, low, close, volume`).
- `Symbol`: Represents a tradable asset (`ticker, angelOneSymbolToken, exchangeSegment, name`).
- `WatchlistItem`: A saved symbol tracked by a user (`userId, symbol, tag, notes, createdAt`).
- `JournalEntry`: A recorded trade for post-analysis (`userId, symbol, setupTag, entryDate, entryPrice, exitDate, exitPrice, notes, rMultiple`).
- `ScreenerRule`: Definition of a technical scan rule (`id, label, description`).

## Phase Ownership

During the multi-phase build process, different branches own specific directories to prevent conflicts:

- **Phase 1A** (`feature/angelone-integration`): Owns `/features/angelone` and relevant `/scripts`.
- **Phase 1B** (`feature/screener-engine`): Owns `/features/screener`.
- **Phase 1C** (`feature/chart-grid`): Owns `/features/charts`.
- **Phase 1D** (`feature/watchlist-journal`): Owns `/features/watchlist`, `/features/journal`, and their corresponding `/app/api` routes.
- **Phase 1E** (Integration/Scripts): Owns `/scripts` (seeding).
