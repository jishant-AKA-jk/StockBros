import { createClient } from '@/lib/supabase/server';
import { angelOneClient } from '@/features/angelone/angelOneClient';
import { ScannerClient } from './ScannerClient';

interface ScannerPageProps {
  searchParams: { symbol?: string };
}

export default async function ScannerPage({ searchParams }: ScannerPageProps) {
  const symbol = searchParams.symbol?.toUpperCase() || 'RELIANCE';
  
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 1);
  
  let bars: any[] = [];
  
  try {
    bars = await angelOneClient.getHistoricalDaily(symbol, fromDate, toDate);
  } catch (e) {
    console.error('Error fetching bars for', symbol, e);
  }

  return <ScannerClient symbol={symbol} initialBars={bars} />;
}
