<div align="center">
  <h1>📈 StockBros</h1>
  <p><strong>Next-Generation Algorithmic Screener & Trading Journal for the NSE</strong></p>
  <br />
</div>

## 🚀 Overview

**StockBros** is a high-performance, algorithmic stock screener and journaling platform tailored for the Indian Stock Market. Built for speed and accuracy, it features a self-healing historical data cache, real-time pattern detection, and a beautiful, tactile user interface.

## ✨ Key Features

- **🧠 Algorithmic Scanner:** Instantly scan the entire NSE for highly accurate technical patterns (EMA Stacks, Volume Surges, Tight Consolidations).
- **⚡ Self-Healing Cache:** Lazily fetches and permanently caches historical candle data from AngelOne, eliminating the need for manual maintenance or cron jobs.
- **📓 Trading Journal:** Log trades, attach visual chart annotations, and track your performance.
- **⭐ Watchlists:** Create dynamic watchlists powered by lightning-fast data integration.
- **🎨 Tactile UI:** A premium, modern frontend built with Shadcn/UI, Tailwind, and React Server Components.

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React, TailwindCSS, Shadcn/UI
- **Backend:** Supabase (PostgreSQL), Next.js Server Actions, LRU Cache
- **Data Provider:** AngelOne API (SmartAPI)
- **Language:** TypeScript (End-to-End Type Safety)

## 🏎️ Getting Started (Cloud-Only Workflow)

We use a modern, Docker-free "Cloud-Only" workflow for a friction-free developer experience.

### 1. Setup Environment
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Duplicate `.env.local.example` to `.env.local` and fill in your Dev Supabase and AngelOne API keys.

### 3. Deploy Dev Database
Push the schema to your Dev database (No Docker required):
```bash
npx supabase db push
```

### 4. Seed Initial Data
Populate the database with the NSE master symbol list and dummy data so you can view charts locally:
```bash
npm run sync-symbols
npm run seed
```

### 5. Run the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app!

## 🚢 Production Deployment

Deploying to production is a strict two-step process to ensure data integrity:

1. **Deploy Database:** Link your CLI to your Production Supabase project and run `npx supabase db push`.
2. **Sync Live Data:** Run `npm run sync-symbols` against the Production DB (⚠️ *Never run `seed` in production*).
3. **Deploy Frontend:** Push to GitHub to automatically trigger your Vercel deployment.

---
<div align="center">
  <i>Built with precision for the modern trader.</i>
</div>
