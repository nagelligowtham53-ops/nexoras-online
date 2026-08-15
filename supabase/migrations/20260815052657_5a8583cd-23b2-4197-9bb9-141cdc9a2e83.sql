-- ============================================================
-- 1. SYLLABUS HIERARCHY
-- ============================================================
ALTER TABLE public.syllabus_chapters
  ADD COLUMN IF NOT EXISTS unit text,
  ADD COLUMN IF NOT EXISTS in_bitsat boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_eamcet boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS in_comedk boolean NOT NULL DEFAULT false;

UPDATE public.syllabus_chapters
SET in_bitsat = in_jee_main,
    in_eamcet = in_jee_main,
    in_comedk = in_jee_main
WHERE in_jee_main;

UPDATE public.syllabus_chapters SET unit = subject || ' · Class ' || class_level::text
WHERE unit IS NULL;

CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id text PRIMARY KEY,
  chapter_id text NOT NULL REFERENCES public.syllabus_chapters(id) ON DELETE CASCADE,
  name text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.syllabus_topics TO anon, authenticated;
GRANT ALL ON public.syllabus_topics TO service_role;
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Syllabus topics are readable by everyone" ON public.syllabus_topics;
CREATE POLICY "Syllabus topics are readable by everyone"
  ON public.syllabus_topics FOR SELECT USING (true);

DROP TRIGGER IF EXISTS syllabus_topics_touch ON public.syllabus_topics;
CREATE TRIGGER syllabus_topics_touch BEFORE UPDATE ON public.syllabus_topics
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- 2. QUESTION METADATA: category + topic link
-- ============================================================
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'conceptual',
  ADD COLUMN IF NOT EXISTS topic_id text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_category_check') THEN
    ALTER TABLE public.questions ADD CONSTRAINT questions_category_check
      CHECK (category IN ('conceptual','numerical','ncert','application','multi_concept','critical_thinking','graph','assertion_reason','formula'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'questions_topic_id_fkey') THEN
    ALTER TABLE public.questions ADD CONSTRAINT questions_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES public.syllabus_topics(id) ON DELETE SET NULL;
  END IF;
END $$;

-- seed topics from real topics present on mapped questions
INSERT INTO public.syllabus_topics (id, chapter_id, name, order_index)
SELECT DISTINCT ON (q.chapter_id, lower(btrim(q.topic)))
       q.chapter_id || ':' || regexp_replace(lower(btrim(q.topic)), '[^a-z0-9]+', '-', 'g'),
       q.chapter_id,
       btrim(q.topic),
       0
FROM public.questions q
WHERE q.chapter_id IS NOT NULL
  AND q.topic IS NOT NULL AND btrim(q.topic) <> ''
ON CONFLICT (id) DO NOTHING;

UPDATE public.questions q
SET topic_id = t.id
FROM public.syllabus_topics t
WHERE q.chapter_id = t.chapter_id
  AND q.topic IS NOT NULL
  AND lower(btrim(q.topic)) = lower(t.name)
  AND q.topic_id IS DISTINCT FROM t.id;

-- classify existing questions
UPDATE public.questions
SET category = CASE
  WHEN question_type IN ('integer','numerical') THEN 'numerical'
  WHEN question_type = 'assertion_reason' THEN 'assertion_reason'
  WHEN question_text ~* '(graph|plot of|curve shown|figure shows)' THEN 'graph'
  WHEN question_text ~* '(calculate|compute|find the value|find the magnitude|determine the|how many mole|evaluate|what is the value of|equals?\s*\?)' THEN 'numerical'
  WHEN source_type = 'ncert_based' THEN 'ncert'
  WHEN difficulty IN ('Hard','Advanced') THEN 'critical_thinking'
  WHEN question_text ~* '(a car|a block|a particle|a ball|a solution|is heated|is released|moving with)' THEN 'application'
  ELSE 'conceptual'
END;

CREATE INDEX IF NOT EXISTS questions_practice_idx
  ON public.questions (chapter_id, category, difficulty) WHERE verified AND active;
CREATE INDEX IF NOT EXISTS questions_topic_idx ON public.questions (topic_id);

-- ============================================================
-- 3. QUALITY GATE
-- ============================================================
CREATE OR REPLACE FUNCTION public.question_reject_reason(
  p_text text, p_options jsonb, p_answer jsonb, p_type text
) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE opt_count int; distinct_count int;
BEGIN
  IF p_text IS NULL OR length(btrim(p_text)) < 20 THEN RETURN 'too_short'; END IF;
  IF p_text ~* '(what is (cbt|jee|neet|nta|icpc|the exam)|which learning objective|purpose of this chapter|describes this exam|full form of|who conducts|exam pattern|how many attempts|eligibility criteria|revising this chapter|what does .* stand for)'
    THEN RETURN 'generic_exam_trivia'; END IF;
  IF p_answer IS NULL OR p_answer = 'null'::jsonb THEN RETURN 'missing_answer'; END IF;
  IF p_type IN ('single_correct','multiple_correct','assertion_reason','statement_based') THEN
    IF p_options IS NULL OR jsonb_typeof(p_options) <> 'array' THEN RETURN 'missing_options'; END IF;
    SELECT count(*), count(DISTINCT lower(btrim(v))) INTO opt_count, distinct_count
    FROM jsonb_array_elements_text(p_options) v;
    IF opt_count < 4 THEN RETURN 'too_few_options'; END IF;
    IF distinct_count <> opt_count THEN RETURN 'duplicate_options'; END IF;
    IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(p_options) v WHERE btrim(v) = '') THEN RETURN 'empty_option'; END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_question_quality()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE reason text;
