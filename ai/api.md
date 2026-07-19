# API & Data Access Guidelines

## Supabase
- **Clients**: Use `@supabase/ssr` to instantiate clients. Distinguish strictly between the browser client (for `'use client'` components) and the server client (for RSC and Next.js Route Handlers).
- **Mutations**: Perform database mutations securely using Server Actions where possible. Ensure all tables have active Row Level Security (RLS) policies.

## External Broker Integrations (Dhan & AngelOne)
- **Server-Side Only**: All direct calls to external APIs must originate from the server (Next.js API routes, Server Actions, or internal scripts). This protects sensitive secrets like `DHAN_ACCESS_TOKEN`, `ANGEL_ONE_CLIENT_CODE`, and `TOTP_SECRET`.
- **Rate Limiting & Caching**: Implement robust caching strategies for market data to avoid hitting broker API rate limits. Store historical candle data and symbols in local Supabase tables to minimize external calls.
- **Contract Mapping**: Map external API responses immediately to our internal shared TypeScript interfaces (e.g., `PriceBar`, `Symbol`) at the system boundary. The rest of the app should only deal with internal types, never raw external schemas.

## Scheduled Tasks (Vercel Cron)
- **Execution**: Long-running background jobs (like daily EOD market data refreshes) are triggered via Vercel Cron calling specific `/api/cron/*` endpoints.
- **Security**: Always secure these endpoints by checking the `Authorization` header against the `CRON_SECRET` environment variable to prevent abuse.
