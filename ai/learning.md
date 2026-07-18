# Learnings & Mistakes to Avoid

This document tracks mistakes made during development and architectural decisions to ensure we don't repeat them.

## 1. Tooling & CLI Nuances
- **NPM Naming Restrictions**: Next.js scaffolding fails if the directory contains capital letters. Always initialize projects in lowercase or use temporary directories.
- **TypeScript Empty Interfaces**: ESLint `@typescript-eslint/no-empty-object-type` will fail the production build if empty interfaces (like `interface Props extends HTMLAttributes<T> {}`) are used. Use `type Props = HTMLAttributes<T>;` instead.
- **Slow Network & Cache Misses**: Lengthy npm installs without output can be caused by severe cache misses or network latency. Using `--verbose` and proactively clearing caches can unblock hanging tasks.

## 2. UI & Design System
- **The "Ghost Card" Pattern**: Avoid mixing solid borders with large blurry drop shadows on the same element. It creates cognitive overload. Pick one: a hairline border OR a subtle shadow.
- **Over-rounding**: Keep border radii constrained. `sm` or `md` is appropriate for ledger-style cards. Pill shapes should be reserved solely for tags or buttons.
- **Pre-configured Live Mode**: Setting up `.impeccable/live/config.json` correctly saves time when iterating visually with Impeccable.

## 3. Architecture
- **Component Colocation**: Avoid dumping all components into a global `/components` directory. Only truly generic UI primitives belong there. Feature-specific components must remain inside `/features/[feature-name]/`.
