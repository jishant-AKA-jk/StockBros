# System Architecture

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database & Auth**: Supabase (PostgreSQL + Email Magic Link)
- **Hosting**: Vercel (Web/API), Supabase (DB/Auth)

## Data Flow
1. **Server-Side Rendering (SSR)**: Pages fetch initial data securely via Server Components using the Supabase Server Client.
2. **Client-Side Interactivity**: Client components handle user interactions, mutations, and real-time subscriptions, communicating with Supabase or Next.js API Routes.
3. **External APIs**: Broker integrations (e.g., Dhan API) are handled strictly on the server side to prevent exposing sensitive access tokens to the client browser.

## Shared Contracts
Refer to `/lib/types/index.ts` for the single source of truth regarding data shapes (e.g., `PriceBar`, `Symbol`, `WatchlistItem`, `ScreenerRule`, `JournalEntry`). These define the boundaries between features.

## Security & Access Control
- **Row Level Security (RLS)**: Enforced at the Postgres level via Supabase. Users can only read/write their own isolated data based on their `auth.uid()`.
- **API Keys**: Never expose `SUPABASE_SERVICE_ROLE_KEY` or external broker tokens to the client. Use `NEXT_PUBLIC_` prefixes *only* for safe, public-facing keys (like the anon key).
