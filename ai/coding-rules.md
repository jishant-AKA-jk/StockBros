# Coding & Architecture Rules

These rules ensure the codebase remains easy to understand, extend, and maintain for the long run. Follow these for an enterprise-scalable repo.

## 1. Modularity & The Feature-Driven Architecture
- **Feature Folders**: All business logic, UI components, and state related to a specific feature (e.g., `dhan`, `screener`, `charts`) must live strictly inside `/features/[feature-name]`.
- **Global Components**: `/components` is STRICTLY for generic UI primitives (Button, Card, Input). If a component knows about "stocks", "orders", or "users", it is NOT generic and belongs in a feature folder.

## 2. DRY & Generic Functions
- **Extract Shared Logic**: Any utility or helper function used across multiple features should be extracted into `/lib/utils.ts` or a specific library module. 
- **Avoid Duplication**: Do not rewrite API fetching logic, date formatting, or math calculations in every component. Use shared data-access layers and helpers.

## 3. Predictability & Clean Code
- **Explicit Typings**: Rely heavily on the shared contracts in `/lib/types/index.ts`. Do not redefine core entity types locally. If a type needs to be shared across features, add it to the global types.
- **Single Responsibility Principle**: A component should do one thing. If a component fetches data, parses it, and renders a complex UI, split it into a Container (data fetching/logic) and a Presentational (UI/dumb) component.

## 4. UI Rules
- Follow the visual rules in `/DESIGN.md` and animation rules in `/MOTION.md`.
- Stick to the defined color palette and typography scales.
- Respect `prefers-reduced-motion` in all interactive components.
- Maintain accessible contrast ratios (minimum 4.5:1 for body text).

## 5. Enterprise Scalability
- **Server Components by Default**: Use Next.js React Server Components (RSC) to reduce the client bundle size. Only add `'use client'` when interactivity (hooks, event listeners, window access) is strictly required.
- **Type Safety End-to-End**: Ensure all DB calls and external API calls are strictly typed at the boundary before passing data into components.
