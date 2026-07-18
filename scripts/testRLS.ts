import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('Testing RLS policies...');
  
  const client1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const client2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const admin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // 1. Create two users
  const email1 = `test1_${Date.now()}@example.com`;
  const email2 = `test2_${Date.now()}@example.com`;
  const password = 'Password123!';
  
  console.log('Creating User 1...');
  const { data: user1Data, error: err1 } = await client1.auth.signUp({ email: email1, password });
  if (err1) throw err1;
  
  console.log('Creating User 2...');
  const { data: user2Data, error: err2 } = await client2.auth.signUp({ email: email2, password });
  if (err2) throw err2;
  
  console.log('User 1 ID:', user1Data.user?.id);
  console.log('User 2 ID:', user2Data.user?.id);

  // We need a valid symbol for tests to succeed because of the foreign key `REFERENCES symbols(ticker)`
  const testSymbol = 'TEST_RLS_SYMBOL';
  await admin.from('symbols').insert({ ticker: testSymbol, name: 'Test Symbol' }).select().maybeSingle();
  
  // 2. User 1 inserts a watchlist item
  console.log('\nUser 1 inserting a watchlist item...');
  const { data: insertData, error: insertError } = await client1
    .from('watchlist_items')
    .insert({
      user_id: user1Data.user!.id,
      symbol: testSymbol,
      tag: 'momentum'
    })
    .select()
    .single();
    
  if (insertError) throw insertError;
  console.log('Successfully inserted watchlist item for User 1:', insertData.id);
  
  // 3. User 1 can see it
  console.log('\nUser 1 querying watchlist...');
  const { data: query1 } = await client1.from('watchlist_items').select('*');
  console.log(`User 1 sees ${query1?.length} items. (Expected: > 0)`);
  
  // 4. User 2 tries to see it
  console.log('\nUser 2 querying watchlist...');
  const { data: query2 } = await client2.from('watchlist_items').select('*');
  console.log(`User 2 sees ${query2?.length} items. (Expected: 0 if no other items exist for User 2)`);
  
  if (query2?.some(item => item.id === insertData.id)) {
    console.error('❌ FAIL: User 2 can see User 1 data!');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: User 2 cannot see User 1 data!');
  }
  
  // 5. User 2 tries to delete it
  console.log('\nUser 2 attempting to delete User 1 item...');
  const { error: deleteErr } = await client2.from('watchlist_items').delete().eq('id', insertData.id);
  // Even if no error is thrown (because 0 rows affected), we verify it's still there for user 1
  const { data: checkAfterDelete } = await client1.from('watchlist_items').select('*').eq('id', insertData.id);
  if (checkAfterDelete?.length === 0) {
    console.error('❌ FAIL: User 2 deleted User 1 data!');
    process.exit(1);
  } else {
    console.log('✅ SUCCESS: User 2 could not delete User 1 data!');
  }
  
  console.log('\nAll RLS tests passed successfully!');
  
  // Cleanup
  await admin.from('watchlist_items').delete().eq('id', insertData.id);
  await admin.from('symbols').delete().eq('ticker', testSymbol);
  await admin.auth.admin.deleteUser(user1Data.user!.id);
  await admin.auth.admin.deleteUser(user2Data.user!.id);
}

main().catch(console.error);
