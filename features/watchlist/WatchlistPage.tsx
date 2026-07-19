'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Input, EyebrowLabel } from '@/components'

type WatchlistItem = {
  id: string;
  symbol: string;
  tag: 'momentum' | 'value' | 'dividend' | 'speculative' | 'other' | null;
  notes: string | null;
  created_at: string;
}

export function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [symbol, setSymbol] = useState('')
  const [tag, setTag] = useState<WatchlistItem['tag']>('momentum')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchWatchlist()
  }, [])

  const fetchWatchlist = async () => {
    try {
      const res = await fetch('/api/watchlist')
      if (!res.ok) throw new Error('Failed to fetch watchlist')
      const data = await res.json()
      setItems(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
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
      fetchWatchlist()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      fetchWatchlist()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const groupedItems = items.reduce((acc, item) => {
    const t = item.tag || 'untagged'
    if (!acc[t]) acc[t] = []
    acc[t].push(item)
    return acc
  }, {} as Record<string, WatchlistItem[]>)
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-ink-light font-sans mt-20">
        <div className="inline-block text-lg font-medium">Loading watchlist...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 page-reveal">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2 font-display">Watchlist</h1>
        <p className="text-ink-light font-sans">Track your favorite symbols by tags.</p>
      </div>
      <Card className="p-6">
        <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <EyebrowLabel className="mb-2">Symbol</EyebrowLabel>
            <Input 
              value={symbol} 
              onChange={e => setSymbol(e.target.value)} 
              placeholder="e.g. RELIANCE"
              required 
            />
          </div>
          <div>
            <EyebrowLabel className="mb-2">Tag</EyebrowLabel>
            <select 
              className="block w-full rounded-md border-hairline bg-surface text-ink shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border"
              value={tag || ''} 
              onChange={e => setTag(e.target.value as any)}
            >
              <option value="momentum">Momentum</option>
              <option value="value">Value</option>
              <option value="dividend">Dividend</option>
              <option value="speculative">Speculative</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Button type="submit" className="w-full">Add to Watchlist</Button>
        </form>
        {error && <p className="text-data-down text-sm mt-4 font-sans">{error}</p>}
      </Card>

      <div className="space-y-6">
        {Object.entries(groupedItems).map(([groupTag, groupItems]) => (
          <div key={groupTag}>
            <h3 className="text-lg font-medium text-ink mb-3 capitalize border-b border-hairline pb-2 font-display">{groupTag}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groupItems.map(item => (
                <Card key={item.id} className="p-4 flex items-center justify-between interactive-card bg-surface">
                  <div>
                    <div className="font-bold text-ink">{item.symbol}</div>
                    <div className="text-sm text-ink-light font-sans">Added {new Date(item.created_at).toLocaleDateString()}</div>
                  </div>
                  <Button variant="secondary" onClick={() => handleRemove(item.id)}>Remove</Button>
                </Card>
              ))}
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="bg-surface border border-dashed border-hairline rounded-lg p-8 text-center text-ink-light shadow-card font-sans">
            <p className="font-medium text-ink">No symbols in watchlist yet.</p>
            <p className="text-sm text-ink-light mt-1">Use the form above to add a symbol (e.g., RELIANCE) to begin tracking.</p>
          </div>
        )}
      </div>
    </div>
  )
}
