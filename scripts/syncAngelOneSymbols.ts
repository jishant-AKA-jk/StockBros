import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface AngelOneInstrument {
  token: string;
  symbol: string;
  name: string;
  expiry: string;
  strike: string;
  lotsize: string;
  instrumenttype: string;
  exch_seg: string;
  tick_size: string;
}

const MASTER_URL = 'https://margincalculator.angelone.in/OpenAPI_File/files/OpenAPIScripMaster.json';

async function main() {
  console.log('Downloading Angel One instrument master...');
  const response = await fetch(MASTER_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to download master file: ${response.statusText}`);
  }

  const data: AngelOneInstrument[] = await response.json();
  console.log(`Downloaded ${data.length} instruments.`);

  // Filter for NSE equities
  // NSE equities usually have exch_seg = 'NSE' and symbol ends with '-EQ'
  const nseEquities = data.filter(
    (item) => item.exch_seg === 'NSE' && item.symbol.endsWith('-EQ')
  );

  console.log(`Found ${nseEquities.length} NSE equities.`);

  // Fetch existing symbols to map their ticker
  // Angel One symbol usually is "TICKER-EQ". 
  // We'll strip "-EQ" to match our `ticker` (e.g. RELIANCE, TCS).
  
  console.log('Fetching existing symbols from DB...');
  const { data: existingSymbols, error } = await supabase
    .from('symbols')
    .select('ticker');

  if (error) {
    throw new Error(`Failed to fetch existing symbols: ${error.message}`);
  }

  const existingTickers = new Set(existingSymbols.map((s) => s.ticker));

  const rowsToUpsert = [];

  for (const eq of nseEquities) {
    const baseTicker = eq.symbol.replace('-EQ', '');
    
    // We update angel_one_symbol_token where the ticker matches.
    // If it's a new ticker, we insert it.
    if (existingTickers.has(baseTicker)) {
      rowsToUpsert.push({
        ticker: baseTicker,
        dhan_security_id: eq.token,
        exchange_segment: eq.exch_seg,
        name: eq.name
      });
    } else {
      // It's a new ticker not seen before. We can insert it if we want.
      // But typically we only want to update existing ones or insert all.
      // We will insert all NSE equities.
      rowsToUpsert.push({
        ticker: baseTicker,
        dhan_security_id: eq.token,
        exchange_segment: eq.exch_seg,
        name: eq.name,
        // angel_one_symbol_token was a typo, we use dhan_security_id
      });
    }
  }

  console.log(`Upserting ${rowsToUpsert.length} symbols to DB...`);
  
  // Upsert in chunks to avoid large payload errors
  const chunkSize = 1000;
  for (let i = 0; i < rowsToUpsert.length; i += chunkSize) {
    const chunk = rowsToUpsert.slice(i, i + chunkSize);
    const { error: upsertError } = await supabase
      .from('symbols')
      .upsert(chunk, { onConflict: 'ticker' });

    if (upsertError) {
      console.error(`Failed to upsert chunk ${i}:`, upsertError);
    } else {
      console.log(`Upserted ${i + chunk.length}/${rowsToUpsert.length}`);
    }
  }

  console.log('Done syncing Angel One symbols.');
}

main().catch(console.error);
