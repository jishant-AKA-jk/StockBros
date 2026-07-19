# Antigravity Build Prompts — Swing Trading Command Center

## Running this as a 2-developer sprint

If there are two of you, don't just run four Phase 1 sessions each — split
by track instead so you're never both mid-edit on the same files. Full
schedule:

| Stage | Dev A | Dev B | Sync after? |
|---|---|---|---|
| 0 | *(either, solo)* Phase 0 | — | Yes — branch off this |
| 1 | Phase 1A | Phase 0.5 | No |
| 2 | Phase 1B | Phase 1C | No |
| 3 | Phase 1E (new, below) | Phase 1D | Yes — merge everything |
| 4 | Phase 2A (new, below) | Phase 2B (new, below) | Yes — merge |
| 5 | Phase 3 | Phase 6A (new, below) | No |
| 6 | Phase 5 | Phase 4 | Yes — final merge |
| 7 | *(joint, ~30 min)* Phase 6B | | Ship |

Phase 2 and Phase 6 below are the original single-developer versions —
skip them if you're running the 2-dev track and use 2A/2B/6A/6B instead.

---

## How to use this document

- **Phase 0 runs alone**, in one `agy` session, Review-driven mode. Everything else depends on it.
- **Phase 0.5 runs alone, right after Phase 0**, Review-driven mode. It produces the design token system every Phase 1 UI prompt (1C, 1D) is required to consume — this has to exist before parallel UI work starts, not after.
- **Phase 1 has four prompts (1A–1D) that run in parallel** — open four terminals, `cd` into the same repo, check out one branch per terminal (`feature/angelone-integration`, `feature/screener-engine`, `feature/chart-grid`, `feature/watchlist-journal`), run `agy` in each, and paste the matching prompt. Agent-driven mode is fine here because each prompt's file boundaries are explicit and non-overlapping.
- **After Phase 1**, merge all four branches into `main` yourself (resolve any trivial conflicts — there shouldn't be many since the folders don't overlap) before starting Phase 2.
- **Phases 2–6 run solo, in order, Review-driven mode.** Each depends on the previous one being actually done, not just started.
- Paste one phase at a time. Don't queue multiple phases into one message — that's exactly the "lazy single mega-prompt" failure mode.

---

## Phase 0 — Foundation & Shared Contracts *(solo)*

```
You are setting up the foundation for a swing-trading analytics web app.
This is Phase 0 of a multi-phase build; later phases will be executed by
separate agent sessions working in parallel on different modules, so your
most important job is to create clean boundaries and shared contracts they
can all build against without touching each other's files.

Tech stack (do not deviate):
- Next.js 14+ (App Router), TypeScript, Tailwind CSS
- Supabase for Postgres + Auth (email magic link)
- Deployment target: Vercel (frontend/API) + Supabase (DB/auth), free tiers

Tasks:
1. Scaffold a Next.js + TypeScript + Tailwind project.
2. Create this folder structure exactly, with a short comment in each
   folder's entry file describing its responsibility, so later agents know
   exactly where their code belongs and never need to guess:
   - /app                    (routes)
   - /components             (shared, generic UI only — no feature logic)
   - /features/angelone          (Phase 1A will populate this)
   - /features/screener      (Phase 1B)
   - /features/charts        (Phase 1C)
   - /features/watchlist     (Phase 1D)
   - /features/journal       (Phase 1D)
   - /lib/supabase           (client + server Supabase clients)
   - /lib/types              (shared TypeScript types — critical, see below)
   - /scripts                (one-off/maintenance scripts, e.g. seeding)
   - /tests                  (unit + integration tests, mirroring /features)
3. Define these shared TypeScript interfaces in /lib/types. Every later
   phase depends on these exact shapes and must not redefine them:
   - PriceBar { date, open, high, low, close, volume }
   - Symbol { ticker, angelOneSymbolToken, exchangeSegment, name }
   - WatchlistItem { userId, symbol, tag, notes, createdAt }
   - ScreenerRule { id, label, description } — just the shape, not the
     evaluate() implementation, that belongs to Phase 1B
   - JournalEntry { userId, symbol, setupTag, entryDate, entryPrice,
     exitDate, exitPrice, notes, rMultiple }
4. Write Supabase schema as SQL migration files (not applied yet) for:
   symbols, price_cache, watchlist_items, journal_entries. Include foreign
   keys, an index on (symbol, date) for price_cache, a user_id column on
   every user-owned table, and Row Level Security enabled (policies get
   written in Phase 3, but the column and RLS-enabled flag must exist now).
5. Create .env.local.example listing every environment variable that will
   be needed across ALL phases (Supabase URL/anon key/service key, Angel One
   client ID/access token, etc.) with one-line comments explaining each —
   do not put real secret values anywhere in the repo.
6. Initialize git, commit this scaffold as the base commit, then create
   four branches off it: feature/angelone-integration, feature/screener-engine,
   feature/chart-grid, feature/watchlist-journal.
7. Write a top-level ARCHITECTURE.md documenting the folder structure, the
   shared types, and which branch/folder each future phase owns — assume
   the reader (human or agent) has zero prior context on this project.

Do NOT implement any feature logic yet — scaffolding and contracts only.

Definition of done: project builds and runs locally with a blank homepage,
migrations exist (not necessarily applied), ARCHITECTURE.md accurately
describes the repo, and all four branches exist off the base commit.
```

