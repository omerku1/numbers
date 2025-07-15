/*
  # User Profiles and Game Scores Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `display_name` (text)
      - `avatar_url` (text, optional)
      - `total_games_played` (integer, default 0)
      - `total_time_played` (integer, default 0) 
      - `best_score` (integer, default 0)
      - `best_level` (integer, default 1)
      - `best_combo` (integer, default 0)
      - `accuracy_percentage` (numeric, default 0.00)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `game_scores`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references user_profiles)
      - `score` (integer)
      - `level_reached` (integer)
      - `best_combo` (integer)
      - `game_mode` (text, 'timeLimit' or 'wordProblem')
      - `time_limit` (integer)
      - `total_questions` (integer)
      - `correct_answers` (integer)
      - `game_duration` (integer, in seconds)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
    - Users can read all profiles for leaderboard
    - Users can only insert/update their own data

  3. Functions
    - Trigger to update user stats when new score is inserted
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  avatar_url text,
  total_games_played integer DEFAULT 0,
  total_time_played integer DEFAULT 0,
  best_score integer DEFAULT 0,
  best_level integer DEFAULT 1,
  best_combo integer DEFAULT 0,
  accuracy_percentage numeric(5,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_scores table
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  level_reached integer NOT NULL DEFAULT 1,
  best_combo integer NOT NULL DEFAULT 0,
  game_mode text NOT NULL CHECK (game_mode IN ('timeLimit', 'wordProblem')),
  time_limit integer NOT NULL,
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  game_duration integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Policies for game_scores
CREATE POLICY "Users can view all scores for leaderboard" ON game_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own scores" ON game_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_best_score ON user_profiles(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_created_at ON game_scores(created_at DESC);

-- Function to update user stats when a new score is inserted
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles SET
    total_games_played = total_games_played + 1,
    total_time_played = total_time_played + NEW.game_duration,
    best_score = GREATEST(best_score, NEW.score),
    best_level = GREATEST(best_level, NEW.level_reached),
    best_combo = GREATEST(best_combo, NEW.best_combo),
    accuracy_percentage = (
      SELECT ROUND(
        (SUM(correct_answers)::numeric / NULLIF(SUM(total_questions), 0)) * 100, 2
      )
      FROM game_scores 
      WHERE user_id = NEW.user_id
    ),
    updated_at = now()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update user stats
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT ON game_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();