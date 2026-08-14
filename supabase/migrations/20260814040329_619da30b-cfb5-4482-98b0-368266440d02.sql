-- 1. ROOT CAUSE FIX: questions_public filters on verified/active but those
-- columns were never granted to app roles, so every read failed with
-- "permission denied for table questions".
GRANT SELECT (verified, active, review_status, exam_version, question_hash) ON public.questions TO anon, authenticated;

-- 2. Exam configuration system (no hard-coded exam patterns in app code).
CREATE TABLE public.exam_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_key text NOT NULL,
  exam_name text NOT NULL,
  exam_year integer NOT NULL DEFAULT 2026,
  paper_name text NOT NULL DEFAULT 'Paper 1',
  db_exam text,
  total_questions integer NOT NULL,
  duration_minutes integer NOT NULL,
  marks_per_correct numeric NOT NULL DEFAULT 4,
  negative_marks numeric NOT NULL DEFAULT 1,
  question_types text[] NOT NULL DEFAULT '{single_correct}'::text[],
  subject_distribution jsonb NOT NULL DEFAULT '[]'::jsonb,
  pattern_note text NOT NULL DEFAULT '',
  difficulty_profile text NOT NULL DEFAULT 'mixed',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (exam_key, paper_name, exam_year)
);

GRANT SELECT ON public.exam_configs TO anon, authenticated;
GRANT ALL ON public.exam_configs TO service_role;

ALTER TABLE public.exam_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam configs are public" ON public.exam_configs
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage exam configs" ON public.exam_configs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE TRIGGER exam_configs_touch BEFORE UPDATE ON public.exam_configs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 3. Seed official patterns. JEE Main and JEE Advanced are fully separate.
INSERT INTO public.exam_configs
  (exam_key, exam_name, exam_year, paper_name, db_exam, total_questions, duration_minutes,
   marks_per_correct, negative_marks, question_types, subject_distribution, pattern_note, difficulty_profile)
VALUES
  ('jee-main', 'JEE Main', 2026, 'Paper 1 (B.E./B.Tech)', 'JEE Main', 75, 180, 4, 1,
   '{single_correct,integer,numerical}',
   '[{"name":"Physics","count":25},{"name":"Chemistry","count":25},{"name":"Mathematics","count":25}]',
   'NTA CBT · 20 MCQ + 5 numerical per subject · +4 / -1', 'mixed'),

  ('jee-adv', 'JEE Advanced', 2026, 'Paper 1', 'JEE Advanced', 51, 180, 4, 2,
   '{single_correct,multiple_correct,numerical,match_following}',
   '[{"name":"Physics","count":17},{"name":"Chemistry","count":17},{"name":"Mathematics","count":17}]',
   'Paper 1 · multiple-correct + numerical + match · partial marking', 'hard'),

  ('jee-adv', 'JEE Advanced', 2026, 'Paper 2', 'JEE Advanced', 51, 180, 4, 2,
   '{single_correct,multiple_correct,numerical,paragraph}',
   '[{"name":"Physics","count":17},{"name":"Chemistry","count":17},{"name":"Mathematics","count":17}]',
   'Paper 2 · paragraph-based + numerical · partial marking', 'hard'),

  ('neet', 'NEET UG', 2026, 'Paper 1', 'NEET', 180, 180, 4, 1, '{single_correct}',
   '[{"name":"Botany","count":45},{"name":"Zoology","count":45},{"name":"Physics","count":45},{"name":"Chemistry","count":45}]',
   'NTA CBT · NCERT-heavy · +4 / -1', 'mixed'),

  ('bitsat', 'BITSAT', 2026, 'Paper 1', 'BITSAT', 130, 180, 3, 1, '{single_correct}',
   '[{"name":"Physics","count":30},{"name":"Chemistry","count":30},{"name":"Mathematics","count":40},{"name":"English & Logical Reasoning","count":30}]',
   'Speed-focused MCQ · +3 / -1', 'medium'),

  ('mht-cet', 'MHT CET', 2026, 'PCM', 'MHT CET', 150, 180, 1, 0, '{single_correct}',
   '[{"name":"Physics","count":50},{"name":"Chemistry","count":50},{"name":"Mathematics","count":50}]',
   'No negative marking', 'medium'),

  ('comedk', 'COMEDK UGET', 2026, 'Paper 1', 'COMEDK UGET', 180, 180, 1, 0, '{single_correct}',
   '[{"name":"Physics","count":60},{"name":"Chemistry","count":60},{"name":"Mathematics","count":60}]',
   'Karnataka CBT · MCQ only · no negative marking', 'medium'),

  ('eamcet', 'EAMCET (AP/TS)', 2026, 'Engineering', 'EAMCET (AP/TS)', 160, 180, 1, 0, '{single_correct}',
   '[{"name":"Mathematics","count":80},{"name":"Physics","count":40},{"name":"Chemistry","count":40}]',
   'Maths-heavy CBT · no negative marking', 'medium');