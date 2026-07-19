# Design System

This project strictly adheres to a "Ledger / field notebook" visual theme. It is disciplined, tactile, and focused, resembling a physical journal rather than a chaotic trading terminal.

For the full, authoritative visual and motion guidelines, please refer to the root documents:
1. `/DESIGN.md` - Core visual tokens, palette strategies, typography rules, and explicit anti-patterns (what NOT to do).
2. `/MOTION.md` - Animation principles, focusing on the "Synchronized cross-fade" signature moment and banning generic excessive motion.

## Quick Reference
- **Colors**: Kraft-paper beige background (`bg-paper`), deep ink-blue primary accents (`bg-primary`), muted red/green for data. Avoid generic cream or pure black.
- **Typography**: Work Sans (Body), Bitter (Display), JetBrains Mono (Numeric Data).
- **Primitives**: Always reuse components from `/components` (Button, Card, Badge, Input, EyebrowLabel). If you need a new element, build it using the established Tailwind tokens and primitives.
- **Tone**: Professional, quiet, and intentional.
