DROP POLICY IF EXISTS "own attempts insert" ON public.test_attempts;
REVOKE INSERT, UPDATE, DELETE ON public.test_attempts FROM authenticated, anon;
GRANT  SELECT                  ON public.test_attempts TO authenticated;
GRANT  ALL                     ON public.test_attempts TO service_role;

DROP POLICY IF EXISTS "own stats insert" ON public.user_stats;
DROP POLICY IF EXISTS "own stats update" ON public.user_stats;
REVOKE INSERT, UPDATE, DELETE ON public.user_stats   FROM authenticated, anon;
GRANT  SELECT                  ON public.user_stats   TO authenticated;
GRANT  ALL                     ON public.user_stats   TO service_role;

DROP POLICY IF EXISTS "own ach insert" ON public.achievements;
REVOKE INSERT, UPDATE, DELETE ON public.achievements FROM authenticated, anon;
GRANT  SELECT                  ON public.achievements TO authenticated;
GRANT  ALL                     ON public.achievements TO service_role;