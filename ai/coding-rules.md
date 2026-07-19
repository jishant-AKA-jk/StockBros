# Coding & Architecture Rules

These rules ensure the codebase remains easy to understand, extend, and maintain for the long run. Follow these for an enterprise-scalable repo.

## 1. Modularity & The Feature-Driven Architecture
- **Feature Folders**: All business logic, UI components, and state related to a specific feature (e.g., `angelone`, `dhan`, `screener`, `charts`) must live strictly inside `/features/[feature-name]`.
- **Global Components**: `/components/ui` is STRICTLY for generic UI primitives (Button, Card, Input). If a component knows about "stocks", "orders", or "users", it is NOT generic and belongs in a feature folder.

## 2. DRY & Generic Functions
- **Extract Shared Logic**: Any utility or helper function used across multiple features should be extracted into `/lib/utils.ts` or a specific library module. 
- **Avoid Duplication**: Do not rewrite API fetching logic, date formatting, or math calculations in every component. Use shared data-access layers and helpers.

## 3. Predictability & Clean Code
- **Explicit Typings**: Rely heavily on the shared contracts in `/lib/types/index.ts`. Do not redefine core entity types locally. If a type needs to be shared across features, add it to the global types.
- **Single Responsibility Principle**: A component should do one thing. If a component fetches data, parses it, and renders a complex UI, split it into a Container (data fetching/logic) and a Presentational (UI/dumb) component.

## 4. Testing & CI/CD
- **E2E Testing Required**: Any new critical user path must be covered by a Playwright E2E test in `/tests/e2e`. Add `data-testid` attributes to interactive elements to make them easily selectable.
- **Unit/Integration**: Complex logic (like Screener algorithms or Broker API integrations) must have unit tests written in Jest in `/tests/features` or `/tests/integration`.
- **CI/CD Strictness**: No code should be merged into `development` or `master` unless it passes the GitHub Actions CI pipeline (Linting, TypeScript builds, and Playwright tests).

## 5. Enterprise Scalability
- **Server Components by Default**: Use Next.js React Server Components (RSC) to reduce the client bundle size. Only add `'use client'` when interactivity (hooks, event listeners, window access, or charting) is strictly required.
- **Type Safety End-to-End**: Ensure all DB calls and external API calls are strictly typed at the boundary before passing data into components.

## 6. Database Migrations & Supabase Workflow
- **Always Migrate**: Whenever you need a new table, column, or RLS policy, you MUST create a `.sql` migration file in `supabase/migrations`. Never edit the database directly through the dashboard.
- **Apply Changes (Cloud Dev / Production)**: To apply your migrations to a live cloud project (like your Dev environment or Production), run: `npx supabase db push`.
- **Apply Changes (Local Docker)**: To rebuild a local Docker database, run: `npx supabase db reset`.
- **Post-Deploy Scripts**: After pushing your database to Production or Dev for the first time, run `npm run sync-symbols` to fetch the real stock list. **NEVER run `npm run seed` in Production!**
