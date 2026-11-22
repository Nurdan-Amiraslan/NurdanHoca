-- GAMIFY | Nurdan Teacher — PostgreSQL Relational Schema Blueprint
-- Supports all 22 core domain tables for Abituriyent (DİM) & Aptis ESOL pathways

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_modes (
  code TEXT PRIMARY KEY CHECK (code IN ('abituriyent', 'aptis')),
  name_az TEXT NOT NULL,
  description_az TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cefr_levels (
  code TEXT PRIMARY KEY CHECK (code IN ('A1', 'A2', 'B1', 'B2', 'C1')),
  title_az TEXT NOT NULL,
  order_index INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  full_name TEXT,
  active_mode TEXT NOT NULL REFERENCES learning_modes(code) DEFAULT 'abituriyent',
  current_cefr TEXT NOT NULL REFERENCES cefr_levels(code) DEFAULT 'A1',
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  coins INTEGER NOT NULL DEFAULT 50,
  streak_days INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  daily_goal_target INTEGER NOT NULL DEFAULT 20,
  subscription_plan TEXT NOT NULL DEFAULT 'FREE',
  equipped_outfit TEXT NOT NULL DEFAULT 'classic_blazer',
  equipped_accessory TEXT NOT NULL DEFAULT 'none',
  equipped_theme TEXT NOT NULL DEFAULT 'indigo_academy'
);

CREATE TABLE IF NOT EXISTS grammar_categories (
  id TEXT PRIMARY KEY,
  name_az TEXT NOT NULL,
  name_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS grammar_topics (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  cefr_level TEXT NOT NULL REFERENCES cefr_levels(code),
  category_id TEXT REFERENCES grammar_categories(id),
  unit_number INTEGER NOT NULL,
  unit_title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  title_az TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  explanation_az TEXT NOT NULL,
  examples_json JSONB NOT NULL,
  common_mistakes_az JSONB NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 50
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,
  cefr_level TEXT NOT NULL REFERENCES cefr_levels(code),
  mode TEXT NOT NULL CHECK (mode IN ('abituriyent', 'aptis', 'both')),
  game_type TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  prompt_az TEXT NOT NULL,
  question_text TEXT NOT NULL,
  payload_json JSONB,
  correct_answer TEXT NOT NULL,
  explanation_az TEXT NOT NULL,
  common_trap_az TEXT,
  xp_value INTEGER NOT NULL DEFAULT 15,
  coin_value INTEGER NOT NULL DEFAULT 5,
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answer_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  submitted_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT NOT NULL REFERENCES grammar_topics(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  stars INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 1,
  next_review_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_practiced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, topic_id, mode)
);

CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  title_az TEXT NOT NULL,
  description_az TEXT NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 50,
  coin_bonus INTEGER NOT NULL DEFAULT 25
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id TEXT PRIMARY KEY,
  challenge_date DATE NOT NULL,
  title_az TEXT NOT NULL,
  description_az TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  coin_reward INTEGER NOT NULL DEFAULT 30,
  question_ids JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('daily', 'boss')),
  score_percent INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leaderboard_records (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  daily_xp INTEGER NOT NULL DEFAULT 0,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  monthly_xp INTEGER NOT NULL DEFAULT 0,
  overall_xp INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS motivational_quotes (
  id TEXT PRIMARY KEY,
  text_en TEXT NOT NULL,
  author TEXT NOT NULL,
  encouragement_az TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  topic_id TEXT,
  action_type TEXT NOT NULL,
  prompt_summary TEXT NOT NULL,
  response_preview TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  code TEXT PRIMARY KEY CHECK (code IN ('FREE', 'PREMIUM', 'PRO')),
  name_az TEXT NOT NULL,
  monthly_price_azn NUMERIC(10, 2) NOT NULL,
  yearly_price_azn NUMERIC(10, 2) NOT NULL,
  limits_json JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL REFERENCES subscriptions(code),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
  amount_azn NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_roles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  permissions_json JSONB NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
