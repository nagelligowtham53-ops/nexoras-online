UPDATE public.questions q
SET exams = array_append(q.exams, 'JEE Advanced')
FROM public.syllabus_chapters c
WHERE c.id = q.chapter_id
  AND q.verified AND q.active
  AND c.in_jee_advanced
  AND q.difficulty IN ('Medium','Hard')
  AND q.source_type NOT IN ('previous_year','official_exam')
  AND NOT ('JEE Advanced' = ANY(q.exams));