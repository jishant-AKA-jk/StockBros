import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { angelOneClient } from '../features/angelone/angelOneClient';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const NIFTY_200 = [
  "ACC", "ADANIENT", "ADANIGREEN", "ADANIPORTS", "AMBUJACEM", "ASIANPAINT",
  "AXISBANK", "BAJAJ-AUTO", "BAJFINANCE", "BAJAJFINSV", "BPCL", "BHARTIARTL",
  "BRITANNIA", "CIPLA", "COALINDIA", "DIVISLAB", "DRREDDY", "EICHERMOT",
  "GRASIM", "HCLTECH", "HDFCBANK", "HDFCLIFE", "HEROMOTOCO", "HINDALCO",
  "HINDUNILVR", "ICICIBANK", "INDUSINDBK", "INFY", "ITC", "JSWSTEEL",
  "KOTAKBANK", "LT", "LTIM", "M&M", "MARUTI", "NESTLEIND", "NTPC",
  "ONGC", "POWERGRID", "RELIANCE", "SBILIFE", "SBIN", "SUNPHARMA",
  "TATACONSUM", "TATAMOTORS", "TATASTEEL", "TCS", "TECHM", "TITAN",
  "ULTRACEMCO", "WIPRO", "APOLLOHOSP", "BAJAJHLDNG", "BANKBARODA",
  "BEL", "CHOLAFIN", "DLF", "GAIL", "GODREJCP", "HAL", "HAVELLS",
  "ICICIGI", "ICICIPRULI", "INDIANB", "INDIGO", "IOC", "IRCTC", "JINDALSTEL",
  "MARICO", "MUTHOOTFIN", "NAUKRI", "PIDILITIND", "PIIND", "PNB",
  "PFC", "RECLTD", "SHREECEM", "SIEMENS", "SRF", "TORNTPHARM",
  "TRENT", "TVSMOTOR", "UBL", "VEDL", "ZOMATO", "ABB", "ABBOTINDIA",
  "ABCAPITAL", "ABFRL", "ASTRAL", "AUBANK", "AUROPHARMA", "BALKRISIND",
  "BANDHANBNK", "BANKINDIA", "BATAINDIA", "BERGEPAINT", "BHARATFORG",
  "BIOCON", "BOSCHLTD", "CANBK", "CGPOWER", "CHAMBLFERT", "COFORGE",
  "COLPAL", "CONCOR", "COROMANDEL", "CROMPTON", "CUMMINSIND", "DALBHARAT",
  "DEEPAKNTR", "DELHIVERY", "DIXON", "ESCORTS", "EXIDEIND", "FEDERALBNK",
  "FORTIS", "GLENMARK", "GMRINFRA", "GODREJPROP", "GUJGASLTD", "HDFCAMC",
  "HINDPETRO", "HONAUT", "IGL", "INDHOTEL", "INDUSTOWER", "IPCALAB",
  "J&KBANK", "JKCEMENT", "JSWENERGY", "JUBLFOOD", "KALYANKJIL", "KEI",
  "L&TFH", "LAURUSLABS", "LICHSGFIN", "LODHA", "M&MFIN", "MAXHEALTH",
  "MAZDOCK", "METROPOLIS", "MFSL", "MPHASIS", "MRF", "NATIONALUM",
  "NAVINFLUOR", "NMDC", "OBEROIRLTY", "OIL", "PAGEIND", "PATANJALI",
  "PEL", "PERSISTENT", "PETRONET", "POLYCAB", "POONAWALLA", "PRESTIGE",
  "RAMCOCEM", "RVNL", "SAIL", "SONACOMS", "SUNDARMFIN", "SUPREMEIND",
  "SYNGENE", "TATACHEM", "TATACOMM", "TATAELXSI", "UCOBANK",
  "UNIONBANK", "UNITDSPR", "VOLTAS", "YESBANK", "ZEEL"
];

function formatISODate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`; 
}

async function main() {
  console.log('Starting seed-data script...');
  
  // 1. Resolve symbol tokens and upsert using Phase 1A instrument master function
  console.log('Resolving symbol tokens via Phase 1A instrument master (fetching all NSE symbols)...');
  await angelOneClient.fetchInstrumentsMaster();
  console.log('Finished upserting symbols to database.');

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 2);

  const toStr = formatISODate(toDate);

  // 2. Fetch historical data respecting cache
  let completed = 0;
  const startTime = Date.now();

  for (const symbol of NIFTY_200) {
    try {
      console.log(`[${completed + 1}/${NIFTY_200.length}] Processing ${symbol}...`);
      
      // Phase 1A's caching-aware fetch (it will only fetch missing gap or return cached)
      const bars = await angelOneClient.getHistoricalDaily(symbol, fromDate, toDate);
      
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${completed + 1}/${NIFTY_200.length}] Done ${symbol} (${bars.length} bars retrieved). Total time: ${elapsed}s`);
    } catch (error: any) {
      console.error(`  -> Error processing ${symbol}: ${error.message || error}`);
    }
    completed++;
  }

  console.log('Finished seed-data script.');
}

main().catch(console.error);
