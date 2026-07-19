import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export async function DashboardLedger() {
  const supabase = createClient()
  
  // We don't need to check user here because the page component already did it, 
  // but good practice anyway.
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="p-4 text-sm font-mono text-ink-light">Authentication required.</div>
  }

  const { data: entries, error } = await supabase
    .from('journal_entries')
    .select('id, symbol, setup_tag, entry_date, entry_price, exit_date, exit_price, r_multiple')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(20)

  if (error) {
    console.error('Error fetching dashboard ledger:', error)
    return <div className="p-4 text-sm font-mono text-ink-light">Error loading ledger data.</div>
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-surface border-l border-hairline">
        <div className="max-w-sm space-y-4">
          <div className="text-signature text-2xl font-serif">§</div>
          <h3 className="text-lg font-bold font-display text-ink">The Ledger is Empty</h3>
          <p className="text-sm font-sans text-ink-light leading-relaxed">
            Your trading ledger is your source of truth. Log your first setup to begin building your edge.
          </p>
          <Link
            href="/journal"
            className="inline-flex items-center px-4 py-2 border border-hairline text-sm font-medium bg-paper hover:bg-surface text-ink transition-colors"
          >
            Go to Journal &rarr;
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-paper border-l border-hairline overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-hairline bg-surface shrink-0">
        <h2 className="text-sm font-bold tracking-widest uppercase text-ink font-sans">Trading Ledger</h2>
        <Link href="/journal" className="text-xs text-ink-light hover:text-ink font-mono underline underline-offset-2">
          View All
        </Link>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-surface z-10 shadow-[0_1px_0_0_var(--color-hairline)]">
            <tr>
              <th className="py-2 px-3 text-xs font-semibold text-ink-light uppercase tracking-wider font-sans border-b border-hairline">Symbol</th>
              <th className="py-2 px-3 text-xs font-semibold text-ink-light uppercase tracking-wider font-sans border-b border-hairline hidden xl:table-cell">Setup</th>
              <th className="py-2 px-3 text-xs font-semibold text-ink-light uppercase tracking-wider font-sans text-right border-b border-hairline">Entry</th>
              <th className="py-2 px-3 text-xs font-semibold text-ink-light uppercase tracking-wider font-sans text-right border-b border-hairline">Exit</th>
              <th className="py-2 px-3 text-xs font-semibold text-ink-light uppercase tracking-wider font-sans text-right border-b border-hairline">R-Mult</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline bg-paper">
            {entries.map((entry) => (
              <tr 
                key={entry.id} 
                className="hover:bg-surface/50 transition-colors cursor-pointer group"
              >
                <td className="py-2 px-3 whitespace-nowrap">
                  <span className="text-sm font-bold text-ink">{entry.symbol}</span>
                </td>
                <td className="py-2 px-3 whitespace-nowrap hidden xl:table-cell">
                  {entry.setup_tag ? (
                    <span className="text-xs bg-surface border border-hairline px-1.5 py-0.5 text-ink-light font-mono">
                      {entry.setup_tag}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-light/50 font-mono">-</span>
                  )}
                </td>
                <td className="py-2 px-3 whitespace-nowrap text-right font-mono text-sm tabular-nums text-ink">
                  {entry.entry_price ? entry.entry_price.toFixed(2) : '-'}
                </td>
                <td className="py-2 px-3 whitespace-nowrap text-right font-mono text-sm tabular-nums text-ink">
                  {entry.exit_price ? entry.exit_price.toFixed(2) : '-'}
                </td>
                <td className="py-2 px-3 whitespace-nowrap text-right font-mono text-sm tabular-nums">
                  {entry.r_multiple != null ? (
                    <span className={entry.r_multiple >= 1 ? 'text-data-up font-bold' : entry.r_multiple > 0 ? 'text-data-up' : entry.r_multiple < 0 ? 'text-data-down' : 'text-ink-light'}>
                      {entry.r_multiple > 0 ? '+' : ''}{entry.r_multiple.toFixed(2)}R
                    </span>
                  ) : (
                    <span className="text-ink-light/50">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
