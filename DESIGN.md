# Design System & Visual Identity

This document defines the foundational design tokens and visual strategy for the StockBros application. It serves as the source of truth for all feature UI development (Phase 1+).

## The Concept: Ledger / Field Notebook
The product must feel like a disciplined trader's paper journal brought into software, not a cold trading terminal. The app's differentiator is the setup-tagged journal; the UI should feel like an extension of that discipline.

### What NOT to do (Explicitly Avoid):
1. **The TradingView Terminal Look:** Dark blue/black backgrounds, glowing lines, pure tech feel.
2. **The "AI Startup" Default A:** Cream background + terracotta/orange accent.
3. **The "AI Startup" Default B:** Near-black background with a single neon green or acid yellow accent.
4. **The "Broadsheet" Look:** Newspaper columns with zero border-radius and heavy black borders.

## Design Tokens

### Color Palette
We use named tokens mapping to CSS variables (defined in `globals.css` and `tailwind.config.ts`). Avoid raw hex codes in markup.
- **Paper (`bg-paper`)**: Warm, muted kraft-paper beige. The canvas of the app. Distinguishable from generic cream.
- **Surface (`bg-surface`)**: A slightly lighter, cleaner off-white for cards resting on the paper background.
- **Ink (`text-ink`, `text-ink-light`)**: Warm near-black. Reads like fountain-pen ink, not default UI gray.
- **Primary (`bg-primary`, `text-primary`)**: Deep ink-blue. Used for actionable elements and primary buttons.
- **Signature (`bg-signature`, `text-signature`)**: Muted burnt-sienna/wax-seal tone. Used *sparingly*—only for the single signature moment (e.g., the global sync toggle).
- **Data Up/Down (`text-data-up`, `bg-data-down`)**: Muted forest green and muted brick red. Legible but explicitly NOT the saturated bright red/green of typical trading platforms.

### Typography
We use three specific font families to establish hierarchy and tone:
- **Display (`font-display`)**: Bitter (Slab Serif). Characterful, used with restraint for headers and the wordmark. NOT for body text.
- **Body (`font-sans`)**: Work Sans. A clean humanist sans with more personality than default geometric sans-serifs (like Inter).
- **Data/Numeric (`font-mono`)**: JetBrains Mono. Monospace with tabular figures enabled. Used for EVERY price, percentage, and numeric table cell. This creates a precise, intentional ledger feel.

### Layout & Borders
- **Ledger Structure**: Use thin hairline rules (`border-hairline`) between rows instead of heavy borders or drop shadows.
- **Eyebrow Labels**: Small, letter-spaced, uppercase headers (evoking ledger column headers) are used to introduce sections. Use them where they carry information, not just for decoration.
- **Cards**: Read like index cards or ledger pages. Subtle texture or fine borders (`border-hairline`). Avoid heavy skeuomorphism.

## Usage Guide
When building new features, rely exclusively on the primitive components in `/components` (e.g., `Card`, `Button`, `Badge`, `EyebrowLabel`, `Input`). If a new UI element is required, compose it using the defined Tailwind tokens above to maintain the "field notebook" integrity.
