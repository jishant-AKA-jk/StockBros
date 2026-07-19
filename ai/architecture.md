# System Architecture

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Ledger Theme)
- **Database & Auth**: Supabase (PostgreSQL + Email Magic Link)
- **Broker Integrations**: Dhan API, AngelOne API
- **Charts**: Lightweight Charts
- **Testing**: Playwright (E2E), Jest (Unit/Integration)
- **Hosting & CI**: Vercel (Web/API/Cron), GitHub Actions (CI)

## Data Flow
1. **Server-Side Rendering (SSR)**: Pages fetch initial data securely via React Server Components (RSC) using the Supabase Server Client.
2. **Client-Side Interactivity**: Client components handle user interactions, charting, and mutations. They communicate with the server via Next.js Server Actions or API Routes.
3. **External APIs**: Broker integrations (Dhan, AngelOne) are executed strictly on the server-side to prevent exposing sensitive tokens (Client IDs, TOTP secrets) to the browser.
4. **Scheduled Sync**: Vercel Cron jobs trigger endpoints (e.g., `/api/cron/refresh-eod`) on a schedule to fetch end-of-day market data and sync it to our Supabase database.

## Shared Contracts
Refer to `/lib/types/index.ts` for the single source of truth regarding data shapes (e.g., `PriceBar`, `Symbol`, `WatchlistItem`, `ScreenerRule`, `JournalEntry`). These enforce strict boundaries between modules and APIs.

## Security & Access Control
- **Row Level Security (RLS)**: Enforced at the Postgres level via Supabase. Users can only read/write their own isolated data (`auth.uid() = user_id`).
- **API Keys**: Never expose `SUPABASE_SERVICE_ROLE_KEY` or external broker tokens to the client. Use `NEXT_PUBLIC_` prefixes *only* for safe, public-facing keys.
- **Cron Authentication**: Cron endpoints must validate a secret token before executing heavy operations.