---

## Phase 0.5 — Design System & Visual Identity *(solo, after Phase 0, before Phase 1)*

```
You are establishing the visual identity and design token system for a
swing-trading analytics app. This runs after the Phase 0 scaffold and
before any feature UI gets built — Phase 1C (chart grid) and Phase 1D
(watchlist/journal UI) will both be told to consume what you produce here
rather than inventing their own styling, so get this right before they
start.

Direction (do not deviate from this brief — it has already been decided,
don't default to a generic look):

THEME: "Ledger / field notebook" — the product should feel like a
disciplined trader's paper journal brought into software, not a cold
trading terminal. This is deliberate: this product's actual differentiator
is the setup-tagged journal, so the whole UI should feel like an extension
of that, not a generic finance-app shell. Explicitly avoid: TradingView's
dark blue-on-black terminal look, and the generic AI-default looks of
(a) cream background + terracotta accent, (b) near-black background with
a single neon-green or acid accent, (c) broadsheet newspaper columns with
zero border-radius. None of those fit this brief.

Design tokens to define and implement as a Tailwind config + CSS
variables:

COLOR (define these as named tokens, not raw hex scattered through code):
- Background/paper: a warm, muted kraft-paper beige — not the common AI
  cream (#F4F1EA is off-limits, pick something distinguishably warmer/
  grayer)
- Surface/card: a slightly lighter, cleaner off-white for cards sitting on
  the paper background
- Ink (primary text): a warm near-black, not pure black — should read like
  fountain-pen ink, not default UI gray
- Primary accent (interactive elements, links, primary buttons): a deep
  ink-blue — used for anything actionable
- Signature accent (used sparingly — this is the one bold color in the
  whole UI, reserve it for the single signature moment described below):
  a muted burnt-sienna/wax-seal tone
- Data colors (candles, gains/losses): a muted forest green for
  up-moves and a muted brick red for down-moves — legible but
  deliberately NOT the bright saturated red/green of typical trading
  platforms

TYPOGRAPHY:
- Display face (headers, wordmark): a characterful slab serif, used with
  restraint — not on body text
- Body face: a clean humanist sans, not the default Inter-everywhere
  choice — pick something with more personality
- Data/numeric face: a monospace with tabular figures enabled, used for
  every price, percentage, and numeric table cell in the app — this one
  detail does a lot of work to make the data feel precise and intentional

LAYOUT CONCEPT:
- Ledger-inspired structure: thin hairline rules between rows instead of
  heavy borders or drop shadows, generous but not spacious padding, small
  letter-spaced uppercase "eyebrow" labels for section headers (evoking
  ledger column headers) — only where they carry real information, not as
  decoration
- Cards for chart tiles and journal entries should read like index cards
  or ledger pages — subtle texture or a fine border is fine, avoid heavy
  skeuomorphism

SIGNATURE ELEMENT (spend your one moment of boldness here, nowhere else):
- When the global timeframe or EMA-overlay toggle is switched in the
  chart grid, every chart in the grid performs one synchronized transition
  together — a brief cross-fade (150–200ms, ease-in-out) that reads like
  turning a page across every card at once. This is deliberate: it's the
  one interaction that IS the product's core value proposition (synced
  multi-chart control), so it's the right place to spend the one bold,
  memorable animation in the whole app. Nothing else in the app should
  compete with this moment for attention.

MOTION PRINCIPLES (write these into MOTION.md at the repo root, not just
implemented ad hoc — Phase 6 will reference this file for its animation
pass):
- One orchestrated page-load reveal is fine; scattered fade-ins on every
  individual element are not — pick one moment, not many
- The grid-sync cross-fade described above is the signature interaction
- Hover states on interactive cards get a subtle, small lift/shadow
  change only — no bounce, no spring easing, no scale gimmicks
- Explicitly forbidden: particle effects, excessive parallax, animated
  gradients, confetti/celebration animations — these read as generic and
  undermine the disciplined-ledger tone
- Every animation must respect `prefers-reduced-motion` — fall back to an
  instant or simple opacity-only transition when it's set, no exceptions

Tasks:
1. Implement all of the above as Tailwind theme config (colors, fonts,
   spacing scale) plus CSS variables where Tailwind config alone isn't
   enough.
2. Build a small set of primitive components in /components — Button,
   Card, Badge, Input, EyebrowLabel — styled per the tokens above, so
   every later feature UI reuses these instead of writing one-off styles.
3. Write MOTION.md documenting the motion principles above in plain
   language, so Phase 6 and any future contributor knows what's
   intentional versus what would be scope creep.
4. Write DESIGN.md documenting the token system, the reasoning for the
   ledger direction, and explicitly what NOT to do (the TradingView and
   AI-default looks this was chosen to avoid) — so nobody later drifts
   back toward a generic look without realizing it.
5. Build one visible proof page at /app/dev/design-preview showing the
   primitives, type scale, and color tokens together, plus a working demo
   of the signature cross-fade transition on two dummy cards. Remove this
   preview page in Phase 2 or Phase 6, whichever you reach first.
6. Ensure visible keyboard focus states exist on every interactive
   primitive from the start — don't defer this to Phase 3.

Definition of done: DESIGN.md and MOTION.md exist and are accurate, the
Tailwind theme and primitive components are implemented and used on the
proof page, the signature cross-fade works and correctly falls back for
prefers-reduced-motion, and none of the three generic AI-default looks or
TradingView's terminal look are present anywhere in the output.
```

