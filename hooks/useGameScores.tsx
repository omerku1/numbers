import { useState, useEffect } from 'react';
import { supabase, GameScore } from '@/lib/supabase';
import { useAuth } from './useAuth';

export function useGameScores() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const saveGameScore = async (scoreData: {
    score: number;
    level_reached: number;
    best_combo: number;
    game_mode: 'arithmetic' | 'wordProblem';
    time_limit: number;
    total_questions: number;
    correct_answers: number;
    game_duration: number;
  }) => {
    if (!user) return { error: { message: 'Not authenticated' } };

    setLoading(true);
    try {
      const { error } = await supabase
        .from('game_scores')
        .insert({
          user_id: user.id,
          ...scoreData,
        });

      return { error };
    } catch (error) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const getLeaderboard = async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          username,
          display_name,
          best_score,
          best_level,
          best_combo,
          total_games_played,
          accuracy_percentage
        `)
        .order('best_score', { ascending: false })
        .limit(limit);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const getUserScores = async (userId?: string) => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return { data: null, error: { message: 'No user ID provided' } };

    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  return {
    saveGameScore,
    getLeaderboard,
    getUserScores,
    loading,
  };
}