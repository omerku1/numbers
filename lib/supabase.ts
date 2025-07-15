import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  total_games_played: number;
  total_time_played: number;
  best_score: number;
  best_level: number;
  best_combo: number;
  accuracy_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface GameScore {
  id?: number;
  user_id: string;
  score: number;
  level_reached: number;
  best_combo: number;
  game_mode: 'arithmetic' | 'wordProblem';
  time_limit: number;
  total_questions: number;
  correct_answers: number;
  game_duration: number;
  created_at: string;
  user_profiles?: UserProfile;
}