---

## Phase 1A — Angel One API Data Layer *(parallel, branch: feature/angelone-integration)*

```
You are working ONLY inside /features/angelone, plus /scripts if needed, on
branch feature/angelone-integration. Do not touch any other feature folder.
Read ARCHITECTURE.md and /lib/types first — use the existing PriceBar and
Symbol types, do not redefine them.

Goal: a secure, rate-limited, cached data layer around Angel One SmartAPI
for historical daily OHLC data.

Important: Angel One's auth model is NOT a static long-lived token like
some other brokers. It requires logging in with an API key + client code
+ password/MPIN + a TOTP code (a 6-digit code generated from a TOTP secret,
the same mechanism as Google Authenticator) to receive a JWT session token
that expires and must be refreshed. Design around this from the start —
do not build this as "read one token from env and use it forever."

Requirements:
1. Server-side-only Angel One client module
   (/features/angelone/angelOneClient.ts) that reads ANGELONE_API_KEY,
   ANGELONE_CLIENT_CODE, ANGELONE_PASSWORD (or MPIN), and
   ANGELONE_TOTP_SECRET from server environment variables only. Add an
   explicit comment warning this file must never be imported into a
   client component, and add a lint rule or import restriction enforcing
   it if the tooling supports one.
2. Implement a login() function that generates a fresh TOTP code from
   ANGELONE_TOTP_SECRET (use an npm package like `otplib` for this — do
   not hand-roll TOTP generation), calls Angel One's login endpoint, and
   stores the resulting JWT session token and refresh token in memory
   (or a small server-side cache) rather than re-logging-in on every
   request. Implement token refresh using the refresh token when the
   session expires, falling back to a full login() if the refresh token
   itself has expired.
3. Angel One's historical data endpoint requires a symbolToken per
   instrument, not a plain ticker. Implement a function to fetch and
   cache Angel One's published instrument master list (their downloadable
   symbol → symbolToken → exchange mapping) into the symbols table, with
   a script in /scripts to refresh it manually.
4. Implement getHistoricalDaily(symbolToken, exchange, fromDate, toDate)
   wrapping Angel One's historical candle endpoint, with input validation,
   automatic re-login/refresh on auth failure, retry with exponential
   backoff on transient failures, and an in-process request queue/throttle
   that respects Angel One's documented rate limit so a loop calling this
   function repeatedly can never exceed it.
5. Implement a caching layer: before calling Angel One, check price_cache
   in Supabase for existing rows in the requested range; fetch only the
   missing gap and upsert results back into price_cache. Never re-fetch
   data already cached for a closed trading day.
6. Implement refreshLatestBar(symbolToken, exchange) intended to run once
   daily after market close to append just the newest candle. Write it as
   a plain exported function — the actual scheduler is wired in Phase 5,
   don't build that here.
7. Define distinct error types (AngelOneAuthError, AngelOneRateLimitError,
   AngelOneSessionExpiredError, etc.) so calling code can handle failures
   specifically instead of catching generic exceptions.
8. Write /features/angelone/README.md explaining the TOTP login flow, how
   to obtain each credential (API key from the SmartAPI developer portal,
   TOTP secret from enabling TOTP on the Angel One account), how session
   refresh works, and explicitly flag that this currently uses a single
   account's credentials (not per-user broker linking) — note that
   serving other users' data through this same account would need
   per-user broker OAuth instead, which is a compliance question, not
   just a code change.

Constraints: no UI work, no changes outside /features/angelone, /scripts,
and (only if truly needed) a migration adding a missing column to symbols.

Definition of done: a script in /scripts logs in via TOTP, fetches and
caches 2 years of daily bars for 5 sample symbols, and — to prove session
refresh actually works — run the script twice in the same terminal
session without restarting the process, confirming the second run reuses
or correctly refreshes the session instead of failing.
```

