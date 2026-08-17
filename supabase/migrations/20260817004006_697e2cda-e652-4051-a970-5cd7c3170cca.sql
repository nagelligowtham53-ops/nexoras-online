-- 1. Read access to question content (answers/solutions intentionally NOT granted)
GRANT SELECT (
  id, exams, class_level, subject, chapter, chapter_id, topic, topic_id, subtopic,
  ncert_unit, category, difficulty, question_type, year, source, source_type,
  exam_session, paper, language, source_reference, license_status, is_pyq, is_ncert,
  marks, negative_marks, time_estimate_seconds, question_text, options, concepts, tags,
  external_id, image_url, review_status, verified, active, exam_version, question_hash,
  created_at, updated_at
) ON public.questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;

GRANT SELECT ON public.questions_public TO anon, authenticated;
GRANT ALL ON public.questions_public TO service_role;

-- 2. Syllabus + exam patterns are public reference data
GRANT SELECT ON public.syllabus_chapters TO anon, authenticated;
GRANT SELECT ON public.syllabus_topics TO anon, authenticated;
GRANT SELECT ON public.syllabus_chapter_aliases TO anon, authenticated;
GRANT SELECT ON public.exam_configs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exam_configs TO authenticated;
GRANT ALL ON public.syllabus_chapters, public.syllabus_topics,
  public.syllabus_chapter_aliases, public.exam_configs TO service_role;

-- 3. Blog
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;

-- 4. Per-user data (RLS scopes rows to auth.uid())
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrong_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.test_attempts TO authenticated;
GRANT SELECT ON public.user_stats TO authenticated;
GRANT SELECT ON public.achievements TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT ON public.import_history TO authenticated;
GRANT ALL ON public.practice_sessions, public.practice_answers, public.question_bookmarks,
  public.wrong_questions, public.profiles, public.test_attempts, public.user_stats,
  public.achievements, public.user_roles, public.import_history TO service_role;

-- 5. Function access
GRANT EXECUTE ON FUNCTION public.grade_answers(uuid[], jsonb[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_question_bank_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_chapter_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 6. Admin-only full question read (answers stay out of column grants)
CREATE OR REPLACE FUNCTION public.admin_questions_list(
  p_subject text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id uuid, subject text, chapter text, topic text, difficulty text,
  question_type text, year integer, question_text text, options jsonb,
  correct_answer jsonb, explanation text, solution text, image_url text,
  verified boolean, active boolean, review_status text, source_type text
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;
  RETURN QUERY
  SELECT q.id, q.subject, q.chapter, q.topic, q.difficulty, q.question_type, q.year,
         q.question_text, q.options, q.correct_answer, q.explanation, q.solution,
         q.image_url, q.verified, q.active, q.review_status, q.source_type
  FROM public.questions q
  WHERE (p_subject IS NULL OR q.subject = p_subject)
    AND (p_search IS NULL OR q.question_text ILIKE '%' || p_search || '%')
  ORDER BY q.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 100), 500));
END $$;

REVOKE ALL ON FUNCTION public.admin_questions_list(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_questions_list(text, text, integer) TO authenticated, service_role;

-- 7. Helpful indexes for filtered question retrieval
CREATE INDEX IF NOT EXISTS questions_exams_gin ON public.questions USING gin (exams);
CREATE INDEX IF NOT EXISTS questions_subject_active_idx ON public.questions (subject, verified, active);
CREATE INDEX IF NOT EXISTS questions_chapter_idx ON public.questions (chapter_id);