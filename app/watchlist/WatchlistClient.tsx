'use client'

import React, { useState } from 'react'
import { Button, Input, EyebrowLabel } from '@/components'
import { MiniChart } from '@/features/charts/components'
import { ChartGrid } from '@/components/ChartGrid'
import { PriceBar, GridColumns } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export type WatchlistItemWithBars = {
  id: string;
  symbol: string;
  tag: string | null;
  notes: string | null;
  created_at: string;
  bars: PriceBar[];
}

interface WatchlistClientProps {
  initialItems: WatchlistItemWithBars[];
}

export function WatchlistClient({ initialItems }: WatchlistClientProps) {
  const router = useRouter();
  const [symbol, setSymbol] = useState('')
  const [tag, setTag] = useState<string>('momentum')
  const [activeTab, setActiveTab] = useState<string>('all')
  const [gridColumns, setGridColumns] = useState<GridColumns>(4)
  const [removing, setRemoving] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), tag })
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add')
      }
      setSymbol('')
      toast.success(`${symbol.toUpperCase()} added to watchlist`)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setRemoving(id)
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Symbol removed from watchlist')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRemoving(null)
    }
  }

  // Extract unique tags for tabs
  const uniqueTags = Array.from(new Set(initialItems.map(i => i.tag || 'untagged')))
  const tabs = ['all', ...uniqueTags]

  const filteredItems = activeTab === 'all' 
    ? initialItems 
    : initialItems.filter(i => (i.tag || 'untagged') === activeTab)

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 page-reveal min-h-screen bg-paper font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-hairline pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight font-display">Watchlist</h1>
          <p className="text-ink-light mt-1 text-sm">Monitor and manage your high-conviction setups.</p>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 w-full md:w-auto">
          <Input 
            value={symbol} 
            onChange={e => setSymbol(e.target.value)} 
            placeholder="Symbol (e.g. RELIANCE)"
            required 
            className="w-full md:w-48 bg-surface"
          />
          <select 
            className="rounded-md border border-hairline bg-surface text-ink focus:border-primary focus:ring-primary sm:text-sm px-3 py-2"
            value={tag} 
            onChange={e => setTag(e.target.value)}
          >
            <option value="momentum">Momentum</option>
            <option value="value">Value</option>
            <option value="dividend">Dividend</option>
            <option value="speculative">Speculative</option>
            <option value="other">Other</option>
          </select>
          <Button type="submit" className="bg-primary hover:bg-primary-hover text-white shrink-0">Add</Button>
        </form>
      </div>

      {initialItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-hairline rounded-xl shadow-inner mt-8">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-ink mb-2 font-display">Your Watchlist is Empty</h2>
          <p className="text-ink-light max-w-md mb-6">
            You aren't tracking any stocks yet. Run a scan to find high-probability setups or manually add a symbol above.
          </p>
          <Link href="/screener">
            <Button size="lg" className="bg-signature hover:bg-signature/90 text-white font-bold px-8 shadow-md">
              Go to Screener &rarr;
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-semibold transition-all border capitalize",
                  activeTab === t 
                    ? "bg-surface border-ink/20 text-ink shadow-sm" 
                    : "border-transparent text-ink-light hover:bg-surface/50 hover:text-ink"
                )}
              >
                {t.replace(/_/g, ' ')}
                <span className="ml-2 opacity-50 text-xs">
                  {t === 'all' ? initialItems.length : initialItems.filter(i => (i.tag || 'untagged') === t).length}
                </span>
              </button>
            ))}
          </div>

          <ChartGrid 
            items={filteredItems}
            columns={gridColumns}
            onColumnsChange={setGridColumns}
            total={filteredItems.length}
            renderCard={(item) => (
              <div className="relative group/card">
                <MiniChart 
                  symbol={item.symbol}
                  bars={item.bars}
                  loading={false}
                  error={false}
                />
                <div className="absolute bottom-4 right-4 z-20 flex justify-end opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="text-xs shadow-md font-semibold"
                    disabled={removing === item.id}
                    onClick={(e) => handleRemove(e, item.id)}
                  >
                    {removing === item.id ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
                <div className="absolute top-4 left-4 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity pointer-events-none">
                  <span className="bg-surface/80 backdrop-blur-sm border border-hairline px-2 py-1 rounded text-[10px] font-bold text-ink-light uppercase tracking-wider shadow-sm">
                    {item.tag || 'Untagged'}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  )
}
