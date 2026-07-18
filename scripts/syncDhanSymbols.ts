import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('Fetching Dhan scrip master...');
  const res = await fetch('https://images.dhan.co/api-data/api-scrip-master.csv');
  const csvText = await res.text();
  
  console.log('Parsing CSV...');
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });
  
  if (records.length === 0) {
    console.log('No records found in CSV.');
    return;
  }
  
  // Just print the first record to see the keys
  console.log('Sample record:', records[0]);
  
  // Find NSE equities
  const nseEquities = (records as Record<string, string>[]).filter((r) => {
    // Exchange can be SEM_EXM_EXCH_ID = 'NSE'
    // Segment can be SEM_SEGMENT = 'EQ'
    // Let's rely on standard Dhan headers: SEM_EXM_EXCH_ID, SEM_SEGMENT, SEM_SMST_SECURITY_ID, SEM_CUSTOM_SYMBOL, SEM_TRADING_SYMBOL
    // If headers differ, we will see it in the log
    return r.SEM_EXM_EXCH_ID === 'NSE' && r.SEM_INSTRUMENT_NAME === 'EQUITY';
  });
  
  console.log(`Found ${nseEquities.length} NSE equities.`);
  
  // We'll insert a sample of 100 for now just to populate the DB, or all of them.
  // The requirement says "with a script in /scripts to refresh it manually."
  // We can insert all NSE equities, it's about 2000+ symbols.
  
  const toInsert = Array.from(
    new Map(
      nseEquities
        .map((r) => ({
          ticker: r.SEM_TRADING_SYMBOL,
          dhan_security_id: r.SEM_SMST_SECURITY_ID,
          exchange_segment: 'NSE_EQ',
          name: r.SEM_CUSTOM_SYMBOL || r.SM_SYMBOL_NAME,
        }))
        .filter((x: { ticker: string, dhan_security_id: string }) => x.ticker && x.dhan_security_id)
        .map((x: { ticker: string, dhan_security_id: string }) => [x.ticker, x])
    ).values()
  );
  
  console.log(`Inserting ${toInsert.length} symbols into Supabase...`);
  
  const BATCH_SIZE = 500;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('symbols')
      .upsert(batch, { onConflict: 'ticker' });
      
    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE}:`, error);
    } else {
      console.log(`Inserted batch ${i / BATCH_SIZE + 1}`);
    }
  }
  
  console.log('Done syncing symbols.');
}

main().catch(console.error);
