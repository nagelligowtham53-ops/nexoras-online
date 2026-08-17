UPDATE public.questions q
SET exams = array_append(q.exams, 'NEET')
FROM public.syllabus_chapters c
WHERE c.id = q.chapter_id
  AND c.in_neet
  AND q.verified AND q.active
  AND q.subject IN ('Physics','Chemistry')
  AND NOT ('NEET' = ANY(q.exams));