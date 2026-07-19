'use server';

import { createClient } from '@/lib/supabase/server';
import { PaginatedResponse, JournalEntry, PriceBar } from '@/lib/types';

export async function getChartBars(symbol: string): Promise<PriceBar[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const toDateStr = new Date().toISOString().split('T')[0];
  const fromDate = new Date();
  fromDate.setFullYear(fromDate.getFullYear() - 1);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cached_candles')
    .select('date, open, high, low, close, volume')
    .eq('symbol', symbol)
    .gte('date', fromDateStr)
    .lte('date', toDateStr)
    .order('date', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(r => ({
    date: r.date,
    open: Number(r.open),
    high: Number(r.high),
    low: Number(r.low),
    close: Number(r.close),
    volume: Number(r.volume),
  }));
}

export async function getJournalEntries(offset: number = 0, limit: number = 5): Promise<PaginatedResponse<JournalEntry>> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const { data, count, error } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error('Failed to fetch entries');

  const total = count || 0;

  const items = (data || []).map(item => ({
    userId: item.user_id,
    symbol: item.symbol,
    setupTag: item.setup_tag,
    entryDate: item.entry_date,
    entryPrice: Number(item.entry_price),
    exitDate: item.exit_date,
    exitPrice: item.exit_price ? Number(item.exit_price) : undefined,
    notes: item.notes,
    rMultiple: item.r_multiple ? Number(item.r_multiple) : undefined,
  }));

  return { items, total, hasMore: offset + limit < total, offset, limit };
}

export async function createJournalEntry(data: Partial<JournalEntry>): Promise<JournalEntry> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: newEntry, error } = await supabase
    .from('journal_entries')
    .insert({
      user_id: user.id,
      symbol: data.symbol,
      setup_tag: data.setupTag,
      entry_date: data.entryDate,
      entry_price: data.entryPrice,
      exit_date: data.exitDate,
      exit_price: data.exitPrice,
      notes: data.notes,
      r_multiple: data.rMultiple,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    userId: newEntry.user_id,
    symbol: newEntry.symbol,
    setupTag: newEntry.setup_tag,
    entryDate: newEntry.entry_date,
    entryPrice: Number(newEntry.entry_price),
    exitDate: newEntry.exit_date,
    exitPrice: newEntry.exit_price ? Number(newEntry.exit_price) : undefined,
    notes: newEntry.notes,
    rMultiple: newEntry.r_multiple ? Number(newEntry.r_multiple) : undefined,
  };
}

export async function updateJournalEntry(id: string, data: Partial<JournalEntry>): Promise<JournalEntry> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const updateData: any = {};
  if (data.symbol !== undefined) updateData.symbol = data.symbol;
  if (data.setupTag !== undefined) updateData.setup_tag = data.setupTag;
  if (data.entryDate !== undefined) updateData.entry_date = data.entryDate;
  if (data.entryPrice !== undefined) updateData.entry_price = data.entryPrice;
  if (data.exitDate !== undefined) updateData.exit_date = data.exitDate;
  if (data.exitPrice !== undefined) updateData.exit_price = data.exitPrice;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.rMultiple !== undefined) updateData.r_multiple = data.rMultiple;

  const { data: updatedEntry, error } = await supabase
    .from('journal_entries')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return {
    userId: updatedEntry.user_id,
    symbol: updatedEntry.symbol,
    setupTag: updatedEntry.setup_tag,
    entryDate: updatedEntry.entry_date,
    entryPrice: Number(updatedEntry.entry_price),
    exitDate: updatedEntry.exit_date,
    exitPrice: updatedEntry.exit_price ? Number(updatedEntry.exit_price) : undefined,
    notes: updatedEntry.notes,
    rMultiple: updatedEntry.r_multiple ? Number(updatedEntry.r_multiple) : undefined,
  };
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
}
