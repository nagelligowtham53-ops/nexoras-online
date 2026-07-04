
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- QUESTIONS
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exams TEXT[] NOT NULL DEFAULT '{}',                  -- ['JEE Main','JEE Advanced','NEET']
  class_level SMALLINT NOT NULL CHECK (class_level IN (11, 12)),
  subject TEXT NOT NULL,                                -- Physics/Chemistry/Mathematics/Biology
  chapter TEXT NOT NULL,
  topic TEXT,
  subtopic TEXT,
  ncert_unit TEXT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy','Medium','Hard')),
  question_type TEXT NOT NULL CHECK (question_type IN (
    'single_correct','multiple_correct','integer','numerical',
    'assertion_reason','match_following','statement_based','matrix_match','paragraph'
  )),
  year INT,                                             -- PYQ year, nullable
  source TEXT,                                          -- 'JEE Main 2023', 'NCERT', 'Original', ...
  is_pyq BOOLEAN NOT NULL DEFAULT false,
  is_ncert BOOLEAN NOT NULL DEFAULT false,
  marks NUMERIC(5,2) NOT NULL DEFAULT 4,
  negative_marks NUMERIC(5,2) NOT NULL DEFAULT 1,
  time_estimate_seconds INT NOT NULL DEFAULT 120,
  question_text TEXT NOT NULL,
  options JSONB,                                        -- array of strings for MCQ; null for integer/numerical
  correct_answer JSONB NOT NULL,                        -- {"type":"single","value":0} | {"type":"multiple","values":[0,2]} | {"type":"numeric","value":3.14,"tolerance":0.01} | {"type":"text","value":"..."}
  solution TEXT,                                        -- author-provided step-by-step
  explanation TEXT,
  concepts TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  external_id TEXT UNIQUE,                              -- for CSV/JSON dedupe on import
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authed read questions" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert questions" ON public.questions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update questions" ON public.questions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete questions" ON public.questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_questions_filters ON public.questions (subject, chapter, difficulty, class_level);
CREATE INDEX idx_questions_exams ON public.questions USING GIN (exams);
CREATE INDEX idx_questions_tags ON public.questions USING GIN (tags);
CREATE INDEX idx_questions_year ON public.questions (year) WHERE year IS NOT NULL;
CREATE INDEX idx_questions_pyq ON public.questions (is_pyq);

-- BOOKMARKS
CREATE TABLE public.question_bookmarks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bookmarks TO authenticated;
GRANT ALL ON public.question_bookmarks TO service_role;
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own bookmarks" ON public.question_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SESSIONS
CREATE TABLE public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'custom',                  -- custom | chapter | subject | full_mock | revision | pyq
  config JSONB NOT NULL DEFAULT '{}'::jsonb,            -- filters used
  total_questions INT NOT NULL DEFAULT 0,
  correct_count INT NOT NULL DEFAULT 0,
  wrong_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,
  score NUMERIC(8,2) NOT NULL DEFAULT 0,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 0,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT ALL ON public.practice_sessions TO service_role;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own sessions" ON public.practice_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_sessions_user ON public.practice_sessions (user_id, created_at DESC);

-- ANSWERS
CREATE TABLE public.practice_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  question_order INT NOT NULL DEFAULT 0,
  user_answer JSONB,
  is_correct BOOLEAN,
  is_skipped BOOLEAN NOT NULL DEFAULT false,
  marked_for_review BOOLEAN NOT NULL DEFAULT false,
  time_spent_seconds INT NOT NULL DEFAULT 0,
  awarded_marks NUMERIC(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_answers TO authenticated;
GRANT ALL ON public.practice_answers TO service_role;
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own answers" ON public.practice_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_answers_session ON public.practice_answers (session_id);
CREATE INDEX idx_answers_user_q ON public.practice_answers (user_id, question_id);

-- WRONG QUESTIONS (for revision)
CREATE TABLE public.wrong_questions (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  wrong_count INT NOT NULL DEFAULT 1,
  last_wrong_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrong_questions TO authenticated;
GRANT ALL ON public.wrong_questions TO service_role;
ALTER TABLE public.wrong_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wrong questions" ON public.wrong_questions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- updated_at trigger reuse
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.practice_sessions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
