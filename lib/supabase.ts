import { createClient } from '@supabase/supabase-js';

// Публічні (anon) ключі Supabase — безпечно тримати в клієнті, доступ обмежено RLS.
const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3dHlieXJ0ZHZoaWJkdGR2cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NzI5ODcsImV4cCI6MjA5MTA0ODk4N30.VjWnmvh8tw1GSIBJYWbJ8o5dYBkCj5pOUj2zoTPHmyg';

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
