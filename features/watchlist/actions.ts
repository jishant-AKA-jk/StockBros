'use server';

import { createClient } from '@/lib/supabase/server';
import { PaginatedResponse, WatchlistItem } from '@/lib/types';

export async function getWatchlist(offset: number = 0, limit: number = 5): Promise<PaginatedResponse<WatchlistItem>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data, count, error } = await supabase
    .from('watchlist_items')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new Error('Failed to fetch watchlist items');
  }

  const items = (data || []).map(item => ({
    userId: item.user_id,
    symbol: item.symbol,
    tag: item.tag,
    notes: item.notes,
    createdAt: item.created_at,
  }));

  const total = count || 0;

  return {
    items,
    total,
    hasMore: offset + limit < total,
    offset,
    limit,
  };
}

export async function addToWatchlist(symbol: string, name: string): Promise<WatchlistItem> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data, error } = await supabase
    .from('watchlist_items')
    .insert({
      user_id: user.id,
      symbol,
      notes: name, // storing name in notes temporarily, or you can add a 'name' column
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to add to watchlist');
  }

  return {
    userId: data.user_id,
    symbol: data.symbol,
    tag: data.tag,
    notes: data.notes,
    createdAt: data.created_at,
  };
}

export async function removeFromWatchlist(symbol: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('watchlist_items')
    .delete()
    .eq('user_id', user.id)
    .eq('symbol', symbol);

  if (error) {
    throw new Error('Failed to remove from watchlist');
  }
}

export async function isInWatchlist(symbol: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { count, error } = await supabase
    .from('watchlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('symbol', symbol);

  if (error) {
    return false;
  }

  return (count || 0) > 0;
}
