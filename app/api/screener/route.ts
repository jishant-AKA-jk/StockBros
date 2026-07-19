import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getScreenerResults } from '@/features/screener/engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rule = searchParams.get('rule');
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const limit = parseInt(searchParams.get('limit') || '5', 10);

  if (!rule) {
    return NextResponse.json({ error: 'Missing rule parameter' }, { status: 400 });
  }

  try {
    const supabase = createClient();
    const rules = rule.split(',');

    const result = await getScreenerResults(supabase, rules, offset, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Screener API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
