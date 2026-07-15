import { createClient } from '@supabase/supabase-js';

// Публічні (anon) ключі Supabase — безпечно тримати в клієнті, доступ обмежено RLS.
const SUPABASE_URL = 'https://fjrkvxzuwihogmwfpnnt.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqcmt2eHp1d2lob2dtd2Zwbm50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1NjQwNDQsImV4cCI6MjA5ODE0MDA0NH0.TK3qk9J3b7MhqZYOYcpQADwR7Ps6wvD4WWnW8mAdr6g';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export interface RoundRow {
  id: number;
  status: 'betting' | 'settled';
  started_at: string;
  ends_at: string;
  win_move: 'rock' | 'scissors' | 'paper' | null;
  result: Record<string, unknown> | null;
}

export interface BetRow {
  id: number;
  round_id: number;
  player_id: string;
  nickname: string;
  move: 'rock' | 'scissors' | 'paper';
  stake: number;
  payout: number;
  is_bluff: boolean;
}
