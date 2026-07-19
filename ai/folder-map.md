# Folder Map & Routing

A predictable directory structure is crucial for an AI-friendly, scalable repo.

- `/ai`: AI instructions, rules, and guidelines (you are here). Agents must read these before acting.
- `/app`: Next.js App Router root. Contains page routes, global layouts, and API routes. Only routing and page composition happen here; heavy business logic is delegated to `/features`.
- `/components`: Shared, generic UI primitives (e.g., Button, Card, Badge). No feature-specific knowledge allowed.
- `/features`: The core of the application. Domain-driven modules.
  - `/features/dhan`: Dhan broker API integration logic and order components.
  - `/features/screener`: Screener engine rules, logic, and related UI.
  - `/features/charts`: Charting grid and visualization tools.
  - `/features/watchlist`: Watchlist management logic and UI.
  - `/features/journal`: Trading journal management and entry UI.
- `/lib`: Shared utilities, configurations, and core services.
  - `/lib/supabase`: Supabase database clients (server & browser) and helpers.
  - `/lib/types`: Universal TypeScript contracts and interfaces.
- `/scripts`: One-off maintenance scripts, database seeding, or migrations.
- `/supabase/migrations`: Supabase SQL migration files containing the schema definitions.
- `/tests`: Unit and integration tests, explicitly mirroring the `/features` and `/lib` directory structure.
