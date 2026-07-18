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
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
        <p>Your watchlist is empty. Add symbols to your watchlist to see them here.</p>
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
