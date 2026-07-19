'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Input, EyebrowLabel } from '@/components'

import { PriceChart } from '@/features/charts/components/PriceChart'
import { PriceBar } from '@/lib/types'
import { getChartBars } from './actions'

type JournalEntry = {
  id: string;
  symbol: string;
  setup_tag: 'ema_pullback' | 'vcp_breakout' | 'episodic_pivot' | 'other' | null;
  entry_date: string;
  entry_price: number;
  initial_stop: number;
  exit_date: string | null;
  exit_price: number | null;
  notes: string | null;
  r_multiple: number | null;
}

export function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chartData, setChartData] = useState<Record<string, PriceBar[]>>({})
  const [expandedChart, setExpandedChart] = useState<string | null>(null)

  // Form State
  const [symbol, setSymbol] = useState('')
  const [setupTag, setSetupTag] = useState<JournalEntry['setup_tag']>('ema_pullback')
  const [entryDate, setEntryDate] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [initialStop, setInitialStop] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetchJournal()
  }, [])

  const fetchJournal = async () => {
    try {
      const res = await fetch('/api/journal')
      if (!res.ok) throw new Error('Failed to fetch journal')
      const data = await res.json()
      setEntries(data)
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
      const payload = {
        symbol: symbol.toUpperCase(),
        setup_tag: setupTag,
        entry_date: new Date(entryDate).toISOString(),
        entry_price: parseFloat(entryPrice),
        initial_stop: parseFloat(initialStop),
        notes: notes || undefined
      }

      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to add')
      }
      
      setSymbol('')
      setEntryDate('')
      setEntryPrice('')
      setInitialStop('')
      setNotes('')
      fetchJournal()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleUpdateExit = async (id: string, exitPrice: number, exitDate: string) => {
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exit_price: exitPrice,
          exit_date: new Date(exitDate).toISOString()
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      fetchJournal()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleRemove = async (id: string) => {
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      fetchJournal()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const toggleChart = async (id: string, symbol: string) => {
    if (expandedChart === id) {
      setExpandedChart(null);
      return;
    }
    setExpandedChart(id);
    if (!chartData[id]) {
      try {
        const bars = await getChartBars(symbol);
        setChartData(prev => ({ ...prev, [id]: bars }));
      } catch (e) {
        console.error('Failed to load chart', e);
      }
    }
  }

  // Calculate Stats
  const stats = entries.reduce((acc, entry) => {
    if (entry.exit_price !== null && entry.r_multiple !== null) {
      const tag = entry.setup_tag || 'untagged';
      if (!acc[tag]) acc[tag] = { trades: 0, wins: 0, totalR: 0 };
      
      acc[tag].trades += 1;
      if (entry.r_multiple > 0) acc[tag].wins += 1;
      acc[tag].totalR += entry.r_multiple;
    }
    return acc;
  }, {} as Record<string, { trades: number, wins: number, totalR: number }>)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 text-center text-ink-light font-sans mt-20">
        <div className="inline-block text-lg font-medium">Loading trading ledger...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 bg-paper min-h-screen font-serif page-reveal">
      <div className="border-b-2 border-primary pb-4">
        <h1 className="text-3xl font-bold text-ink tracking-tight font-display">Trading Ledger</h1>
        <p className="text-ink-light italic">Record, measure, and refine your edge.</p>
        <p className="text-xs text-signature mt-2 font-sans font-medium bg-signature/10 border border-signature/20 p-2.5 rounded">
          * EOD Analytics Tool Disclaimer: StockBros is an end-of-day analytics and journal tool. It is not a live-trading or financial advice platform.
        </p>
      </div>

      {/* Stats Panel */}
      <section>
        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-ink font-display">Performance by Setup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).length === 0 ? (
             <div className="col-span-full text-sm text-ink-light italic bg-surface p-6 border border-dashed border-hairline rounded text-center shadow-card font-sans">
               No closed trades yet to calculate performance statistics.
             </div>
          ) : Object.entries(stats).map(([tag, data]) => {
            const winRate = ((data.wins / data.trades) * 100).toFixed(1)
            const avgR = (data.totalR / data.trades).toFixed(2)
            return (
              <Card key={tag} className="p-5 border-t-4 border-t-primary bg-surface rounded-none shadow-card">
                <EyebrowLabel className="mb-1 text-ink-light">{tag.replace('_', ' ')}</EyebrowLabel>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className="text-sm text-ink-light">Win Rate</div>
                    <div className="text-2xl font-semibold text-ink">{winRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink-light">Avg R</div>
                    <div className={`text-2xl font-semibold ${Number(avgR) > 0 ? 'text-data-up' : 'text-data-down'}`}>{avgR}R</div>
                  </div>
                </div>
                <div className="text-xs text-ink-light mt-2 text-right">{data.trades} Trades</div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Entry Form */}
      <Card className="p-6 bg-surface border-dashed border-2 border-hairline rounded-none">
        <h2 className="text-lg font-bold mb-4 font-sans text-ink">New Journal Entry</h2>
        <form onSubmit={handleAdd} className="space-y-4 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <EyebrowLabel>Symbol</EyebrowLabel>
              <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. RELIANCE" required />
            </div>
            <div>
              <EyebrowLabel>Setup</EyebrowLabel>
              <select 
                className="block w-full rounded-md border-hairline shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-surface text-ink"
                value={setupTag || ''} 
                onChange={e => setSetupTag(e.target.value as any)}
              >
                <option value="ema_pullback">EMA Pullback</option>
                <option value="vcp_breakout">VCP Breakout</option>
                <option value="episodic_pivot">Episodic Pivot</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <EyebrowLabel>Entry Date</EyebrowLabel>
              <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
            </div>
            <div>
              <EyebrowLabel>Entry Price</EyebrowLabel>
              <Input type="number" step="0.01" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} required />
            </div>
            <div>
              <EyebrowLabel>Initial Stop</EyebrowLabel>
              <Input type="number" step="0.01" value={initialStop} onChange={e => setInitialStop(e.target.value)} required />
            </div>
          </div>
          <div>
            <EyebrowLabel>Notes</EyebrowLabel>
            <textarea 
              className="block w-full rounded-md border-hairline bg-surface text-ink shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border" 
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="rounded-none bg-primary hover:bg-primary-hover text-white">Log Trade</Button>
          </div>
          {error && <p className="text-data-down text-sm">{error}</p>}
        </form>
      </Card>

      {/* Index Cards for Entries */}
      <section>
        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-ink font-display">Trade Ledger</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {entries.map(entry => (
            <Card key={entry.id} className="p-0 flex flex-col bg-surface border border-hairline shadow-card rounded-none overflow-hidden relative interactive-card">
              {/* Red line for index card feel */}
              <div className="absolute left-10 top-0 bottom-0 w-px bg-data-down/20"></div>
              
              <div className="pl-12 sm:pl-14 p-4 font-sans relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2 border-b border-hairline pb-2">
                  <div>
                    <h3 className="text-xl font-bold text-ink">{entry.symbol}</h3>
                    <div className="text-xs text-ink-light mt-1 uppercase">{entry.setup_tag?.replace('_', ' ')}</div>
                  </div>
                  <Badge variant={entry.r_multiple && entry.r_multiple > 0 ? 'up' : entry.r_multiple && entry.r_multiple <= 0 ? 'down' : 'default'}>
                    {entry.r_multiple !== null ? `${entry.r_multiple.toFixed(2)} R` : 'Open'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm text-ink my-2 flex-grow">
                  <div>
                    <span className="text-ink-light mr-2">In:</span>
                    {new Date(entry.entry_date).toLocaleDateString()} @ ${entry.entry_price}
                  </div>
                  <div>
                    <span className="text-ink-light mr-2">Stop:</span>
                    ${entry.initial_stop}
                  </div>
                  {entry.exit_price ? (
                    <div className="col-span-2">
                      <span className="text-ink-light mr-2">Out:</span>
                      {entry.exit_date && new Date(entry.exit_date).toLocaleDateString()} @ ${entry.exit_price}
                    </div>
                  ) : (
                    <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-hairline">
                      <form 
                        className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center w-full"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          handleUpdateExit(entry.id, Number(fd.get('exitPrice')), String(fd.get('exitDate')));
                        }}
                      >
                        <Input name="exitDate" type="date" required className="h-8 text-xs py-1 w-full sm:w-auto" />
                        <Input name="exitPrice" type="number" step="0.01" placeholder="Exit Price" required className="h-8 text-xs py-1 w-full sm:w-auto" />
                        <Button type="submit" className="h-8 text-xs py-1 rounded-none whitespace-nowrap bg-primary hover:bg-primary-hover w-full sm:w-auto text-white">Close Trade</Button>
                      </form>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <div className="mt-3 text-sm italic text-ink-light border-t border-hairline pt-2 font-serif">
                    "{entry.notes}"
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <button onClick={() => toggleChart(entry.id, entry.symbol)} className="text-xs text-primary hover:underline">
                    {expandedChart === entry.id ? 'Hide Chart' : 'Show Chart'}
                  </button>
                  <button onClick={() => handleRemove(entry.id)} className="text-xs text-data-down hover:underline">
                    Delete
                  </button>
                </div>

                {expandedChart === entry.id && chartData[entry.id] && (
                  <div className="mt-4 h-64 border-t border-hairline pt-4">
                    <PriceChart 
                      symbol={entry.symbol}
                      bars={chartData[entry.id]}
                      timeframe="1D"
                      showEma="off"
                      markers={[
                        { 
                          time: entry.entry_date.split('T')[0], 
                          position: 'belowBar', 
                          color: '#2196F3', 
                          shape: 'arrowUp', 
                          text: 'Entry' 
                        },
                        ...(entry.exit_date ? [{ 
                          time: entry.exit_date.split('T')[0], 
                          position: 'aboveBar', 
                          color: '#e91e63', 
                          shape: 'arrowDown', 
                          text: 'Exit' 
                        }] : [])
                      ]}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
          {entries.length === 0 && !loading && (
            <div className="col-span-full text-center text-ink-light py-12 bg-surface border border-dashed border-hairline rounded shadow-card font-sans">
              <p className="font-semibold text-ink">No trades logged in ledger yet.</p>
              <p className="text-sm text-ink-light mt-1">Use the entry form above to log your first trade setup and track performance.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