---

## Phase 1B — Screener & Historical Signal Engine *(parallel, branch: feature/screener-engine)*

```
You are working ONLY inside /features/screener, on branch
feature/screener-engine. Do not touch /features/angelone, /features/charts,
/features/watchlist, or /features/journal. Read ARCHITECTURE.md and
/lib/types first — use the existing PriceBar and ScreenerRule types.

This module must not call Angel One or Supabase directly — it takes plain
PriceBar[] arrays as input, so it has zero external dependencies and is
fully unit-testable in isolation. That isolation is intentional; don't
break it for convenience.

Requirements:
1. Implement each rule as a pure function (bars: PriceBar[], index: number)
   => boolean, evaluating whether it fires at bars[index] given the
   preceding bars as history. Implement these five:
   a. EMA stack — price above both 10-day and 20-day EMA, with the 10 EMA
      above the 20 EMA
   b. Tight consolidation — daily range as % of price stays below a
      threshold for the last N days
   c. Volume surge — today's volume more than 1.5x the 20-day average
   d. Near 52-week high — within X% of the trailing 52-week high
   e. Relative strength — the stock's N-day return ranks in the top
      quartile vs. a benchmark's return (accept benchmarkBars: PriceBar[]
      for Nifty)
2. Implement runScreener(rules, universe: {symbol, bars}[]) — evaluates
   every rule against only the latest bar for every symbol, returns matches
   grouped by rule.
3. Implement runHistoricalScan(rule, bars) — walks every historical index,
   returns every date the rule fired, and for each trigger computes
   forward return at +5, +10, +20 trading days (null if not enough future
   bars exist — never throw for this).
4. Implement summarizeScan(triggers) — returns signal count, win rate (%
   with positive +10-day forward return), and average forward return per
   horizon. This is the "did this pattern actually work" summary.
5. Handle short/malformed bars arrays defensively — return false, don't
   crash; handle NaN/gaps gracefully.
6. Write real unit tests now, not deferred to a later phase, for every rule
   function and for runHistoricalScan's forward-return math, using small
   hand-built PriceBar[] fixtures where you know the correct answer by
   construction. This is the highest-value place in the whole app to have
   tight tests — a silent bug here quietly produces wrong trading signals.

Definition of done: all rule and scan functions are exported cleanly from
/features/screener/index.ts, and npm test passes for this module with
meaningful assertions, not placeholder tests.
```

---

## Phase 1C — Chart Grid UI *(parallel, branch: feature/chart-grid)*

