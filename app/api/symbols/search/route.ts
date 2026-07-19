import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) {
      return NextResponse.json([])
    }

    const supabase = createClient()

    // Search by ticker or name
    const { data, error } = await supabase
      .from('symbols')
      .select('ticker, name')
      .or(`ticker.ilike.%${q}%,name.ilike.%${q}%`)
      .limit(10)

    if (error) {
      console.error('Error fetching symbols:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    console.error('API Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
