import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const journalSchema = z.object({
  symbol: z.string().min(1),
  setup_tag: z.enum(['ema_pullback', 'vcp_breakout', 'episodic_pivot', 'other']).optional(),
  entry_date: z.string(), // ISO date
  entry_price: z.number().positive(),
  initial_stop: z.number().positive(),
  exit_date: z.string().nullable().optional(),
  exit_price: z.number().positive().nullable().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('entry_date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await request.json()
    const parsed = journalSchema.parse(json)

    // Compute r_multiple
    let r_multiple: number | null = null;
    if (parsed.exit_price && parsed.entry_price !== parsed.initial_stop) {
      r_multiple = (parsed.exit_price - parsed.entry_price) / (parsed.entry_price - parsed.initial_stop)
    }

    const { data: symbolData, error: symbolError } = await supabase
      .from('symbols')
      .select('ticker')
      .eq('ticker', parsed.symbol)
      .single()

    if (symbolError || !symbolData) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        symbol: parsed.symbol,
        setup_tag: parsed.setup_tag,
        entry_date: parsed.entry_date,
        entry_price: parsed.entry_price,
        initial_stop: parsed.initial_stop,
        exit_date: parsed.exit_date,
        exit_price: parsed.exit_price,
        notes: parsed.notes,
        r_multiple
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
