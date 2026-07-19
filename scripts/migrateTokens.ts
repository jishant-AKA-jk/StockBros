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

async function main() {
  console.log('Migrating tokens...');
  
  // Get all symbols
  const { data: symbols, error } = await supabase
    .from('symbols')
    .select('ticker, dhan_security_id, angel_one_symbol_token');
    
  if (error) {
    console.error('Error fetching symbols:', error);
    return;
  }
  
  let migrated = 0;
  
  for (const sym of symbols) {
    if (sym.dhan_security_id && !sym.angel_one_symbol_token) {
      const { error: updateError } = await supabase
        .from('symbols')
        .update({ angel_one_symbol_token: sym.dhan_security_id })
        .eq('ticker', sym.ticker);
        
      if (updateError) {
        console.error(`Failed to update ${sym.ticker}:`, updateError);
      } else {
        migrated++;
      }
    }
  }
  
  console.log(`Successfully migrated ${migrated} symbols.`);
}

main().catch(console.error);