BEGIN
  reason := public.question_reject_reason(NEW.question_text, NEW.options, NEW.correct_answer, NEW.question_type);
  IF reason IS NOT NULL THEN
    NEW.verified := false;
    NEW.active := false;
    NEW.review_status := 'rejected:' || reason;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS questions_enforce_quality ON public.questions;
CREATE TRIGGER questions_enforce_quality BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_question_quality();

-- hide every existing question that fails the gate (kept, not deleted)
UPDATE public.questions
SET verified = false, active = false,
    review_status = 'rejected:' || public.question_reject_reason(question_text, options, correct_answer, question_type)
WHERE public.question_reject_reason(question_text, options, correct_answer, question_type) IS NOT NULL
  AND (verified OR active);

-- ============================================================
-- 4. SHARED PCM POOL FOR BITSAT / EAMCET / COMEDK
-- ============================================================
UPDATE public.questions q
SET exams = (
  SELECT array_agg(DISTINCT e) FROM unnest(q.exams || ARRAY['BITSAT','EAMCET (AP/TS)','COMEDK UGET']) e
)
WHERE q.verified AND q.active
  AND q.subject IN ('Physics','Chemistry','Mathematics')
  AND q.chapter_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.syllabus_chapters c WHERE c.id = q.chapter_id AND c.in_jee_main);

INSERT INTO public.exam_configs
  (exam_key, exam_name, exam_year, paper_name, db_exam, total_questions, duration_minutes,
   marks_per_correct, negative_marks, question_types, subject_distribution, pattern_note, difficulty_profile, active)
