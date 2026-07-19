import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const addWatchlistSchema = z.object({
  symbol: z.string().min(1),
  tag: z.enum(['momentum', 'value', 'dividend', 'speculative', 'other']).optional(),
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
      .from('watchlist_items')
      .select('*')
      .order('created_at', { ascending: false })

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
    const parsed = addWatchlistSchema.parse(json)

    // Validate symbol exists (simplified for now, ideally check symbols table)
    const { data: symbolData, error: symbolError } = await supabase
      .from('symbols')
      .select('ticker')
      .eq('ticker', parsed.symbol)
      .single()

    if (symbolError || !symbolData) {
      return NextResponse.json({ error: 'Symbol not found' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('watchlist_items')
      .insert({
        user_id: user.id,
        symbol: parsed.symbol,
        tag: parsed.tag,
        notes: parsed.notes,
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