```
You are working ONLY inside /features/charts and generic pieces in
/components, on branch feature/chart-grid. Do not touch /features/angelone,
/features/screener, /features/watchlist, /features/journal, or any API
route. Read ARCHITECTURE.md, /lib/types, and DESIGN.md + MOTION.md
(written in Phase 0.5) first — use the existing Tailwind tokens and
/components primitives, do not invent your own colors, fonts, or spacing.
The signature grid-sync cross-fade described in MOTION.md belongs here:
when the global timeframe/EMA toggle fires, apply it across every chart
in the grid simultaneously.

This component receives data as props — it does not fetch anything itself.
Assume a parent passes { symbol: string, bars: PriceBar[] }[] as input.

Goal: a responsive grid of synced charts using the lightweight-charts
library (npm: lightweight-charts).

Requirements:
1. Wrap lightweight-charts in a reusable <PriceChart bars={...}
   timeframe={...} showEma={...} markers={...} /> component. markers
   should optionally accept entry/exit points for later reuse by the
   journal, even though you won't populate it in this phase.
2. Implement client-side daily→weekly resampling as a pure utility
   function with its own unit test (open = first day's open, close = last
   day's close, high/low = max/min across the week, volume = sum).
3. Build <ChartGrid charts={...} /> laying out multiple <PriceChart>
   components in a responsive CSS grid (2 columns tablet, 3–4 desktop).
4. Build one global control bar above the grid — timeframe toggle
   (Daily/Weekly) and EMA-overlay toggle (10/20) — using React state passed
   down to every chart simultaneously, so one click updates the whole
   grid at once. This synced-state behavior is the core value proposition;
   verify manually that no chart's state drifts independently.
5. Add an "as of [last bar's date]" label per chart so it's visually clear
   this is end-of-day data, not live.
6. Keep the component self-contained and cleanly exported so Phase 2 can
   drop it into a real page with real data.

Definition of done: a temporary demo page at /app/dev/chart-grid-preview
renders the grid against hand-written mock PriceBar[] fixtures (no real
data dependency), proving the toggle-syncing works visually. Remove this
demo page in Phase 2.
```

---

## Phase 1D — Watchlist + Journal *(parallel, branch: feature/watchlist-journal)*

```
You are working ONLY inside /features/watchlist, /features/journal, and
their corresponding /app/api/watchlist and /app/api/journal route folders,
on branch feature/watchlist-journal. Do not touch /features/angelone,
/features/screener, or /features/charts. Read ARCHITECTURE.md, /lib/types,
the Phase 0 Supabase migrations, and DESIGN.md (written in Phase 0.5)
first — use the existing Tailwind tokens and /components primitives (Card,
Button, Badge, Input, EyebrowLabel) rather than writing one-off styles.
The journal UI in particular should lean into the ledger/index-card
framing described in DESIGN.md, since it's the feature that theme was
built around.

Goal: full CRUD for watchlists and journal entries, backed by Supabase,
scoped per authenticated user.

Requirements:
1. API routes for watchlist: list/add/remove/tag items. Every route
   requires an authenticated Supabase session — reject unauthenticated
   requests with 401. Validate inputs (symbol must exist in the symbols
   table, tag must be one of a fixed enum) before writing to the DB.
2. API routes for journal: create/update/list entries with fields —
   symbol, setup_tag (enum: ema_pullback, vcp_breakout, episodic_pivot,
   other), entry_date, entry_price, exit_date (nullable), exit_price
   (nullable), notes. Compute r_multiple server-side from entry/exit and a
   user-set initial stop price — never trust a client-submitted R value.
3. UI: a watchlist page (add-by-symbol search, tag dropdown, remove
   button, group-by-tag view) and a journal page (entry form + table of
   past entries + a stats panel showing win rate and average R-multiple
   grouped by setup_tag). This stats panel is the feature the product's
   retention story depends on — get the aggregation logic right, not just
   the UI shell.
4. Write actual Postgres Row Level Security policies in a migration file
   (not just application-layer checks) so every write is checked against
   auth.uid() at the database level, independent of any application bug.
5. Validate every API route payload with a schema validator (Zod or
   equivalent) — reject malformed input with a clear 400, never let bad
   data reach the database.

Definition of done: a logged-in test user can add symbols to a watchlist,
remove them, log a journal entry, edit it, and see the stats panel update
correctly. A second test user cannot see or modify the first user's data —
verify this explicitly, not just assume the RLS policy works.
```

---

