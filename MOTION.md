# Motion Principles

This document defines the animation and interaction principles for StockBros. Any future contributor (including Phase 6 animation passes) MUST adhere to these rules. The goal is to maintain the disciplined, tool-like feel of a field notebook or ledger, avoiding the floaty, noisy feel of typical consumer apps.

## 1. The Rule of One
One orchestrated page-load reveal is acceptable. Scattered fade-ins on every individual element are not. Pick **one** moment to draw the eye, rather than staggering animations across everything.

## 2. The Signature Interaction
The core value proposition of this application is the synchronized multi-chart control.
When the global timeframe or EMA-overlay toggle is switched in the chart grid, every chart in the grid performs one synchronized transition together — a brief cross-fade (150–200ms, ease-in-out) that reads like turning a page across every card at once.

This is the **only** bold, memorable animation in the whole app. Nothing else should compete with this moment for attention.

## 3. Hover States
Hover states on interactive cards and buttons get a subtle, small lift, color shift, or shadow change only.
- **NO bounce**
- **NO spring easing**
- **NO scale gimmicks**

## 4. Explicitly Forbidden
Do NOT add any of the following to this application:
- Particle effects
- Excessive parallax scrolling
- Animated gradients
- Confetti, celebration, or "gamified" animations

These read as generic and completely undermine the disciplined ledger tone of the product.

## 5. Accessibility (Prefers-Reduced-Motion)
Every animation MUST respect `prefers-reduced-motion`.
When a user has requested reduced motion, all animations must fall back to an instant transition or a simple opacity-only cross-fade. There are no exceptions to this rule. (See `signature-transition` in `globals.css` for an example of this enforcement).
