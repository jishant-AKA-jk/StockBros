import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { angelOneClient } from '@/features/angelone/angelOneClient'
import { 
  runHistoricalScan, 
  summarizeScan,
  emaStack, 
  tightConsolidation, 
  volumeSurge, 
  near52WeekHigh, 
  relativeStrength 
} from '@/features/screener'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { ruleId, target } = await request.json()
    // target can be 'universe' or 'watchlist'

    let symbolsToScan: string[] = []

    if (target === 'watchlist') {
      const { data: wl } = await supabase
        .from('watchlist_items')
        .select('symbol')
        .eq('user_id', user.id)
      
      if (wl) {
        symbolsToScan = wl.map(w => w.symbol)
      }
    } else {
      const { data: all } = await supabase
        .from('symbols')
        .select('ticker')
        .limit(150)
      if (all) {
        symbolsToScan = all.map(a => a.ticker)
      }
    }

    if (symbolsToScan.length === 0) {
      return NextResponse.json({ error: 'No symbols to scan' }, { status: 400 })
    }

    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setFullYear(fromDate.getFullYear() - 2) // 2 years back

    const allTriggers = []

    // For Relative Strength, we need a benchmark. Let's fetch NIFTY or RELIANCE
    let benchmarkBars: any[] = []
    if (ruleId === 'Relative_Strength') {
      benchmarkBars = await angelOneClient.getHistoricalDaily('RELIANCE', fromDate, toDate)
    }

    for (const sym of symbolsToScan) {
      try {
        const bars = await angelOneClient.getHistoricalDaily(sym, fromDate, toDate)
        
        let ruleFn: any = null;
        switch(ruleId) {
          case 'EMA_Stack': ruleFn = emaStack; break;
          case 'Tight_Consolidation': ruleFn = tightConsolidation; break;
          case 'Volume_Surge': ruleFn = volumeSurge; break;
          case 'Near_52W_High': ruleFn = near52WeekHigh; break;
          case 'Relative_Strength': ruleFn = (b: any, i: number) => relativeStrength(b, i, benchmarkBars); break;
        }

        if (ruleFn && bars.length > 0) {
          const triggers = runHistoricalScan(ruleFn, bars)
          // Tag triggers with the symbol
          allTriggers.push(...triggers.map(t => ({ ...t, symbol: sym })))
        }
      } catch (e) {
        // Ignore individual failures
      }
    }

    const summary = summarizeScan(allTriggers)

    return NextResponse.json({ summary, triggers: allTriggers.slice(-100) }) // return summary and up to 100 triggers
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
