# Learnings & Mistakes to Avoid

This document tracks critical technical mistakes, edge cases, and hard-earned lessons during development to ensure we never repeat them.

## 1. Tooling, Dependencies, & Build Process
- **Supabase Client Initialization**: Always lazily initialize the Supabase client inside route handlers and server components. Eager initialization at the module level will cause Next.js build-time crashes if environment variables are missing during CI/CD steps.
- **NPM Naming Restrictions**: Next.js scaffolding fails if the directory contains capital letters. Always initialize projects in lowercase or use temporary directories.
- **TypeScript Empty Interfaces**: ESLint `@typescript-eslint/no-empty-object-type` will fail the production build if empty interfaces (like `interface Props extends HTMLAttributes<T> {}`) are used. Use `type Props = HTMLAttributes<T>;` instead.
- **Missing Peer Dependencies**: When integrating complex auth systems (like AngelOne's TOTP), ensure all peer dependencies (e.g., `totp-generator`) are strictly added to `package.json` to prevent runtime crashes.

## 2. UI & Design System
- **The "Ghost Card" Pattern**: Avoid mixing solid borders with large blurry drop shadows on the same element. It creates cognitive overload. Pick one: a hairline border OR a subtle shadow.
- **Over-rounding**: Keep border radii constrained. `sm` or `md` is appropriate for ledger-style cards. Pill shapes should be reserved solely for tags or buttons.
- **Lightweight Charts Rendering**: `lightweight-charts` must be rendered exclusively in Client Components. Never attempt to SSR canvas-based charts, and handle window resize events with a `ResizeObserver` carefully to prevent memory leaks.

## 3. Architecture & Code Organization
- **Component Colocation**: Avoid dumping all components into a global `/components` directory. Only truly generic UI primitives belong there. Feature-specific components must remain inside `/features/[feature-name]/`.
- **Cron Jobs Security**: Vercel Cron jobs trigger specific API routes (e.g., `/api/cron/refresh-eod`). Always verify the `Authorization` header with `process.env.CRON_SECRET` to prevent unauthorized execution of heavy sync scripts.
