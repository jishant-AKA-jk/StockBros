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

  if (error || !symbols || symbols.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 page-reveal">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Screener</h1>
          <p className="text-gray-500 italic mt-1">StockBros swing trading analytics screener.</p>
        </div>
        
        <div className="bg-white border border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center space-y-6 shadow-sm">
          <div className="max-w-md mx-auto space-y-3 font-sans">
            <h2 className="text-xl font-bold text-gray-800">Database is Empty</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              The symbol database is currently empty. Please run the database seeding script to populate stock symbols.
            </p>
          </div>
          
          <div className="inline-block bg-gray-50 p-4 border border-gray-200 rounded font-mono text-sm text-gray-700 text-left">
            npm run seed
          </div>
        </div>
      </div>
    );
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

  // Find the latest close date in the universe
  const lastCloseDate = universe.find(u => u.bars.length > 0)?.bars.slice(-1)[0]?.date || 'N/A';

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

  return <ScreenerClient results={results} lastCloseDate={lastCloseDate} />
}
