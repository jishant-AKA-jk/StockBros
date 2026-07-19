import { createClient } from '@/lib/supabase/server'
import { angelOneClient } from '@/features/angelone/angelOneClient'
import { ChartGrid } from '@/features/charts/components/ChartGrid'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold">Please log in to view your dashboard.</h1>
      </div>
    )
  }

  // Fetch watchlist
  const { data: watchlistItems, error } = await supabase
    .from('watchlist_items')
    .select('symbol')
    .eq('user_id', user.id)

  if (error) {
    return <div>Error loading watchlist</div>
  }

  if (!watchlistItems || watchlistItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 md:p-12 space-y-8 page-reveal">
        <div className="border-b border-hairline pb-4">
          <h1 className="text-3xl font-bold text-ink tracking-tight font-display">Dashboard</h1>
          <p className="text-ink-light italic mt-1 font-sans">StockBros swing trading analytics overview.</p>
        </div>
        
        <div className="bg-surface border border-dashed border-hairline rounded-lg p-8 md:p-12 text-center space-y-6 shadow-card">
          <div className="max-w-md mx-auto space-y-3">
            <h2 className="text-xl font-bold text-ink">Your Watchlist is Empty</h2>
            <p className="text-sm text-ink-light leading-relaxed">
              To view charts and technical analysis indicators on your dashboard, you need to add stock symbols to your watchlist first.
            </p>
          </div>
          
          <div>
            <a 
              href="/watchlist" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
              Go to Watchlist &rarr;
            </a>
          </div>
        </div>

        <div className="bg-signature/10 border border-signature/20 rounded-lg p-4 text-sm text-signature font-sans">
          <p className="font-semibold mb-1">EOD Analytics Platform Disclaimer</p>
          <p>
            StockBros is an <strong>End-of-Day (EOD)</strong> swing trading analytics tool. It is <strong>NOT</strong> a live-trading or investment advice platform. All calculations, chart data, and indicators are generated based on historical close-of-market data.
          </p>
        </div>
      </div>
    )
  }

  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setFullYear(fromDate.getFullYear() - 1) // 1 year is enough for dashboard

  const chartDataPromises = watchlistItems.map(async (item) => {
    try {
      const bars = await angelOneClient.getHistoricalDaily(item.symbol, fromDate, toDate)
      return { symbol: item.symbol, bars }
    } catch (e) {
      console.error('Error fetching bars for', item.symbol, e)
      return { symbol: item.symbol, bars: [] }
    }
  })

  const charts = await Promise.all(chartDataPromises)

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      <ChartGrid charts={charts} />
    </div>
  )
}