SELECT * FROM (VALUES
  ('bitsat', 'BITSAT', 2026, 'Part I-IV', 'BITSAT', 130, 180, 3::numeric, 1::numeric,
   ARRAY['single_correct'],
   '[{"name":"Physics","count":30},{"name":"Chemistry","count":30},{"name":"Mathematics","count":40},{"name":"English & Logical Reasoning","count":30}]'::jsonb,
   'Speed-focused single-correct paper. No partial marking; accuracy under time pressure matters most.', 'speed', true),
  ('eamcet-engineering', 'EAMCET / EAPCET (Engineering)', 2026, 'Engineering', 'EAMCET (AP/TS)', 160, 180, 1::numeric, 0::numeric,
   ARRAY['single_correct'],
   '[{"name":"Mathematics","count":80},{"name":"Physics","count":40},{"name":"Chemistry","count":40}]'::jsonb,
   'No negative marking. Mathematics carries half the paper; intermediate-syllabus oriented.', 'intermediate', true),
  ('comedk-uget', 'COMEDK UGET', 2026, 'PCM', 'COMEDK UGET', 180, 180, 1::numeric, 0::numeric,
   ARRAY['single_correct'],
   '[{"name":"Physics","count":60},{"name":"Chemistry","count":60},{"name":"Mathematics","count":60}]'::jsonb,
   'Equal PCM weighting, no negative marking, one mark per correct answer.', 'moderate', true)
) AS v(exam_key, exam_name, exam_year, paper_name, db_exam, total_questions, duration_minutes,
       marks_per_correct, negative_marks, question_types, subject_distribution, pattern_note, difficulty_profile, active)
WHERE NOT EXISTS (SELECT 1 FROM public.exam_configs e WHERE e.exam_key = v.exam_key);

-- ============================================================
-- 5. SANITIZED VIEW (adds category + topic_id)
-- ============================================================
DROP FUNCTION IF EXISTS public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer, uuid[]);
DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public WITH (security_invoker = true) AS
SELECT id, exams, class_level, subject, chapter, chapter_id, topic, topic_id, subtopic,
       ncert_unit, category, difficulty, question_type, year, source, source_type,
       exam_session, paper, language, source_reference, license_status, is_pyq, is_ncert,
       marks, negative_marks, time_estimate_seconds, question_text, options, concepts, tags,
       external_id, image_url, review_status, verified, active, exam_version, created_at, updated_at
FROM public.questions
WHERE verified AND active;

GRANT SELECT ON public.questions_public TO anon, authenticated, service_role;

-- ============================================================
-- 6. ENGINE RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION public.exam_chapter_matches(p_exam text, c public.syllabus_chapters)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE p_exam
    WHEN 'JEE Main' THEN c.in_jee_main
    WHEN 'JEE Advanced' THEN c.in_jee_advanced
    WHEN 'NEET' THEN c.in_neet
    WHEN 'BITSAT' THEN c.in_bitsat
    WHEN 'EAMCET (AP/TS)' THEN c.in_eamcet
    WHEN 'COMEDK UGET' THEN c.in_comedk
    ELSE false END;
$$;

CREATE OR REPLACE FUNCTION public.exam_syllabus_tree(p_exam text, p_classes smallint[] DEFAULT NULL)
RETURNS TABLE(
  chapter_id text, subject text, class_level smallint, unit text, chapter_name text,
  total bigint, easy bigint, medium bigint, hard bigint,
  numerical bigint, conceptual bigint, ncert bigint, application bigint,
  critical_thinking bigint, graph bigint, assertion bigint, pyq bigint
) LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT c.id, c.subject, c.class_level, c.unit, c.name,
         count(q.id),
         count(q.id) FILTER (WHERE q.difficulty = 'Easy'),
         count(q.id) FILTER (WHERE q.difficulty = 'Medium'),
         count(q.id) FILTER (WHERE q.difficulty IN ('Hard','Advanced')),
         count(q.id) FILTER (WHERE q.category = 'numerical'),
         count(q.id) FILTER (WHERE q.category = 'conceptual'),
         count(q.id) FILTER (WHERE q.category = 'ncert'),
         count(q.id) FILTER (WHERE q.category = 'application'),
         count(q.id) FILTER (WHERE q.category = 'critical_thinking'),
         count(q.id) FILTER (WHERE q.category = 'graph'),
         count(q.id) FILTER (WHERE q.category = 'assertion_reason'),
         count(q.id) FILTER (WHERE q.source_type IN ('previous_year','official_exam'))
  FROM public.syllabus_chapters c
  LEFT JOIN public.questions q
    ON q.chapter_id = c.id AND p_exam = ANY(q.exams) AND q.verified AND q.active
  WHERE public.exam_chapter_matches(p_exam, c.*)
    AND (p_classes IS NULL OR c.class_level = ANY(p_classes))
  GROUP BY c.id, c.subject, c.class_level, c.unit, c.name, c.order_index
  ORDER BY c.subject, c.class_level, c.order_index;