## Phase 1E — Seed the Universe *(2-dev track only, Dev A, parallel with Phase 1D)*

```
You are working ONLY inside /scripts, using the Angel One data layer
already built in Phase 1A (/features/angelone). Do not touch
/features/watchlist, /features/journal, or any /app/api route — another
developer is actively working in those files in parallel right now.

Goal: populate the real dataset the whole app will run on.

Requirements:
1. Build a script that defines a static list of ~150–200 liquid NSE
   symbols (Nifty 200 constituents is a reasonable source list — hardcode
   it as a JSON or TS array in /scripts, don't fetch it from anywhere at
   runtime).
2. For each symbol, resolve its Angel One symbolToken using the
   instrument-master function from Phase 1A, and upsert a row into the
   symbols table.
3. For each symbol, backfill 2 years of daily OHLC bars into price_cache
   using Phase 1A's caching-aware historical fetch function — do not
   bypass the cache logic, this proves it works at real scale, not just
   on 5 test symbols.
4. Respect Angel One's rate limit — this script will make many calls in a
   row, so it must use Phase 1A's request queue/throttle rather than
   firing requests as fast as possible.
5. Make the script safely re-runnable: if it's interrupted partway and
   run again, it should skip symbols already fully backfilled rather than
   redoing all the work or creating duplicate rows.
6. Log progress clearly (symbol N of 200, done in X seconds) so a human
   watching the terminal can tell it's actually working during what will
   likely be a multi-minute run.

Definition of done: the script runs to completion against the real Angel
One account, price_cache contains 2 years of daily bars for all seeded
symbols, and running the script a second time completes quickly by
skipping already-cached data instead of re-fetching everything.
```

---

## Phase 2 — Integration *(solo, after merging all four branches)*

```
All four feature branches have been merged into main. Your job in this
phase is integration only — wiring the previously isolated modules into
real, working pages. Read ARCHITECTURE.md and each /features/*/README.md
before starting.

Tasks:
1. Build the real dashboard page: fetch the user's watchlist, pull cached
   price bars for each symbol via the Angel One data layer's cache-first logic
   (never call Angel One directly on every page load), and render them through
   ChartGrid with real data.
2. Build the screener page: run runScreener against the seeded universe
   using cached bars, display matches, wire a one-click "add to watchlist"
   button into the real watchlist API.
3. Build the historical scanner page: let a user pick a saved watchlist or
   the full universe, pick one of the five rules, run runHistoricalScan +
   summarizeScan, and display the trigger list and summary stats.
4. Wire journal chart markers: when viewing a journal entry, render its
   symbol's chart with entry/exit markers using PriceChart's existing
   markers prop — reuse it, don't rebuild it.
5. Write the one-time seeding script that populates the symbols table with
   ~150–200 liquid NSE symbols (Nifty 200 constituents) and their Angel One
   symbolTokens, and backfills 2 years of daily bars using the Phase 1A
   functions. Run it once against the real Angel One account.
6. Remove the temporary /app/dev/chart-grid-preview page.
7. Fix any type or interface mismatches that surface now that modules
   talk to each other for real — expected, and exactly why this phase
   exists as a separate step.

Definition of done: a logged-in user can, in one session, view their chart
grid, run the screener, add a match to their watchlist, log a journal
entry, and see it appear with correct markers — the full loop, end to end,
with real Angel One-sourced data.
```

---

## Phase 2A — Dashboard + Screener Pages *(2-dev track only, Dev A)*

```
Both of you have merged all Phase 1 branches into main. You are working
ONLY on new page files: /app/dashboard, /app/screener, and any small glue
code they need. Do not edit files under /features/journal or
/features/charts' internals, and avoid /app/scanner or the journal page —
your teammate is building those concurrently.

Tasks:
1. Build the dashboard page: fetch the logged-in user's watchlist, pull
   cached price bars per symbol via the Angel One data layer's
   cache-first logic (never call Angel One directly on page load), and
   render them through the existing ChartGrid component with real data.
2. Build the screener page: run runScreener from the Phase 1B engine
   against the seeded universe (Phase 1E's data) using cached bars,
   display matches, and wire a one-click "add to watchlist" button into
   the existing watchlist API from Phase 1D.
3. Remove the temporary /app/dev/chart-grid-preview page if it's still
   present.
4. Fix any type/interface mismatches between the screener engine, the
   Angel One data layer, and the chart grid component now that they're
   talking to each other for real.

Definition of done: a logged-in user can view their chart grid with real
data and run the screener to find and save new matches to their
watchlist — independent of whatever your teammate is building on the
scanner/journal side.
```

