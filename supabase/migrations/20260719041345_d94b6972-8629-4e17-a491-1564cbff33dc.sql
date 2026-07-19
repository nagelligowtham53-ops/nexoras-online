REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.user_roles FROM authenticated;
REVOKE ALL ON public.user_roles FROM service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

GRANT SELECT ON public.questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO authenticated;
GRANT ALL ON public.practice_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_answers TO authenticated;
GRANT ALL ON public.practice_answers TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wrong_questions TO authenticated;
GRANT ALL ON public.wrong_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bookmarks TO authenticated;
GRANT ALL ON public.question_bookmarks TO service_role;
GRANT SELECT, INSERT ON public.import_history TO authenticated;
GRANT ALL ON public.import_history TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Admins read all roles'
  ) THEN
    CREATE POLICY "Admins read all roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;