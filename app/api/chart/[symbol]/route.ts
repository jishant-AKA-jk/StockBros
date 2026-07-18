import { NextResponse } from 'next/server'
import { angelOneClient } from '@/features/angelone/angelOneClient'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request, { params }: { params: { symbol: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const toDate = new Date()
    const fromDate = new Date()
    fromDate.setFullYear(fromDate.getFullYear() - 1)
    
    const bars = await angelOneClient.getHistoricalDaily(params.symbol, fromDate, toDate)
    return NextResponse.json(bars)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
