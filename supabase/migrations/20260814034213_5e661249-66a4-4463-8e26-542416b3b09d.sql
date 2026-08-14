ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS question_hash text,
  ADD COLUMN IF NOT EXISTS exam_version text NOT NULL DEFAULT '2025';

CREATE UNIQUE INDEX IF NOT EXISTS questions_question_hash_key ON public.questions (question_hash) WHERE question_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS questions_eligible_idx ON public.questions (chapter_id, difficulty, question_type) WHERE verified AND active;

-- Retire the old generic filler questions (kept for audit, hidden from practice)
UPDATE public.questions
SET active = false, verified = false, review_status = 'rejected'
WHERE tags && ARRAY['seeded-bank']::text[];

-- Trust anything already curated that is not filler
UPDATE public.questions
SET verified = true, review_status = 'verified'
WHERE active AND NOT (tags && ARRAY['seeded-bank']::text[]);

DROP FUNCTION IF EXISTS public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer);
DROP VIEW IF EXISTS public.questions_public;

CREATE VIEW public.questions_public WITH (security_invoker = true) AS
SELECT id, exams, class_level, subject, chapter, chapter_id, topic, subtopic, ncert_unit,
       difficulty, question_type, year, source, source_type, exam_session, paper, language,
       source_reference, license_status, is_pyq, is_ncert, marks, negative_marks,
       time_estimate_seconds, question_text, options, concepts, tags, external_id, image_url,
       review_status, verified, active, exam_version, created_at, updated_at
FROM public.questions
WHERE verified AND active;

GRANT SELECT ON public.questions_public TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.exam_chapter_counts(p_exam text, p_classes smallint[] DEFAULT NULL::smallint[])
 RETURNS TABLE(chapter_id text, subject text, class_level smallint, chapter_name text, total bigint, pyq bigint, ncert bigint, original bigint, easy bigint, medium bigint, hard bigint)
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  SELECT c.id, c.subject, c.class_level, c.name,
         count(q.id),
         count(q.id) FILTER (WHERE q.source_type IN ('previous_year','official_exam')),
         count(q.id) FILTER (WHERE q.source_type = 'ncert_based'),
         count(q.id) FILTER (WHERE q.source_type = 'original_practice'),
         count(q.id) FILTER (WHERE q.difficulty = 'Easy'),
         count(q.id) FILTER (WHERE q.difficulty = 'Medium'),
         count(q.id) FILTER (WHERE q.difficulty = 'Hard')
  FROM public.syllabus_chapters c
  LEFT JOIN public.questions q
    ON q.chapter_id = c.id AND p_exam = ANY(q.exams) AND q.verified AND q.active
  WHERE (
      (p_exam = 'JEE Main' AND c.in_jee_main)
   OR (p_exam = 'JEE Advanced' AND c.in_jee_advanced)
   OR (p_exam = 'NEET' AND c.in_neet)
  )
  AND (p_classes IS NULL OR c.class_level = ANY(p_classes))
  GROUP BY c.id, c.subject, c.class_level, c.name, c.order_index
  ORDER BY c.subject, c.class_level, c.order_index;
$function$;

CREATE OR REPLACE FUNCTION public.practice_availability(p_exam text, p_classes smallint[] DEFAULT NULL::smallint[], p_chapter_ids text[] DEFAULT NULL::text[], p_subjects text[] DEFAULT NULL::text[], p_difficulties text[] DEFAULT NULL::text[], p_source_types text[] DEFAULT NULL::text[], p_question_types text[] DEFAULT NULL::text[])
 RETURNS bigint
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  SELECT count(*) FROM public.questions q
  WHERE p_exam = ANY(q.exams)
    AND q.verified AND q.active
    AND q.chapter_id IS NOT NULL
    AND (p_classes IS NULL OR q.class_level = ANY(p_classes))
    AND (p_chapter_ids IS NULL OR q.chapter_id = ANY(p_chapter_ids))
    AND (p_subjects IS NULL OR q.subject = ANY(p_subjects))
    AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
    AND (p_source_types IS NULL OR q.source_type = ANY(p_source_types))
    AND (p_question_types IS NULL OR q.question_type = ANY(p_question_types));
$function$;

CREATE OR REPLACE FUNCTION public.practice_questions(
  p_exam text,
  p_classes smallint[] DEFAULT NULL::smallint[],
  p_chapter_ids text[] DEFAULT NULL::text[],
  p_subjects text[] DEFAULT NULL::text[],
  p_difficulties text[] DEFAULT NULL::text[],
  p_source_types text[] DEFAULT NULL::text[],
  p_question_types text[] DEFAULT NULL::text[],
  p_limit integer DEFAULT 25,
  p_exclude_ids uuid[] DEFAULT NULL::uuid[]
)
 RETURNS SETOF questions_public
 LANGUAGE sql STABLE SET search_path TO 'public'
AS $function$
  WITH pool AS (
    SELECT v.*, q.id AS qid
    FROM public.questions_public v
    JOIN public.questions q ON q.id = v.id
    WHERE p_exam = ANY(q.exams)
      AND q.verified AND q.active
      AND q.chapter_id IS NOT NULL
      AND (p_classes IS NULL OR q.class_level = ANY(p_classes))
      AND (p_chapter_ids IS NULL OR q.chapter_id = ANY(p_chapter_ids))
      AND (p_subjects IS NULL OR q.subject = ANY(p_subjects))
      AND (p_difficulties IS NULL OR q.difficulty = ANY(p_difficulties))
      AND (p_source_types IS NULL OR q.source_type = ANY(p_source_types))
      AND (p_question_types IS NULL OR q.question_type = ANY(p_question_types))
  ), fresh AS (
    SELECT * FROM pool
    WHERE p_exclude_ids IS NULL OR NOT (qid = ANY(p_exclude_ids))
  ), chosen AS (
    SELECT * FROM fresh
    UNION ALL
    SELECT * FROM pool
    WHERE (SELECT count(*) FROM fresh) < greatest(1, least(p_limit, 300))
  )
  SELECT DISTINCT ON (id) id, exams, class_level, subject, chapter, chapter_id, topic, subtopic,
         ncert_unit, difficulty, question_type, year, source, source_type, exam_session, paper,
         language, source_reference, license_status, is_pyq, is_ncert, marks, negative_marks,
         time_estimate_seconds, question_text, options, concepts, tags, external_id, image_url,
         review_status, verified, active, exam_version, created_at, updated_at
  FROM (SELECT * FROM chosen ORDER BY random()) s
  LIMIT greatest(1, least(p_limit, 300));
$function$;

REVOKE ALL ON FUNCTION public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer, uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.practice_questions(text, smallint[], text[], text[], text[], text[], text[], integer, uuid[]) TO anon, authenticated, service_role;
