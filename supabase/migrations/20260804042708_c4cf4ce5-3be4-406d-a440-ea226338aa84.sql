REVOKE ALL ON FUNCTION public.admin_question_bank_health() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_chapter_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_question_bank_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_chapter_health() TO authenticated;

CREATE OR REPLACE FUNCTION public.exam_chapter_counts(p_exam text, p_classes smallint[] DEFAULT NULL)
RETURNS TABLE(chapter_id text, subject text, class_level smallint, chapter_name text,
              total bigint, pyq bigint, ncert bigint, original bigint,
              easy bigint, medium bigint, hard bigint)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
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
    ON q.chapter_id = c.id AND p_exam = ANY(q.exams)
  WHERE (
      (p_exam = 'JEE Main' AND c.in_jee_main)
   OR (p_exam = 'JEE Advanced' AND c.in_jee_advanced)
   OR (p_exam = 'NEET' AND c.in_neet)
  )
  AND (p_classes IS NULL OR c.class_level = ANY(p_classes))
  GROUP BY c.id, c.subject, c.class_level, c.name, c.order_index
  ORDER BY c.subject, c.class_level, c.order_index;
$$;
GRANT EXECUTE ON FUNCTION public.exam_chapter_counts(text, smallint[]) TO anon, authenticated;