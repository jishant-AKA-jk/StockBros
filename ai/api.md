# API & Data Access Guidelines

## Supabase
- **Clients**: Use `@supabase/ssr` to instantiate clients. Distinguish strictly between the browser client (for `'use client'` components) and the server client (for RSC and Next.js Route Handlers).
- **Mutations**: Perform database mutations securely using Server Actions where possible. Ensure all tables have active Row Level Security (RLS) policies.

## External Integrations (Dhan API)
- **Server-Side Only**: All direct calls to external APIs must originate from the server (Next.js API routes or Server Actions). This protects sensitive secrets like `DHAN_ACCESS_TOKEN` and `DHAN_CLIENT_ID`.
- **Rate Limiting & Caching**: Implement robust caching strategies for market data to avoid hitting broker API rate limits. Store historical candle data in the local `price_cache` Supabase table to minimize external calls.
- **Contract Mapping**: Map external API responses immediately to our internal shared TypeScript interfaces (e.g., `PriceBar`, `Symbol`) at the system boundary. The rest of the app should only deal with internal types, never raw external schemas.