---

## Phase 2B — Scanner Page + Journal Markers *(2-dev track only, Dev B)*

```
Both of you have merged all Phase 1 branches into main. You are working
ONLY on /app/scanner (new page) and the existing journal page/components
under /features/journal (which you built in Phase 1D). Do not touch
/app/dashboard, /app/screener, or /features/angelone's internals — your
teammate is building the dashboard and screener pages concurrently.

Tasks:
1. Build the historical scanner page: let the user pick a saved watchlist
   or the full seeded universe (Phase 1E's data), pick one of the five
   rules from the Phase 1B screener engine, run runHistoricalScan and
   summarizeScan, and display the trigger list plus summary stats.
2. Wire journal chart markers: when viewing a journal entry, render its
   symbol's chart with entry/exit markers using PriceChart's existing
   markers prop from Phase 1C — reuse it, don't rebuild it.
3. Remove the temporary /app/dev/design-preview page if it's still
   present.
4. Fix any type/interface mismatches between the historical scanner logic
   and the journal/chart components now that they're wired together for
   real.

Definition of done: a user can run the historical scanner against any
watchlist and see forward-return stats, and can open any journal entry to
see its chart with correct entry/exit markers — independent of whatever
your teammate is building on the dashboard/screener side.
```

---

## Phase 3 — Security Hardening *(solo — single-dev track; 2-dev track runs this alongside Phase 6A below)*

```
This is a dedicated security-hardening pass over the whole integrated app.
Do not add new features. Work through this checklist and actually fix
anything that fails it — don't just note it:

1. Confirm the Angel One API key, client code, password/MPIN, TOTP secret,
   session token, Supabase service-role key, and any other secret never
   appear in any client-side bundle — check the
   built output, not just the source.
2. Confirm every API route checks authentication, and that Row Level
   Security policies exist AND are enabled on every table containing user
   data.
3. Confirm every API route validates input with a schema and returns
   proper 400/401/403/404/500 status codes rather than leaking stack
   traces or raw database errors to the client.
4. Add basic rate limiting on any API route that can trigger a Angel One call
   (e.g. a manual "refresh now" button), so a user action can't
   accidentally hammer the Angel One API and get the account throttled.
5. Add a Content Security Policy and standard security headers via
   Next.js headers() config — no inline scripts, restrict frame-ancestors.
6. Confirm .env.local.example is accurate and no file with real secrets is
   committed to git — check .gitignore.
7. Write SECURITY.md documenting the current auth model, explicitly
   noting what's out of scope for now (no per-user broker linking, no
   2FA) and what would need to change before onboarding real users beyond
   you and close testers.

Definition of done: every item above is checked off with the actual fix
applied, not just documented as a TODO.
```

---

## Phase 4 — Testing *(solo)*

```
Add a testing pass across the app, prioritizing where bugs are costliest.

1. Confirm the Phase 1B rule-engine unit tests still pass; extend coverage
   for the daily→weekly resampling utility if it isn't already tested.
2. Add integration tests for the watchlist and journal API routes against
   a local/test Supabase instance or a mocked client. Explicitly cover the
   cross-user access denial case — that's the most important security
   property to regression-test going forward.
3. Add one end-to-end test (Playwright) covering the critical path: log in
   → view chart grid → run screener → add to watchlist → log journal entry
   → see it reflected in stats. One meaningful e2e test here matters more
   than many shallow ones.
4. Confirm the whole suite is wired to run via a single command (e.g.
   npm test) so Phase 5's CI step can call it directly.

Definition of done: npm test and the Playwright suite both pass locally,
and each test file has a short comment explaining what it actually
protects against.
```

---

## Phase 5 — Deployment & CI/CD *(solo)*

