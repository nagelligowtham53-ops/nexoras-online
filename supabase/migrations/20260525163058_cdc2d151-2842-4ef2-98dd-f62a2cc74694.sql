-- Restrict profiles SELECT to owner only
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Explicitly block UPDATE/DELETE on achievements to make immutability intent clear
CREATE POLICY "No updates to achievements"
ON public.achievements
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No deletes of achievements"
ON public.achievements
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);