import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { angelOneClient } from '@/features/angelone/angelOneClient';

// Ensure this API route is not cached by Next.js
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Protect the endpoint in production using CRON_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  // Use admin client to query all users' watchlists and journals
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Fetch unique symbols in user watchlists and journals
    const { data: watchlistItems, error: wlError } = await supabase
      .from('watchlist_items')
      .select('symbol');
    
    const { data: journalEntries, error: jError } = await supabase
      .from('journal_entries')
      .select('symbol');

    if (wlError) {
      console.error('Error fetching watchlist items:', wlError);
    }
    if (jError) {
      console.error('Error fetching journal entries:', jError);
    }

    const symbolsSet = new Set<string>();
    watchlistItems?.forEach((item) => {
      if (item.symbol) symbolsSet.add(item.symbol.toUpperCase());
    });
    journalEntries?.forEach((entry) => {
      if (entry.symbol) symbolsSet.add(entry.symbol.toUpperCase());
    });

    // Fallback default list if no items exist in watchlist or journals
    if (symbolsSet.size === 0) {
      ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'].forEach((symbol) => {
        symbolsSet.add(symbol);
      });
    }

    const symbolsToRefresh = Array.from(symbolsSet);
    console.log(`Starting EOD refresh for ${symbolsToRefresh.length} symbols:`, symbolsToRefresh);

    // 2. Login to Angel One
    await angelOneClient.login();

    // 3. Refresh each symbol sequentially
    const results: Record<string, { success: boolean; date?: string; error?: string }> = {};
    for (const symbol of symbolsToRefresh) {
      try {
        const latestBar = await angelOneClient.refreshLatestBar(symbol);
        if (latestBar) {
          results[symbol] = { success: true, date: latestBar.date };
        } else {
          results[symbol] = { success: false, error: 'No data retrieved' };
        }
      } catch (err: unknown) {
        console.error(`Error refreshing ${symbol}:`, err);
        const errMsg = err instanceof Error ? err.message : String(err);
        results[symbol] = { success: false, error: errMsg };
      }
    }

    return NextResponse.json({
      success: true,
      refreshedCount: symbolsToRefresh.length,
      results,
    });
  } catch (error: unknown) {
    console.error('EOD refresh cron failed:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: errMsg },
      { status: 500 }
    );
  }
}
