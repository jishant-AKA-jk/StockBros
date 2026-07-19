import { createClient } from '@/lib/supabase/server'
import { angelOneClient } from '@/features/angelone/angelOneClient'
import { WatchlistClient } from './WatchlistClient'

export default async function WatchlistPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center mt-20 font-sans">
        <h1 className="text-2xl font-bold text-ink">Please log in to view your watchlist.</h1>
      </div>
    )
  }

  const { data: items, error } = await supabase
    .from('watchlist_items')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return <div className="p-6 text-data-down">Error loading watchlist: {error.message}</div>
  }

  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setFullYear(fromDate.getFullYear() - 1)

  const chartDataPromises = (items || []).map(async (item) => {
    try {
      const bars = await angelOneClient.getHistoricalDaily(item.symbol, fromDate, toDate)
      return { ...item, bars }
    } catch (e) {
      return { ...item, bars: [] }
    }
  })

  const itemsWithBars = await Promise.all(chartDataPromises)

  return <WatchlistClient initialItems={itemsWithBars} />
}
