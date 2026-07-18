'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Badge, Input, EyebrowLabel } from '@/components'

import { PriceChart } from '@/features/charts/components/PriceChart'
import { PriceBar } from '@/lib/types'

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
        const res = await fetch(`/api/chart/${symbol}`);
        if (res.ok) {
          const bars = await res.json();
          setChartData(prev => ({ ...prev, [id]: bars }));
        }
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

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 bg-gray-50 min-h-screen font-serif">
      <div className="border-b-2 border-gray-900 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Trading Ledger</h1>
        <p className="text-gray-600 italic">Record, measure, and refine your edge.</p>
      </div>

      {/* Stats Panel */}
      <section>
        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-gray-800">Performance by Setup</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).length === 0 ? (
             <div className="text-gray-500 italic">No closed trades yet to calculate stats.</div>
          ) : Object.entries(stats).map(([tag, data]) => {
            const winRate = ((data.wins / data.trades) * 100).toFixed(1)
            const avgR = (data.totalR / data.trades).toFixed(2)
            return (
              <Card key={tag} className="p-5 border-t-4 border-t-gray-800 bg-[#fdfdfc] rounded-none shadow-sm">
                <EyebrowLabel className="mb-1 text-gray-400">{tag.replace('_', ' ')}</EyebrowLabel>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className="text-sm text-gray-500">Win Rate</div>
                    <div className="text-2xl font-semibold">{winRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Avg R</div>
                    <div className={`text-2xl font-semibold ${Number(avgR) > 0 ? 'text-green-600' : 'text-red-600'}`}>{avgR}R</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-2 text-right">{data.trades} Trades</div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Entry Form */}
      <Card className="p-6 bg-white border-dashed border-2 border-gray-300 rounded-none">
        <h2 className="text-lg font-bold mb-4 font-sans">New Journal Entry</h2>
        <form onSubmit={handleAdd} className="space-y-4 font-sans">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <EyebrowLabel>Symbol</EyebrowLabel>
              <Input value={symbol} onChange={e => setSymbol(e.target.value)} required />
            </div>
            <div>
              <EyebrowLabel>Setup</EyebrowLabel>
              <select 
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border bg-white"
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
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border" 
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="rounded-none bg-gray-900 hover:bg-gray-800">Log Trade</Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </form>
      </Card>

      {/* Index Cards for Entries */}
      <section>
        <h2 className="text-xl font-bold mb-4 uppercase tracking-widest text-gray-800">Trade Ledger</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {entries.map(entry => (
            <Card key={entry.id} className="p-0 flex flex-col bg-[#fffdf0] border border-[#e2d5a3] shadow-sm rounded-none overflow-hidden relative">
              {/* Red line for index card feel */}
              <div className="absolute left-10 top-0 bottom-0 w-px bg-red-200"></div>
              
              <div className="pl-14 p-4 font-sans relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2 border-b border-blue-100 pb-2">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{entry.symbol}</h3>
                    <div className="text-xs text-gray-500 mt-1 uppercase">{entry.setup_tag?.replace('_', ' ')}</div>
                  </div>
                  <Badge variant={entry.r_multiple && entry.r_multiple > 0 ? 'success' : entry.r_multiple && entry.r_multiple <= 0 ? 'danger' : 'default'}>
                    {entry.r_multiple !== null ? `${entry.r_multiple.toFixed(2)} R` : 'Open'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-y-2 text-sm text-gray-700 my-2 flex-grow">
                  <div>
                    <span className="text-gray-400 mr-2">In:</span>
                    {new Date(entry.entry_date).toLocaleDateString()} @ ${entry.entry_price}
                  </div>
                  <div>
                    <span className="text-gray-400 mr-2">Stop:</span>
                    ${entry.initial_stop}
                  </div>
                  {entry.exit_price ? (
                    <div className="col-span-2">
                      <span className="text-gray-400 mr-2">Out:</span>
                      {entry.exit_date && new Date(entry.exit_date).toLocaleDateString()} @ ${entry.exit_price}
                    </div>
                  ) : (
                    <div className="col-span-2 mt-2 pt-2 border-t border-dashed border-gray-300">
                      <form 
                        className="flex gap-2 items-center"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          handleUpdateExit(entry.id, Number(fd.get('exitPrice')), String(fd.get('exitDate')));
                        }}
                      >
                        <Input name="exitDate" type="date" required className="h-8 text-xs py-1" />
                        <Input name="exitPrice" type="number" step="0.01" placeholder="Exit Price" required className="h-8 text-xs py-1" />
                        <Button type="submit" className="h-8 text-xs py-1 rounded-none whitespace-nowrap bg-gray-700">Close Trade</Button>
                      </form>
                    </div>
                  )}
                </div>

                {entry.notes && (
                  <div className="mt-3 text-sm italic text-gray-600 border-t border-gray-200 pt-2 font-serif">
                    "{entry.notes}"
                  </div>
                )}

                <div className="mt-4 flex justify-between items-center">
                  <button onClick={() => toggleChart(entry.id, entry.symbol)} className="text-xs text-blue-500 hover:underline">
                    {expandedChart === entry.id ? 'Hide Chart' : 'Show Chart'}
                  </button>
                  <button onClick={() => handleRemove(entry.id)} className="text-xs text-red-500 hover:underline">
                    Delete
                  </button>
                </div>

                {expandedChart === entry.id && chartData[entry.id] && (
                  <div className="mt-4 h-64 border-t border-gray-200 pt-4">
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
            <div className="col-span-2 text-center text-gray-500 py-12">No trades logged yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}
