# Folder Map & Routing

A predictable directory structure is crucial for an AI-friendly, scalable repo.

- `/ai`: AI instructions, rules, and guidelines (you are here). Agents must read these before acting.
- `/app`: Next.js App Router root. 
  - `/app/api/cron`: Secured endpoints triggered by Vercel Cron for scheduled jobs.
  - Page routes and global layouts. Heavy business logic is delegated to `/features`.
- `/components`: Shared, generic UI primitives (e.g., Button, Card, Badge). No feature-specific knowledge allowed.
- `/features`: The core of the application. Domain-driven modules.
  - `/features/angelone`: AngelOne broker integration, API client, and models.
  - `/features/charts`: Charting grid, Lightweight Charts wrappers, and visualization tools.
  - `/features/dhan`: Dhan broker API integration logic.
  - `/features/journal`: Trading journal management and entry UI.
  - `/features/screener`: Screener engine rules, logic, and related UI.
  - `/features/watchlist`: Watchlist management logic and UI.
- `/lib`: Shared utilities, configurations, and core services.
  - `/lib/supabase`: Supabase database clients (server & browser) and helpers.
  - `/lib/types`: Universal TypeScript contracts and interfaces.
- `/scripts`: One-off maintenance scripts, database seeding (`seed.ts`), and symbol sync scripts.
- `/supabase/migrations`: Supabase SQL migration files containing schema definitions and RLS policies.
- `/tests`: Comprehensive test suites.
  - `/tests/e2e`: Playwright end-to-end tests for critical user paths.
  - `/tests/integration`: API and DB integration tests.
  - `/tests/features`: Unit tests for feature-specific logic.
- `.github/workflows`: CI/CD pipelines (e.g., Playwright GitHub Actions).
