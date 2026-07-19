import { createClient } from '@/lib/supabase/server'
import { angelOneClient } from '@/features/angelone/angelOneClient'
import { JournalClient } from './JournalClient'

export default async function JournalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center mt-20 font-sans">
        <h1 className="text-2xl font-bold text-ink">Please log in to view your journal.</h1>
      </div>
    )
  }

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })

  if (error) {
    return <div className="p-6 text-data-down">Error loading journal: {error.message}</div>
  }

  const toDate = new Date()
  const fromDate = new Date()
  fromDate.setFullYear(fromDate.getFullYear() - 1)

  const chartDataPromises = (entries || []).map(async (entry) => {
    try {
      // Assuming trading history is mostly within the last year for swing trades
      const bars = await angelOneClient.getHistoricalDaily(entry.symbol, fromDate, toDate)
      return { ...entry, bars }
    } catch (e) {
      return { ...entry, bars: [] }
    }
  })

  const entriesWithBars = await Promise.all(chartDataPromises)

  return <JournalClient initialEntries={entriesWithBars} />
}
