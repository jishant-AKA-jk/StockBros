'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { EyebrowLabel } from '@/components/ui/eyebrow-label'
import { MiniChart, PriceChart } from '@/features/charts/components'
import { ChartGrid } from '@/components/ChartGrid'
import { PriceBar, GridColumns, EMAConfig, ChartAnnotation } from '@/lib/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import { TrashIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline'

export type JournalEntryWithBars = {
  id: string;
  symbol: string;
  setup_tag: string | null;
  entry_date: string;
  entry_price: number;
  initial_stop: number;
  exit_date: string | null;
  exit_price: number | null;
  notes: string | null;
  r_multiple: number | null;
  bars: PriceBar[];
}

interface JournalClientProps {
  initialEntries: JournalEntryWithBars[];
}

export function JournalClient({ initialEntries }: JournalClientProps) {
  const router = useRouter()
  const [gridColumns, setGridColumns] = useState<GridColumns>(4)
  
  // Dialog states
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false)
  const [activeChartEntry, setActiveChartEntry] = useState<JournalEntryWithBars | null>(null)

  // Form State
  const [symbol, setSymbol] = useState('')
  const [setupTag, setSetupTag] = useState('ema_pullback')
  const [entryDate, setEntryDate] = useState('')
  const [entryPrice, setEntryPrice] = useState('')
  const [initialStop, setInitialStop] = useState('')
  const [notes, setNotes] = useState('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
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
      
      toast.success('Trade logged successfully!')
      setSymbol('')
      setEntryDate('')
      setEntryPrice('')
      setInitialStop('')
      setNotes('')
      setIsNewEntryOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateExit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const exitPrice = Number(fd.get('exitPrice'));
    const exitDateStr = String(fd.get('exitDate'));
    
    try {
      const res = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exit_price: exitPrice,
          exit_date: new Date(exitDateStr).toISOString()
        })
      })
      if (!res.ok) throw new Error('Failed to update')
      toast.success('Trade closed successfully!')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleRemove = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    
    try {
      const res = await fetch(`/api/journal/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      toast.success('Trade deleted')
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Calculate Stats
  const stats = initialEntries.reduce((acc, entry) => {
    if (entry.exit_price !== null && entry.r_multiple !== null) {
      const tag = entry.setup_tag || 'untagged';
      if (!acc[tag]) acc[tag] = { trades: 0, wins: 0, totalR: 0 };
      
      acc[tag].trades += 1;
      if (entry.r_multiple > 0) acc[tag].wins += 1;
      acc[tag].totalR += entry.r_multiple;
    }
    return acc;
  }, {} as Record<string, { trades: number, wins: number, totalR: number }>)

  const defaultEmas: EMAConfig[] = [
    { period: 10, color: '#f59e0b', enabled: true },
    { period: 20, color: '#3b82f6', enabled: true }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-8 page-reveal min-h-screen bg-paper font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-hairline pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ink tracking-tight font-display">Trading Ledger</h1>
          <p className="text-ink-light mt-1 text-sm">Record, measure, and refine your edge.</p>
        </div>
        
        <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary-hover text-white font-bold shadow-sm flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-paper border border-hairline p-0 gap-0 overflow-hidden">
            <DialogHeader className="p-6 bg-surface border-b border-hairline">
              <DialogTitle className="text-xl font-bold font-display text-ink">Log New Trade</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <EyebrowLabel>Symbol</EyebrowLabel>
                  <Input value={symbol} onChange={e => setSymbol(e.target.value)} placeholder="e.g. RELIANCE" required className="bg-surface" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <EyebrowLabel>Setup</EyebrowLabel>
                  <select 
                    className="block w-full rounded-md border-hairline shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 border bg-surface text-ink h-10"
                    value={setupTag || ''} 
                    onChange={e => setSetupTag(e.target.value as any)}
                  >
                    <option value="ema_pullback">EMA Pullback</option>
                    <option value="vcp_breakout">VCP Breakout</option>
                    <option value="episodic_pivot">Episodic Pivot</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <EyebrowLabel>Entry Date</EyebrowLabel>
                  <Input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required className="bg-surface" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <EyebrowLabel>Entry Price</EyebrowLabel>
                  <Input type="number" step="0.01" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} required className="bg-surface" />
                </div>
                <div className="col-span-2">
                  <EyebrowLabel>Initial Stop</EyebrowLabel>
                  <Input type="number" step="0.01" value={initialStop} onChange={e => setInitialStop(e.target.value)} required className="bg-surface" />
                </div>
                <div className="col-span-2">
                  <EyebrowLabel>Notes</EyebrowLabel>
                  <textarea 
                    className="block w-full rounded-md border-hairline bg-surface text-ink shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-3 border" 
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Why did you take this trade?"
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsNewEntryOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary text-white">
                  {isSubmitting ? 'Saving...' : 'Save Trade'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Panel */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-4">Performance by Setup</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(stats).length === 0 ? (
             <div className="col-span-full text-sm text-ink-light italic bg-surface p-6 border border-dashed border-hairline rounded-xl text-center shadow-inner">
               No closed trades yet to calculate performance statistics.
             </div>
          ) : Object.entries(stats).map(([tag, data]) => {
            const winRate = ((data.wins / data.trades) * 100).toFixed(1)
            const avgR = (data.totalR / data.trades).toFixed(2)
            return (
              <Card key={tag} className="p-5 border-t-4 border-t-primary bg-surface rounded-xl shadow-sm transition-all hover:shadow-md">
                <EyebrowLabel className="mb-1 text-ink-light">{tag.replace('_', ' ')}</EyebrowLabel>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <div className="text-sm text-ink-light font-semibold mb-1">Win Rate</div>
                    <div className="text-2xl font-bold text-ink font-mono">{winRate}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-ink-light font-semibold mb-1">Avg R</div>
                    <div className={`text-2xl font-bold font-mono ${Number(avgR) > 0 ? 'text-data-up' : 'text-data-down'}`}>{avgR}R</div>
                  </div>
                </div>
                <div className="text-xs text-ink-light mt-4 pt-4 border-t border-hairline text-right font-medium">{data.trades} Trades</div>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Grid of Journal Entries */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-4 flex items-center justify-between">
          <span>Trade History</span>
          <span className="bg-surface border border-hairline px-2 py-0.5 rounded text-[10px]">
            {initialEntries.length} Total
          </span>
        </h2>
        
        {initialEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-hairline rounded-xl shadow-inner mt-4">
            <p className="font-medium text-ink">Your ledger is empty.</p>
            <p className="text-sm text-ink-light mt-1 mb-4">Log your first trade setup to track your edge over time.</p>
            <Button onClick={() => setIsNewEntryOpen(true)} className="bg-primary text-white">Log First Trade</Button>
          </div>
        ) : (
          <ChartGrid 
            items={initialEntries}
            columns={gridColumns}
            onColumnsChange={setGridColumns}
            total={initialEntries.length}
            renderCard={(entry) => (
              <div 
                className="relative group/card cursor-pointer"
                onClick={() => setActiveChartEntry(entry)}
              >
                {/* Visual Chart Base */}
                <MiniChart 
                  symbol={entry.symbol}
                  bars={entry.bars}
                  loading={false}
                  error={false}
                />
                
                {/* Badges - Persistent */}
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none flex flex-col items-end gap-2">
                  <span className="bg-surface/95 border border-hairline px-2 py-1 rounded text-[10px] font-bold text-ink uppercase tracking-wider shadow-sm">
                    {entry.setup_tag || 'Untagged'}
                  </span>
                  <Badge variant={entry.r_multiple && entry.r_multiple > 0 ? 'default' : entry.r_multiple !== null && entry.r_multiple <= 0 ? 'destructive' : 'default'} className="shadow-sm">
                    {entry.r_multiple !== null ? `${entry.r_multiple.toFixed(2)} R` : 'Open'}
                  </Badge>
                </div>
                
                {/* Hover Trade Details Overlay */}
                <div className="absolute inset-0 bg-paper/60 backdrop-blur-[3px] opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 z-30 flex flex-col justify-center p-6 border border-primary/20 rounded-xl shadow-lg">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-hairline">
                    <span className="font-bold text-ink text-lg">{entry.symbol}</span>
                    <button 
                      onClick={(e) => handleRemove(e, entry.id)} 
                      className="text-xs text-data-down hover:bg-data-down/20 p-1.5 rounded transition-colors"
                      title="Delete Trade"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                    <div>
                      <div className="text-xs text-ink-light mb-1">Entry Date</div>
                      <div className="font-mono font-medium text-ink">{new Date(entry.entry_date).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-light mb-1">Entry Price</div>
                      <div className="font-mono font-medium text-ink">${entry.entry_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-light mb-1">Stop Loss</div>
                      <div className="font-mono font-medium text-ink">${entry.initial_stop.toFixed(2)}</div>
                    </div>
                    
                    {entry.exit_price ? (
                      <>
                        <div>
                          <div className="text-xs text-ink-light mb-1">Exit Date</div>
                          <div className="font-mono font-medium text-ink">{entry.exit_date && new Date(entry.exit_date).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <div className="text-xs text-ink-light mb-1">Exit Price</div>
                          <div className="font-mono font-medium text-ink">${entry.exit_price.toFixed(2)}</div>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2 border border-dashed border-hairline rounded-lg p-2 bg-surface mt-2" onClick={e => e.stopPropagation()}>
                        <form 
                          className="flex flex-col gap-2"
                          onSubmit={(e) => handleUpdateExit(e, entry.id)}
                        >
                          <div className="text-xs font-semibold text-ink-light mb-1">Close Trade</div>
                          <div className="flex gap-2">
                            <Input name="exitDate" type="date" required className="h-8 text-xs py-1 flex-1 bg-paper" />
                            <Input name="exitPrice" type="number" step="0.01" placeholder="Exit $" required className="h-8 text-xs py-1 flex-1 bg-paper" />
                            <Button type="submit" className="h-8 w-8 p-0 shrink-0 bg-primary text-white flex items-center justify-center" title="Save Exit">
                              <CheckIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                  
                  {entry.notes && (
                    <div 
                      className="mt-4 pt-3 border-t border-hairline text-xs text-ink-light italic line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/scanner?symbol=${entry.symbol}&focusTime=${new Date(entry.entry_date).getTime()}`);
                      }}
                      title="View on chart"
                    >
                      "{entry.notes}"
                    </div>
                  )}
                  
                  <div className="mt-auto pt-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Click to view chart</span>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </section>

      {/* Full Chart Dialog */}
      <Dialog open={!!activeChartEntry} onOpenChange={(open) => !open && setActiveChartEntry(null)}>
        <DialogContent className="max-w-[90vw] md:max-w-4xl h-[80vh] flex flex-col bg-paper border border-hairline p-0 overflow-hidden shadow-2xl">
          {activeChartEntry && (
            <>
              <DialogHeader className="p-4 bg-surface border-b border-hairline shrink-0">
                <div className="flex items-center justify-between mr-8">
                  <DialogTitle className="text-xl font-bold font-display text-ink flex items-center gap-3">
                    {activeChartEntry.symbol}
                    <Badge variant={activeChartEntry.r_multiple && activeChartEntry.r_multiple > 0 ? 'default' : activeChartEntry.r_multiple !== null && activeChartEntry.r_multiple <= 0 ? 'destructive' : 'default'} className="text-xs">
                      {activeChartEntry.r_multiple !== null ? `${activeChartEntry.r_multiple.toFixed(2)} R` : 'Open'}
                    </Badge>
                  </DialogTitle>
                </div>
              </DialogHeader>
              <div className="flex-1 p-2 bg-surface">
                <PriceChart 
                  symbol={activeChartEntry.symbol}
                  bars={activeChartEntry.bars}
                  timeframe="1D"
                  emas={defaultEmas}
                  annotations={[
                    { 
                      date: activeChartEntry.entry_date.split('T')[0], 
                      price: activeChartEntry.entry_price,
                      type: 'entry',
                      color: '#2196F3', 
                      label: 'Entry' 
                    },
                    ...(activeChartEntry.exit_date ? [{ 
                      date: activeChartEntry.exit_date.split('T')[0], 
                      price: activeChartEntry.exit_price || 0,
                      type: 'exit',
                      color: '#e91e63', 
                      label: 'Exit' 
                    } as ChartAnnotation] : [])
                  ]}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
