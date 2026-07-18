'use server';

import { createClient } from '@/lib/supabase/server'
import { PriceBar } from '@/lib/types'

export async function getChartBars(symbol: string): Promise<PriceBar[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const toDateStr = new Date().toISOString().split('T')[0]
  const fromDate = new Date()
  fromDate.setFullYear(fromDate.getFullYear() - 1)
  const fromDateStr = fromDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('price_cache')
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol)
    .gte('date', fromDateStr)
    .lte('date', toDateStr)
    .order('date', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map(r => ({
    date: r.date,
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }))
}
