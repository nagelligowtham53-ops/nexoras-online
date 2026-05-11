
-- user_stats: one row per user
CREATE TABLE public.user_stats (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  tests_taken INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own stats select" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own stats insert" ON public.user_stats FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own stats update" ON public.user_stats FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER user_stats_touch BEFORE UPDATE ON public.user_stats FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- test_attempts
CREATE TABLE public.test_attempts (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_key TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  total_questions INTEGER NOT NULL,
  attempted INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  subject_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts select" ON public.test_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own attempts insert" ON public.test_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX test_attempts_user_idx ON public.test_attempts(user_id, created_at DESC);

-- achievements
CREATE TABLE public.achievements (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_key)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ach select" ON public.achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own ach insert" ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX achievements_user_idx ON public.achievements(user_id, earned_at DESC);