$$;

CREATE OR REPLACE FUNCTION public.chapter_topic_counts(p_exam text, p_chapter_ids text[])
RETURNS TABLE(topic_id text, chapter_id text, topic_name text, total bigint,
              numerical bigint, conceptual bigint, easy bigint, medium bigint, hard bigint)
LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT t.id, t.chapter_id, t.name,
         count(q.id),
         count(q.id) FILTER (WHERE q.category = 'numerical'),
         count(q.id) FILTER (WHERE q.category = 'conceptual'),
         count(q.id) FILTER (WHERE q.difficulty = 'Easy'),
         count(q.id) FILTER (WHERE q.difficulty = 'Medium'),
         count(q.id) FILTER (WHERE q.difficulty IN ('Hard','Advanced'))
  FROM public.syllabus_topics t
  LEFT JOIN public.questions q
    ON q.topic_id = t.id AND p_exam = ANY(q.exams) AND q.verified AND q.active
  WHERE p_chapter_ids IS NULL OR t.chapter_id = ANY(p_chapter_ids)
  GROUP BY t.id, t.chapter_id, t.name, t.order_index
  HAVING count(q.id) > 0
  ORDER BY t.chapter_id, t.name;
$$;

DROP FUNCTION IF EXISTS public.practice_availability(text, smallint[], text[], text[], text[], text[], text[]);
CREATE FUNCTION public.practice_availability(
  p_exam text,
  p_classes smallint[] DEFAULT NULL,
  p_chapter_ids text[] DEFAULT NULL,
  p_subjects text[] DEFAULT NULL,
  p_difficulties text[] DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_question_types text[] DEFAULT NULL,
  p_topic_ids text[] DEFAULT NULL,
  p_categories text[] DEFAULT NULL,
  p_exclude_attempted boolean DEFAULT false
) RETURNS bigint LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT count(*) FROM public.questions q
  WHERE p_exam = ANY(q.exams)
    AND q.verified AND q.active AND q.chapter_id IS NOT NULL
    AND (p_classes IS NULL OR q.class_level = ANY(p_classes))
    AND (p_chapter_ids IS NULL OR q.chapter_id = ANY(p_chapter_ids))
    AND (p_topic_ids IS NULL OR q.topic_id = ANY(p_topic_ids))
    AND (p_subjects IS NULL OR q.subject = ANY(p_subjects))
    AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
    AND (p_categories IS NULL OR q.category = ANY(p_categories))
    AND (p_source_types IS NULL OR q.source_type = ANY(p_source_types))
    AND (p_question_types IS NULL OR q.question_type = ANY(p_question_types))
    AND (NOT p_exclude_attempted OR auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.practice_answers pa
      WHERE pa.user_id = auth.uid() AND pa.question_id = q.id));
$$;

