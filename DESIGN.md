---
name: StockBros
description: The Unified Trading Ledger
colors:
  primary: "#1A4731"
  signature: "#A04020"
  paper: "#E6E2D8"
  surface: "#F2EFE9"
  ink: "#2A2725"
  ink-light: "#595551"
  data-up: "#166534"
  data-down: "#991B1B"
  hairline: "#D6D3D1"
typography:
  display:
    fontFamily: "var(--font-display), serif"
  body:
    fontFamily: "var(--font-sans), sans-serif"
  label:
    fontFamily: "var(--font-mono), monospace"
rounded:
  default: "4px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.default}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.default}"
---

# Design System: StockBros

## 1. Overview

**Creative North Star: "The Unified Trading Ledger"**

A tactile, focused, and calm environment designed to bring all essential trading data into one place, saving disciplined traders their most precious resource: time. The aesthetic relies heavily on the physical feel of a field notebook, favoring stark hairlines and restrained whitespace over decorative elements. This system explicitly rejects flashy UI, noisy colors, and generic TradingView-style dark terminal looks.

**Key Characteristics:**
- **Time-Saving Focus:** No wasted pixels, everything serves the trader's process.
- **Ledger Aesthetics:** Hairline borders instead of heavy shadows.
- **Intentional Restraint:** Use of a single bold signature color sparingly.

## 2. Colors

A disciplined palette anchored by warm kraft-paper neutrals and distinct, muted data indicators.

### Primary
- **Deep Evergreen** (#1A4731): Used for actionable elements and primary buttons. Provides strong contrast against the paper background without screaming for attention, replacing the default blue.

### Secondary
- **Wax Seal Sienna** (#A04020): Used *sparingly*—only for the single signature moment (e.g., the global sync toggle).

### Neutral
- **Kraft Paper** (#E6E2D8): The canvas of the app. Distinguishable from generic cream.
- **Clean Off-White** (#F2EFE9): Used for surface cards resting on the paper background.
- **Warm Ink** (#2A2725): Primary text. Reads like fountain-pen ink, not default UI gray.
- **Light Ink** (#595551): Secondary text.
- **Hairline** (#D6D3D1): Subtle dividers and structural borders.

### Data
- **Muted Forest Green** (#166534): Positive data indicators.
- **Muted Brick Red** (#991B1B): Negative data indicators.

**The Signature Restraint Rule.** The signature sienna color is the only bold accent allowed. Use it on ≤5% of the screen. Its rarity is the point.

## 3. Typography

**Display Font:** Bitter (Slab Serif)
**Body Font:** Work Sans (Humanist Sans)
**Label/Mono Font:** JetBrains Mono (Monospace)

**Character:** A highly intentional pairing that blends the readability of a humanist sans with the precise, tabular data delivery of a true coding monospace font.

### Hierarchy
- **Display**: Hero headlines and wordmarks only. Used with restraint.
- **Body**: Standard prose, descriptions, and structural UI text.
- **Label**: Every price, percentage, and numeric table cell. Tabular figures create a precise ledger feel.

**The Numeric Precision Rule.** Any data point representing a price, R-multiple, or percentage must use the monospace font to ensure tabular alignment and precision.

## 4. Elevation

Completely flat with no shadows at all, purely reliant on borders and paper textures.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are completely flat. Structural hierarchy is achieved purely through hairline borders and background color differences between `paper` and `surface`.

## 5. Components

Refined and restrained, acting as subtle containers for critical data.

### Buttons
- **Shape:** Minimal rounding (4px-8px).
- **Primary:** Deep Evergreen background with white text.
- **Hover / Focus:** Slight background darkening, maintaining the flat profile.

### Cards / Containers
- **Corner Style:** Minimal rounding.
- **Background:** Clean Off-White (`surface`).
- **Shadow Strategy:** Zero shadow. Flat against the background.
- **Border:** Subtle hairline border (`border-hairline`).

### Eyebrow Labels
- **Style:** Small, letter-spaced, uppercase font using the body sans-serif. Used to evoke ledger column headers.

## 6. Do's and Don'ts

### Do:
- **Do** rely on hairline borders and background contrast for layout structure.
- **Do** use the monospace font for all financial data and metrics.
- **Do** respect `prefers-reduced-motion` for all transitions (falling back to instant or simple opacity transitions).

### Don't:
- **Don't** use TradingView's dark blue-on-black terminal look.
- **Don't** use generic AI-default looks (cream+terracotta, neon on black, zero-radius broadsheet).
- **Don't** use box shadows for elevation. Cards must sit flat on the paper background.
- **Don't** use particle effects, excessive parallax, animated gradients, or confetti.
