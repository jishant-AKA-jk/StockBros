import * as dotenv from 'dotenv';
import * as path from 'path';
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

const NIFTY_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR',
  'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK', 'LT', 'BAJFINANCE',
  'ASIANPAINT', 'AXISBANK', 'MARUTI', 'TITAN', 'SUNPHARMA', 'TATASTEEL',
  'ULTRACEMCO', 'TATAMOTORS', 'WIPRO', 'NESTLEIND', 'POWERGRID', 'NTPC',
  'M&M', 'HCLTECH', 'TECHM', 'ADANIENT', 'ADANIPORTS', 'ONGC',
  'HINDALCO', 'JSWSTEEL', 'GRASIM', 'BAJAJFINSV', 'DRREDDY', 'CIPLA',
  'DIVISLAB', 'SBILIFE', 'BRITANNIA', 'EICHERMOT', 'COALINDIA', 'BPCL',
  'HEROMOTOCO', 'APOLLOHOSP', 'TATASTLLP', 'HDFCLIFE', 'UPL', 'TATACONSUM',
  'BAJAJ-AUTO', 'INDUSINDBK', 'PIDILITIND', 'SHREECEM', 'CHOLAFIN', 'TVSMOTOR',
  'LTIM', 'GODREJCP', 'TORNTPHARM', 'DLF', 'ZOMATO', 'HAL', 'BEL',
  'SIEMENS', 'ABB', 'AMBUJACEM', 'HAVELLS', 'BANKBARODA', 'PNB',
  'INDIGO', 'IOC', 'VEDL', 'GAIL', 'MUTHOOTFIN', 'SRF',
  'MARICO', 'ICICIPRULI', 'DABUR', 'COLPAL', 'ICICIGI', 'HDFCAMC',
  'BERGEPAINT', 'AUBANK', 'MOTHERSON', 'TRENT', 'CUMMINSIND', 'BOSCHLTD',
  'OFSS', 'LUPIN', 'AUROPHARMA', 'PIIND', 'PERSISTENT', 'POLYCAB',
  'DIXON', 'IDFCFIRSTB', 'PAYTM', 'YESBANK', 'IRFC', 'JINDALSTEL',
  'OBEROIRLTY', 'VOLTAS', 'TATACOMM', 'MRF', 'PAGEIND', 'UBL', 'NAUKRI',
  'MCDOWELL-N', 'STARHEALTH', 'NYKAA', 'MAXHEALTH', 'BANDHANBNK', 'CGPOWER',
  'PETRONET', 'COROMANDEL', 'MFSL', 'APOLLOTYRE', 'BIOCON', 'SYNGENE',
  'GMRINFRA', 'L&TFH', 'ESCORTS', 'DEEPAKNTR', 'BATAINDIA', 'ZEEL',
  'IDEA', 'BHEL', 'SAIL', 'NATIONALUM', 'LICHSGFIN', 'IBULHSGFIN',
  'ABCAPITAL', 'PFC', 'RECLTD', 'M&MFIN', 'CHAMBLFERT', 'MANAPPURAM'
];

async function main() {
  console.log('Logging into Angel One...');
  await angelOneClient.login();

  console.log('Fetching Instruments Master to populate symbols table...');
  await angelOneClient.fetchInstrumentsMaster();

  console.log('Instruments fetched. Waiting a moment...');
  await new Promise(r => setTimeout(r, 2000));

  const { data: symbols, error } = await supabase
    .from('symbols')
    .select('ticker, dhan_security_id')
    .in('ticker', NIFTY_SYMBOLS);

  if (error || !symbols || symbols.length === 0) {
    console.error('Could not find Nifty symbols in DB after syncing.', error);
    return;
  }

  console.log(`Found ${symbols.length} matching symbols in DB. Proceeding with backfill...`);

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 2);

  for (let i = 0; i < symbols.length; i++) {
    const sym = symbols[i];
    console.log(`[${i + 1}/${symbols.length}] Fetching 2 years of daily data for ${sym.ticker}...`);
    try {
      const bars = await angelOneClient.getHistoricalDaily(sym.ticker, fromDate, toDate);
      console.log(`  => Retrieved ${bars.length} bars. Last bar: ${bars[bars.length - 1]?.date}`);
    } catch (e) {
      console.error(`  => Error fetching data for ${sym.ticker}:`, e);
    }
  }

  console.log('\nFinished seeding database.');
}

main().catch(console.error);
