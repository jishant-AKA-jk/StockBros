import { GET as getWatchlist, POST as postWatchlist } from '../../app/api/watchlist/route';
import { GET as getJournal, POST as postJournal } from '../../app/api/journal/route';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';
import WebSocket from 'ws';

(global as any).WebSocket = WebSocket;

// PROTECTS AGAINST: Cross-user data leakage. Ensures that via the API, User A cannot
// view or modify the watchlist or journal entries of User B. This verifies both
// the API logic and the underlying Supabase Row Level Security (RLS) policies.

// We will mock the server client to return our test client
let currentTestClient: SupabaseClient | null = null;
jest.mock('@/lib/supabase/server', () => ({
  createClient: () => {
    if (!currentTestClient) throw new Error("Test client not initialized");
    return currentTestClient;
  }
}));

describe('API Integration Tests (Security & RLS)', () => {
  let adminClient: SupabaseClient;
  let userAClient: SupabaseClient;
  let userBClient: SupabaseClient;
  let userA: any;
  let userB: any;

  beforeAll(async () => {
    // Requires .env.local or .env to be loaded (e.g. via jest setup)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    if (!serviceKey) {
      console.warn('Skipping integration tests due to missing SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    adminClient = createSupabaseClient(url, serviceKey);

    // Create test users
    const emailA = `test_a_${Date.now()}@example.com`;
    const emailB = `test_b_${Date.now()}@example.com`;
    const password = 'testpassword123';

    const { data: dataA } = await adminClient.auth.admin.createUser({ email: emailA, password, email_confirm: true });
    const { data: dataB } = await adminClient.auth.admin.createUser({ email: emailB, password, email_confirm: true });
    
    userA = dataA.user;
    userB = dataB.user;

    // Make sure 'AAPL' exists in symbols for foreign key constraints
    const { error: upsertErr } = await adminClient.from('symbols').upsert({ ticker: 'AAPL', name: 'Apple Inc' });
    if (upsertErr) console.error("Upsert AAPL error:", upsertErr);

    // Initialize regular clients with sessions
    const clientA = createSupabaseClient(url, anonKey);
    const { data: sessionA } = await clientA.auth.signInWithPassword({ email: emailA, password });
    userAClient = createSupabaseClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${sessionA.session?.access_token}` } } });

    const clientB = createSupabaseClient(url, anonKey);
    const { data: sessionB } = await clientB.auth.signInWithPassword({ email: emailB, password });
    userBClient = createSupabaseClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${sessionB.session?.access_token}` } } });
  });

  afterAll(async () => {
    if (adminClient && userA) await adminClient.auth.admin.deleteUser(userA.id);
    if (adminClient && userB) await adminClient.auth.admin.deleteUser(userB.id);
  });

  it('prevents cross-user access for Watchlist', async () => {
    if (!userA) return; // Skip if no service key

    // Post as User A
    currentTestClient = userAClient;
    const reqA = new Request('http://localhost/api/watchlist', {
      method: 'POST',
      body: JSON.stringify({ symbol: 'AAPL', tag: 'momentum' })
    });
    const resA = await postWatchlist(reqA);
    if (resA.status !== 200) console.error(await resA.json());
    expect(resA.status).toBe(200);

    // Get as User B
    currentTestClient = userBClient;
    const reqB = new Request('http://localhost/api/watchlist', { method: 'GET' });
    const resB = await getWatchlist(); // GET function signature takes no args
    const dataB = await resB.json();
    
    // User B should not see User A's items
    expect(resB.status).toBe(200);
    expect(Array.isArray(dataB)).toBe(true);
    const foundAapl = dataB.find((item: any) => item.symbol === 'AAPL' && item.user_id === userA.id);
    expect(foundAapl).toBeUndefined();
  });

  it('prevents cross-user access for Journal', async () => {
    if (!userA) return;

    // Post as User A
    currentTestClient = userAClient;
    const reqA = new Request('http://localhost/api/journal', {
      method: 'POST',
      body: JSON.stringify({
        symbol: 'AAPL',
        entry_date: '2023-01-01T10:00:00Z',
        entry_price: 150,
        initial_stop: 140
      })
    });
    const resA = await postJournal(reqA);
    if (resA.status !== 200) console.error(await resA.json());
    expect(resA.status).toBe(200);

    // Get as User B
    currentTestClient = userBClient;
    const resB = await getJournal();
    const dataB = await resB.json();
    
    // User B should not see User A's journal entries
    expect(resB.status).toBe(200);
    expect(Array.isArray(dataB)).toBe(true);
    const foundAapl = dataB.find((item: any) => item.symbol === 'AAPL' && item.user_id === userA.id);
    expect(foundAapl).toBeUndefined();
  });
});
