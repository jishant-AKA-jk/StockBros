# State Management Rules

## 1. Server State vs. Client State
- **Server State**: Data that lives remotely on the server (e.g., user profiles, watchlists, journal entries, historical prices). Manage this primarily via Next.js React Server Components. Fetch data directly in the RSC and pass it down as props.
- **Client State**: Ephemeral UI state (e.g., modal open/close, active chart timeframe, unsaved form input). Use standard React hooks (`useState`, `useReducer`) for this inside `'use client'` components.

## 2. Global Client State
- For global client state (e.g., the globally synced chart timeframe across multiple cards), use React Context.
- Avoid large, monolithic state managers (like Redux) unless the state complexity grows significantly. Zustand is the preferred lightweight alternative if Context becomes a performance bottleneck or re-render issue.

## 3. URL as State
- Whenever possible, store view state (like search queries, active filters, or pagination) in the URL search parameters (`?query=aapl`). This makes links shareable, survives page refreshes, and respects standard browser history navigation.
