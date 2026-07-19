import { NextResponse } from 'next/server';
import { runScanner } from '@/features/scanner/engine';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const rule = searchParams.get('rule');

    if (!symbol || !rule) {
      return NextResponse.json({ error: 'Missing symbol or rule parameter' }, { status: 400 });
    }

    const result = await runScanner(symbol, rule);
    return NextResponse.json(result);
  } catch (err: unknown) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