CREATE FUNCTION public.practice_questions(
  p_exam text,
  p_classes smallint[] DEFAULT NULL,
  p_chapter_ids text[] DEFAULT NULL,
  p_subjects text[] DEFAULT NULL,
  p_difficulties text[] DEFAULT NULL,
  p_source_types text[] DEFAULT NULL,
  p_question_types text[] DEFAULT NULL,
  p_limit integer DEFAULT 25,
  p_exclude_ids uuid[] DEFAULT NULL,
  p_topic_ids text[] DEFAULT NULL,
  p_categories text[] DEFAULT NULL,
  p_exclude_attempted boolean DEFAULT true,
  p_seed double precision DEFAULT NULL
) RETURNS SETOF public.questions_public
LANGUAGE plpgsql STABLE SET search_path = public AS $$
DECLARE n int := greatest(1, least(coalesce(p_limit, 25), 300));
BEGIN
  IF p_seed IS NOT NULL THEN PERFORM setseed(greatest(-1, least(1, p_seed))); END IF;

  RETURN QUERY
  WITH pool AS (
    SELECT v.*, q.id AS qid,
           (p_exclude_ids IS NOT NULL AND q.id = ANY(p_exclude_ids)) AS recently_seen,
           EXISTS (SELECT 1 FROM public.practice_answers pa
                   WHERE pa.user_id = auth.uid() AND pa.question_id = q.id) AS attempted
    FROM public.questions_public v
    JOIN public.questions q ON q.id = v.id
    WHERE p_exam = ANY(q.exams)
      AND q.verified AND q.active AND q.chapter_id IS NOT NULL
      AND (p_classes IS NULL OR q.class_level = ANY(p_classes))
      AND (p_chapter_ids IS NULL OR q.chapter_id = ANY(p_chapter_ids))
      AND (p_topic_ids IS NULL OR q.topic_id = ANY(p_topic_ids))
      AND (p_subjects IS NULL OR q.subject = ANY(p_subjects))
      AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
      AND (p_categories IS NULL OR q.category = ANY(p_categories))
      AND (p_source_types IS NULL OR q.source_type = ANY(p_source_types))
      AND (p_question_types IS NULL OR q.question_type = ANY(p_question_types))
  ), ranked AS (
    SELECT *, row_number() OVER (
      ORDER BY (CASE WHEN p_exclude_attempted AND attempted THEN 2 ELSE 0 END)
             + (CASE WHEN recently_seen THEN 1 ELSE 0 END),
      random()
    ) AS rn
    FROM pool
  )
  SELECT id, exams, class_level, subject, chapter, chapter_id, topic, topic_id, subtopic,
         ncert_unit, category, difficulty, question_type, year, source, source_type,
         exam_session, paper, language, source_reference, license_status, is_pyq, is_ncert,
         marks, negative_marks, time_estimate_seconds, question_text, options, concepts, tags,
         external_id, image_url, review_status, verified, active, exam_version, created_at, updated_at
  FROM ranked WHERE rn <= n;
END $$;

CREATE OR REPLACE FUNCTION public.user_weak_areas(p_exam text DEFAULT NULL, p_min_attempts integer DEFAULT 3)
RETURNS TABLE(chapter_id text, chapter_name text, subject text, class_level smallint,
              attempted bigint, correct bigint, accuracy numeric, available bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH mine AS (
    SELECT q.chapter_id, pa.is_correct
    FROM public.practice_answers pa
    JOIN public.questions q ON q.id = pa.question_id
    WHERE pa.user_id = auth.uid()
      AND q.chapter_id IS NOT NULL
      AND (p_exam IS NULL OR p_exam = ANY(q.exams))
  )
  SELECT c.id, c.name, c.subject, c.class_level,
         count(m.*), count(*) FILTER (WHERE m.is_correct),
         round(100.0 * count(*) FILTER (WHERE m.is_correct) / greatest(count(m.*), 1), 1),
         (SELECT count(*) FROM public.questions q2
          WHERE q2.chapter_id = c.id AND q2.verified AND q2.active
            AND (p_exam IS NULL OR p_exam = ANY(q2.exams)))
  FROM mine m
  JOIN public.syllabus_chapters c ON c.id = m.chapter_id
  GROUP BY c.id, c.name, c.subject, c.class_level
  HAVING count(m.*) >= greatest(1, p_min_attempts)
  ORDER BY 7 ASC;
$$;

REVOKE ALL ON FUNCTION public.exam_syllabus_tree(text, smallint[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.chapter_topic_counts(text, text[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.practice_availability(text, smallint[], text[], text[], text[], text[], text[], text[], text[], boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer, uuid[], text[], text[], boolean, double precision) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_weak_areas(text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.exam_syllabus_tree(text, smallint[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.chapter_topic_counts(text, text[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.practice_availability(text, smallint[], text[], text[], text[], text[], text[], text[], text[], boolean) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer, uuid[], text[], text[], boolean, double precision) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.user_weak_areas(text, integer) TO authenticated, service_role;
