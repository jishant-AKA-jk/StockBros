import { NextResponse } from 'next/server';
import { runScanner } from '@/features/scanner/engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');
  const rule = searchParams.get('rule');

  if (!symbol || !rule) {
    return NextResponse.json({ error: 'Missing symbol or rule parameter' }, { status: 400 });
  }

  try {
    const result = await runScanner(symbol, rule);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Scanner API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
