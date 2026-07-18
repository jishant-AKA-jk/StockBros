import { createClient } from '@/lib/supabase/server'
import { angelOneClient } from '@/features/angelone/angelOneClient'
import { 
  runScreener, 
  emaStack, 
  tightConsolidation, 
  volumeSurge, 
  near52WeekHigh, 
  relativeStrength 
} from '@/features/screener'
import { ScreenerClient } from './ScreenerClient'

export default async function ScreenerPage() {
  const supabase = createClient()
  
  // We'll use the same seeded symbols or top 150
  const { data: symbols, error } = await supabase
    .from('symbols')
    .select('ticker')
    .limit(150)

  if (error || !symbols) {
    return <div>Error loading symbols</div>
  }

  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setFullYear(fromDate.getFullYear() - 1) // 1 year lookback

  const universePromises = symbols.map(async (s) => {
    // Only fetch from cache if possible. getHistoricalDaily handles it.
    try {
      const bars = await angelOneClient.getHistoricalDaily(s.ticker, fromDate, toDate)
      return { symbol: s.ticker, bars }
    } catch {
      return { symbol: s.ticker, bars: [] }
    }
  })

  const universe = await Promise.all(universePromises)

  // Nifty benchmark for relative strength (using Reliance as a proxy if NIFTY50 is not seeded)
  // Or just find a benchmark in the universe
  const benchmarkItem = universe.find(u => u.symbol === 'RELIANCE') || universe[0]
  const benchmarkBars = benchmarkItem?.bars || []

  const rules = [
    { id: 'EMA_Stack', fn: emaStack },
    { id: 'Tight_Consolidation', fn: tightConsolidation },
    { id: 'Volume_Surge', fn: volumeSurge },
    { id: 'Near_52W_High', fn: near52WeekHigh },
    { id: 'Relative_Strength', fn: (bars: { date: string, open: number, high: number, low: number, close: number, volume: number }[], i: number) => relativeStrength(bars, i, benchmarkBars) }
  ]

  const results = runScreener(rules, universe)

  return <ScreenerClient results={results} />
}
