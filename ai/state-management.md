# State Management Rules

## 1. Server State vs. Client State
- **Server State**: Data that lives remotely on the server (e.g., user profiles, watchlists, journal entries, historical prices). Manage this primarily via Next.js React Server Components. Fetch data directly in the RSC and pass it down as props.
- **Client State**: Ephemeral UI state (e.g., modal open/close, unsaved form input). Use standard React hooks (`useState`, `useReducer`) for this inside `'use client'` components.

## 2. Imperative State (Charting)
- **Lightweight Charts**: Libraries like Lightweight Charts manage their own internal, imperative state on HTML canvas elements. Do not attempt to sync every single chart pan/zoom event to a React state variable as it will cause severe performance degradation (re-render loops). Only use React state to trigger imperative updates to the chart API.

## 3. Global Client State
- For global client state (e.g., the globally synced chart timeframe across multiple cards), use React Context.
- Avoid large, monolithic state managers (like Redux) unless the state complexity grows significantly. Zustand is the preferred lightweight alternative if Context becomes a performance bottleneck or re-render issue.

## 4. URL as State
- Whenever possible, store view state (like search queries, active screener filters, pagination, or the active ticker `?symbol=AAPL`) in the URL search parameters. This makes links shareable, survives page refreshes, and respects standard browser history navigation natively in the App Router.
