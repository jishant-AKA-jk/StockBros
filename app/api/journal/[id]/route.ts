import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const updateJournalSchema = z.object({
  setup_tag: z.enum(['ema_pullback', 'vcp_breakout', 'episodic_pivot', 'other']).optional(),
  entry_date: z.string().optional(),
  entry_price: z.number().positive().optional(),
  initial_stop: z.number().positive().optional(),
  exit_date: z.string().nullable().optional(),
  exit_price: z.number().positive().nullable().optional(),
  notes: z.string().optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const json = await request.json()
    const parsed = updateJournalSchema.parse(json)

    // To compute R multiple, we might need existing entry_price / initial_stop if not provided
    const { data: existing, error: fetchError } = await supabase
      .from('journal_entries')
      .select('entry_price, initial_stop, exit_price')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
      
    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const finalEntryPrice = parsed.entry_price ?? existing.entry_price
    const finalInitialStop = parsed.initial_stop ?? existing.initial_stop
    const finalExitPrice = parsed.exit_price !== undefined ? parsed.exit_price : existing.exit_price

    let r_multiple: number | null = null;
    if (finalExitPrice !== null && finalEntryPrice !== finalInitialStop) {
      r_multiple = (finalExitPrice - finalEntryPrice) / (finalEntryPrice - finalInitialStop)
    }

    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        ...parsed,
        r_multiple
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
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

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
