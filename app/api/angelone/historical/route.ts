import { NextResponse } from 'next/server';
import { angelOneClient } from '@/features/angelone/angelOneClient';
import { memoryCache } from '@/lib/cache/memory-cache';
import { z } from 'zod';

const querySchema = z.object({
  symbol: z.string().min(1),
  interval: z.string().default('ONE_DAY'),
  from: z.string(),
  to: z.string(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = querySchema.safeParse({
    symbol: searchParams.get('symbol'),
    interval: searchParams.get('interval') || 'ONE_DAY',
    from: searchParams.get('from'),
    to: searchParams.get('to'),
  });

  if (!result.success) {
    return NextResponse.json({ error: 'Invalid parameters', details: result.error.issues }, { status: 400 });
  }

  const { symbol, interval, from, to } = result.data;
  const cacheKey = `${symbol}:${interval}:${from}:${to}`;

  // 1. Check in-memory LRU
  const memCached = memoryCache.get(cacheKey);
  if (memCached) {
    return NextResponse.json(memCached);
  }

  try {
    // 2. Fallback to AngelOneClient (which handles DB cache and API fetch)
    const fromDate = new Date(from);
    const toDate = new Date(to);
    
    // We only support ONE_DAY via getHistoricalDaily currently
    const bars = await angelOneClient.getHistoricalDaily(symbol, fromDate, toDate);
    
    // Cache in memory for 15 mins
    memoryCache.set(cacheKey, bars);
    
    return NextResponse.json(bars);
  } catch (error: any) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch data' }, { status: 500 });
  }
}
