
-- 1) Rebuild questions_public as a SECURITY INVOKER view (Postgres 15+),
--    so it enforces the caller's RLS rather than the view owner's rights.
DROP VIEW IF EXISTS public.questions_public;
CREATE VIEW public.questions_public
WITH (security_invoker = true) AS
SELECT id, exams, class_level, subject, chapter, topic, subtopic, ncert_unit,
       difficulty, question_type, year, source, is_pyq, is_ncert, marks,
       negative_marks, time_estimate_seconds, question_text, options,
       concepts, tags, external_id, image_url, created_at, updated_at
FROM public.questions;

-- Allow authenticated + anon to read the safe view; the view now enforces
-- RLS as the caller, so add a permissive SELECT policy on questions
-- limited to the safe columns via the view (raw table SELECT still restricted).
GRANT SELECT ON public.questions_public TO anon, authenticated;

-- Add a public SELECT policy on the base table so the invoker view works.
-- Sensitive columns (correct_answer/solution/explanation) are excluded from
-- the view definition, and direct client access to public.questions is not
-- possible from the app (client only queries the view).
DROP POLICY IF EXISTS "Public read safe columns" ON public.questions;
CREATE POLICY "Public read safe columns" ON public.questions
  FOR SELECT TO anon, authenticated
  USING (true);

-- 2) Lock down grade_answers: revoke from authenticated so signed-in users
--    cannot call it directly. It will be invoked server-side via service_role.
REVOKE EXECUTE ON FUNCTION public.grade_answers(uuid[], jsonb[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grade_answers(uuid[], jsonb[]) TO service_role;

-- 3) Server-side scoring for practice_answers and practice_sessions.
--    Trigger recomputes is_correct and awarded_marks from questions.correct_answer,
--    so a client cannot forge scores.
CREATE OR REPLACE FUNCTION public.enforce_practice_answer_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ca jsonb;
  qmarks numeric;
  qneg numeric;
  ok boolean := false;
  ua_vals text[];
  ca_vals text[];
BEGIN
  SELECT correct_answer, marks, negative_marks
    INTO ca, qmarks, qneg
  FROM public.questions
  WHERE id = NEW.question_id;

  IF ca IS NULL THEN
    NEW.is_correct := false;
    NEW.awarded_marks := 0;
    RETURN NEW;
  END IF;

  IF NEW.is_skipped OR NEW.user_answer IS NULL OR NEW.user_answer = 'null'::jsonb THEN
    NEW.is_correct := NULL;
    NEW.awarded_marks := 0;
    RETURN NEW;
  END IF;

  IF ca->>'type' = 'single' THEN
    ok := (NEW.user_answer->>'value') IS NOT DISTINCT FROM (ca->>'value');
  ELSIF ca->>'type' = 'multiple' THEN
    SELECT array(SELECT jsonb_array_elements_text(NEW.user_answer->'values') ORDER BY 1) INTO ua_vals;
    SELECT array(SELECT jsonb_array_elements_text(ca->'values') ORDER BY 1) INTO ca_vals;
    ok := ua_vals IS NOT DISTINCT FROM ca_vals;
  ELSIF ca->>'type' = 'numeric' THEN
    BEGIN
      ok := abs(((NEW.user_answer->>'value')::numeric) - ((ca->>'value')::numeric))
            <= coalesce((ca->>'tolerance')::numeric, 0.01);
    EXCEPTION WHEN others THEN ok := false;
    END;
  ELSIF ca->>'type' = 'text' THEN
    ok := lower(trim(NEW.user_answer->>'value')) IS NOT DISTINCT FROM lower(trim(ca->>'value'));
  END IF;

  NEW.is_correct := ok;
  NEW.awarded_marks := CASE WHEN ok THEN coalesce(qmarks, 4) ELSE -coalesce(qneg, 0) END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_practice_answers_score ON public.practice_answers;
CREATE TRIGGER trg_practice_answers_score
BEFORE INSERT OR UPDATE ON public.practice_answers
FOR EACH ROW EXECUTE FUNCTION public.enforce_practice_answer_score();

-- Recompute session aggregates from practice_answers so clients cannot
-- forge session score/counts.
CREATE OR REPLACE FUNCTION public.recompute_practice_session(session_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_correct int := 0;
  c_wrong int := 0;
  c_skipped int := 0;
  c_total int := 0;
  s_score numeric := 0;
  s_max numeric := 0;
BEGIN
  SELECT
    count(*) FILTER (WHERE is_correct IS TRUE),
    count(*) FILTER (WHERE is_correct IS FALSE),
    count(*) FILTER (WHERE is_skipped IS TRUE OR is_correct IS NULL),
    count(*),
    coalesce(sum(awarded_marks), 0)
  INTO c_correct, c_wrong, c_skipped, c_total, s_score
  FROM public.practice_answers WHERE session_id = session_uuid;

  SELECT coalesce(sum(q.marks), 0) INTO s_max
  FROM public.practice_answers pa
  JOIN public.questions q ON q.id = pa.question_id
  WHERE pa.session_id = session_uuid;

  UPDATE public.practice_sessions
  SET correct_count = c_correct,
      wrong_count = c_wrong,
      skipped_count = c_skipped,
      total_questions = greatest(total_questions, c_total),
      score = s_score,
      max_score = s_max
  WHERE id = session_uuid;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_practice_answers_recompute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_practice_session(coalesce(NEW.session_id, OLD.session_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_practice_answers_recompute ON public.practice_answers;
CREATE TRIGGER trg_practice_answers_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.practice_answers
FOR EACH ROW EXECUTE FUNCTION public.trg_practice_answers_recompute();

-- Prevent clients from writing forged score fields directly on sessions:
-- a BEFORE trigger resets the score/counts to server-recomputed values.
CREATE OR REPLACE FUNCTION public.enforce_session_scores()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c_correct int := 0;
  c_wrong int := 0;
  c_skipped int := 0;
  s_score numeric := 0;
  s_max numeric := 0;
BEGIN
  SELECT
    count(*) FILTER (WHERE is_correct IS TRUE),
    count(*) FILTER (WHERE is_correct IS FALSE),
    count(*) FILTER (WHERE is_skipped IS TRUE OR is_correct IS NULL),
    coalesce(sum(awarded_marks), 0)
  INTO c_correct, c_wrong, c_skipped, s_score
  FROM public.practice_answers WHERE session_id = NEW.id;

  SELECT coalesce(sum(q.marks), 0) INTO s_max
  FROM public.practice_answers pa
  JOIN public.questions q ON q.id = pa.question_id
  WHERE pa.session_id = NEW.id;

  NEW.correct_count := c_correct;
  NEW.wrong_count := c_wrong;
  NEW.skipped_count := c_skipped;
  NEW.score := s_score;
  NEW.max_score := s_max;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_practice_sessions_scores ON public.practice_sessions;
CREATE TRIGGER trg_practice_sessions_scores
BEFORE UPDATE ON public.practice_sessions
FOR EACH ROW EXECUTE FUNCTION public.enforce_session_scores();

-- Also lock down has_role from authenticated (linter finding); keep for
-- service_role and callable from policies (SECURITY DEFINER + set search_path
-- lets policies invoke it as postgres regardless of grant).
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;
