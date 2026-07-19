'use server';

import { createClient } from '@/lib/supabase/server';
import { StockNote } from '@/lib/types';

export async function getStockNotes(symbol: string): Promise<StockNote[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('stock_notes')
    .select('*')
    .eq('user_id', user.id)
    .eq('symbol', symbol)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch stock notes');

  return (data || []).map(note => ({
    id: note.id,
    user_id: note.user_id,
    symbol: note.symbol,
    content: note.content,
    chart_date: note.chart_date,
    chart_price: note.chart_price ? Number(note.chart_price) : undefined,
    created_at: note.created_at,
    updated_at: note.updated_at,
  }));
}

export async function createStockNote(symbol: string, content: string, chartDate?: string, chartPrice?: number): Promise<StockNote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: newNote, error } = await supabase
    .from('stock_notes')
    .insert({
      user_id: user.id,
      symbol,
      content,
      chart_date: chartDate,
      chart_price: chartPrice,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create stock note');

  return {
    id: newNote.id,
    user_id: newNote.user_id,
    symbol: newNote.symbol,
    content: newNote.content,
    chart_date: newNote.chart_date,
    chart_price: newNote.chart_price ? Number(newNote.chart_price) : undefined,
    created_at: newNote.created_at,
    updated_at: newNote.updated_at,
  };
}

export async function updateStockNote(id: string, content: string): Promise<StockNote> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: updatedNote, error } = await supabase
    .from('stock_notes')
    .update({ content, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw new Error('Failed to update stock note');

  return {
    id: updatedNote.id,
    user_id: updatedNote.user_id,
    symbol: updatedNote.symbol,
    content: updatedNote.content,
    chart_date: updatedNote.chart_date,
    chart_price: updatedNote.chart_price ? Number(updatedNote.chart_price) : undefined,
    created_at: updatedNote.created_at,
    updated_at: updatedNote.updated_at,
  };
}

export async function deleteStockNote(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { error } = await supabase
    .from('stock_notes')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error('Failed to delete stock note');
}

export async function getAllUserNotes(): Promise<StockNote[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('stock_notes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error('Failed to fetch all notes');

  return (data || []).map(note => ({
    id: note.id,
    user_id: note.user_id,
    symbol: note.symbol,
    content: note.content,
    chart_date: note.chart_date,
    chart_price: note.chart_price ? Number(note.chart_price) : undefined,
    created_at: note.created_at,
    updated_at: note.updated_at,
  }));
}
