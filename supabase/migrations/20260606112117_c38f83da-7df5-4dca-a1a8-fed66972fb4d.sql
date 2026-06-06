
-- achievements: block client inserts (deletes/updates already blocked)
CREATE POLICY "No inserts of achievements" ON public.achievements
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);

-- test_attempts: block all client writes
CREATE POLICY "No client inserts on test_attempts" ON public.test_attempts
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates on test_attempts" ON public.test_attempts
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on test_attempts" ON public.test_attempts
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);

-- user_stats: block all client writes
CREATE POLICY "No client inserts on user_stats" ON public.user_stats
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates on user_stats" ON public.user_stats
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on user_stats" ON public.user_stats
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);

-- blog_posts: block all client writes (admin CMS writes via service role)
CREATE POLICY "No client inserts on blog_posts" ON public.blog_posts
  AS RESTRICTIVE FOR INSERT TO authenticated, anon WITH CHECK (false);
CREATE POLICY "No client updates on blog_posts" ON public.blog_posts
  AS RESTRICTIVE FOR UPDATE TO authenticated, anon USING (false) WITH CHECK (false);
CREATE POLICY "No client deletes on blog_posts" ON public.blog_posts
  AS RESTRICTIVE FOR DELETE TO authenticated, anon USING (false);
