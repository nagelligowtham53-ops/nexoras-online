
CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text;
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON public.questions(subject, chapter);
CREATE INDEX IF NOT EXISTS idx_questions_subject_year ON public.questions(subject, year);
CREATE INDEX IF NOT EXISTS idx_questions_text_trgm ON public.questions USING gin (question_text gin_trgm_ops);

CREATE TABLE IF NOT EXISTS public.import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  filename text,
  source_type text NOT NULL,
  total_rows integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  updated integer NOT NULL DEFAULT 0,
  failed integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.import_history TO authenticated;
GRANT ALL ON public.import_history TO service_role;

ALTER TABLE public.import_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read import history" ON public.import_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert import history" ON public.import_history
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_import_history_created ON public.import_history(created_at DESC);
