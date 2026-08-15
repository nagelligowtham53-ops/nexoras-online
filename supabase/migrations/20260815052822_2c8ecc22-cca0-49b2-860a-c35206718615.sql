CREATE OR REPLACE FUNCTION public.question_reject_reason(
  p_text text, p_options jsonb, p_answer jsonb, p_type text
) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE opt_count int; distinct_count int;
BEGIN
  IF p_text IS NULL OR length(btrim(p_text)) < 20 THEN RETURN 'too_short'; END IF;

  -- auto-numbered template stems, e.g. "BITSAT · Physics · Q3: ..."
  IF p_text ~ '·\s*Q[0-9]+\s*:' THEN RETURN 'template_stem'; END IF;

  IF p_text ~* '(exam-ready approach|best exam ?ready|for this topic\?|about this topic\?|this chapter\?|which learning objective|purpose of this chapter|describes this exam|revising this chapter)'
    THEN RETURN 'generic_filler'; END IF;

  IF p_text ~* '(what is (cbt|jee|neet|nta|icpc|the exam)|full form of|who conducts|exam pattern|how many attempts|eligibility criteria|what does .* stand for)'
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

UPDATE public.questions
SET verified = false, active = false
WHERE public.question_reject_reason(question_text, options, correct_answer, question_type) IS NOT NULL
  AND (verified OR active);
