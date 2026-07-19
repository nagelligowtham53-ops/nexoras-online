-- 1) Sanitized view for client reads (no answers/solutions/explanations)
CREATE OR REPLACE VIEW public.questions_public
WITH (security_invoker = false) AS
SELECT
  id, exams, class_level, subject, chapter, topic, subtopic, ncert_unit,
  difficulty, question_type, year, source, is_pyq, is_ncert,
  marks, negative_marks, time_estimate_seconds,
  question_text, options, concepts, tags, external_id, image_url,
  created_at, updated_at
FROM public.questions;

REVOKE ALL ON public.questions_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.questions_public TO authenticated;
GRANT SELECT ON public.questions_public TO service_role;

-- 2) Lock down direct reads on the underlying table to admins only
DROP POLICY IF EXISTS "Authed read questions" ON public.questions;

CREATE POLICY "Admins read questions raw"
ON public.questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
  )
);

-- 3) Server-side grading function. Returns correct_answer/solution/explanation
--    only after the user has committed an answer for each question.
CREATE OR REPLACE FUNCTION public.grade_answers(
  q_ids uuid[],
  user_answers jsonb[]
)
RETURNS TABLE(
  question_id uuid,
  is_correct boolean,
  correct_answer jsonb,
  solution text,
  explanation text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  i int;
  qid uuid;
  ua jsonb;
  ca jsonb;
  sol text;
  expl text;
  ok boolean;
  ua_vals text[];
  ca_vals text[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF q_ids IS NULL OR user_answers IS NULL THEN
    RETURN;
  END IF;
  IF array_length(q_ids, 1) IS DISTINCT FROM array_length(user_answers, 1) THEN
    RAISE EXCEPTION 'q_ids and user_answers must be the same length';
  END IF;

  FOR i IN 1..array_length(q_ids, 1) LOOP
    qid := q_ids[i];
    ua := user_answers[i];

    SELECT q.correct_answer, q.solution, q.explanation
      INTO ca, sol, expl
    FROM public.questions q
    WHERE q.id = qid;

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    ok := false;
    IF ua IS NOT NULL AND ua <> 'null'::jsonb THEN
      IF ca->>'type' = 'single' THEN
        ok := (ua->>'value') IS NOT DISTINCT FROM (ca->>'value');
      ELSIF ca->>'type' = 'multiple' THEN
        SELECT array(SELECT jsonb_array_elements_text(ua->'values') ORDER BY 1) INTO ua_vals;
        SELECT array(SELECT jsonb_array_elements_text(ca->'values') ORDER BY 1) INTO ca_vals;
        ok := ua_vals IS NOT DISTINCT FROM ca_vals;
      ELSIF ca->>'type' = 'numeric' THEN
        BEGIN
          ok := abs(((ua->>'value')::numeric) - ((ca->>'value')::numeric))
                <= coalesce((ca->>'tolerance')::numeric, 0.01);
        EXCEPTION WHEN others THEN
          ok := false;
        END;
      ELSIF ca->>'type' = 'text' THEN
        ok := lower(trim(ua->>'value')) IS NOT DISTINCT FROM lower(trim(ca->>'value'));
      END IF;
    END IF;

    question_id := qid;
    is_correct := ok;
    correct_answer := ca;
    solution := sol;
    explanation := expl;
    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.grade_answers(uuid[], jsonb[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.grade_answers(uuid[], jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grade_answers(uuid[], jsonb[]) TO service_role;