```
Prepare this for a live, shareable deployment.

1. Set up a Vercel project connected to this repo; configure all required
   environment variables (Angel One credentials, Supabase keys) in Vercel's
   dashboard, never in code.
2. Set up the daily EOD refresh (Phase 1A's refreshLatestBar) as a Vercel
   Cron Job or a scheduled Supabase Edge Function, running shortly after
   NSE market close on trading days.
3. Add a GitHub Actions workflow running lint + unit tests + build on
   every push/PR, blocking merge on failure.
4. Do a production build and deploy; verify the live URL works end to end
   with a fresh test account.
5. Write DEPLOYMENT.md covering how the Angel One TOTP login/session-refresh
   flow behaves in production, what to do if the TOTP secret or password
   ever needs to be rotated, how to re-run the seeding script, and how to
   check cron job logs if the daily refresh silently fails.

Definition of done: a live Vercel URL exists, the full critical path works
on it (not just locally), and the daily cron job has run successfully at
least once.
```

---

## Phase 6A — Motion & Polish Pass *(2-dev track only, Dev B, parallel with Phase 3)*

```
You are working on UI/component files only — the chart grid, watchlist,
screener, and journal pages and their styling. Do not touch API routes,
Angel One client code, security headers, or Supabase config — your
teammate is doing a security-hardening pass over exactly those files at
the same time.

Tasks:
1. Motion and micro-interaction pass: re-read MOTION.md (from Phase 0.5)
   and audit the live app against it. Confirm the grid-sync cross-fade is
   working correctly on real data (not just the Phase 0.5 demo page),
   add the intentional page-load reveal if it isn't there yet, and add
   the small hover lift/shadow treatment to interactive cards (watchlist
   items, journal entries, screener matches). Explicitly remove any
   animation that crept in but isn't described in MOTION.md. Verify
   prefers-reduced-motion is respected everywhere, not just on the
   signature cross-fade.
2. Walk through the app as a brand-new user with empty state everywhere
   (no watchlist, no journal entries); fix any broken or confusing empty
   states.
3. Add a visible "data as of [last close]" indicator anywhere prices
   appear, and a short in-app note that this is an EOD analytics tool,
   not a live-trading or advice platform.
4. Do a mobile responsiveness pass on the chart grid, screener, and
   journal pages.

Definition of done: MOTION.md's principles are all visibly true in the
live app, empty states are handled everywhere, the EOD/not-advice framing
is visible, and the app is usable on a phone-sized viewport.
```

---

## Phase 6B — Final Copy & QA *(2-dev track only, joint, ~30 min after Phase 3 + 6A merge)*

```
Both security hardening and the motion/polish pass are merged into main.
This is a short joint pass — pair on it rather than splitting further.

1. Write the actual landing/login page copy: what this does, who it's
   for, and what it explicitly doesn't do yet.
2. Do a final read of SECURITY.md and DEPLOYMENT.md together to confirm
   they describe what actually shipped, not what was originally planned.
3. Do one full walkthrough together as a fresh user, end to end.

Definition of done: you'd both comfortably share the live link with a
handful of real swing traders for feedback.
```

---

## Phase 6 — Final QA & Launch Readiness *(solo — single-dev track only; 2-dev track uses 6A/6B above)*

```
Final pass before sharing this with real users.

1. Motion and micro-interaction pass: re-read MOTION.md (from Phase 0.5)
   and audit the live app against it. Confirm the grid-sync cross-fade is
   working correctly on real data (not just the Phase 0.5 demo page),
   add the intentional page-load reveal if it isn't there yet, and add
   the small hover lift/shadow treatment to interactive cards
   (watchlist items, journal entries, screener matches). Explicitly check
   for and remove any animation that crept in but isn't described in
   MOTION.md — unplanned motion is scope creep, even if it looks nice in
   isolation. Verify prefers-reduced-motion is respected everywhere, not
   just on the signature cross-fade.
2. Walk through the app as a brand-new user with empty state everywhere
   (no watchlist, no journal entries); fix any broken or confusing empty
   states.
3. Add a visible "data as of [last close]" indicator anywhere prices
   appear, and a short in-app note that this is an EOD analytics tool, not
   a live-trading or advice platform — this framing matters for how the
   product is perceived and for staying clear of investment-advice
   territory.
4. Do a mobile responsiveness pass on the chart grid, screener, and
   journal pages.
5. Write the actual landing/login page copy: what this does, who it's
   for, and what it explicitly doesn't do yet.
6. Do a final read of SECURITY.md and DEPLOYMENT.md to confirm they
   describe what actually shipped, not what was originally planned.

Definition of done: you would comfortably share the live link with a
handful of real swing traders for feedback.
```