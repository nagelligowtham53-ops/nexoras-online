CREATE TABLE public.ai_request_limits (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, window_kind text NOT NULL CHECK (window_kind IN ('minute','day')), window_start timestamptz NOT NULL, request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0), PRIMARY KEY (user_id, window_kind));
GRANT ALL ON public.ai_request_limits TO service_role;
ALTER TABLE public.ai_request_limits ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.reserve_ai_request(p_user_id uuid) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE minute_start timestamptz := date_trunc('minute', now()); day_start timestamptz := date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'; minute_count integer; day_count integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 7182));
 INSERT INTO public.ai_request_limits(user_id,window_kind,window_start) VALUES (p_user_id,'minute',minute_start),(p_user_id,'day',day_start) ON CONFLICT DO NOTHING;
 UPDATE public.ai_request_limits SET window_start = CASE window_kind WHEN 'minute' THEN minute_start ELSE day_start END, request_count=0 WHERE user_id=p_user_id AND window_start <> CASE window_kind WHEN 'minute' THEN minute_start ELSE day_start END;
 SELECT request_count INTO minute_count FROM public.ai_request_limits WHERE user_id=p_user_id AND window_kind='minute';
 SELECT request_count INTO day_count FROM public.ai_request_limits WHERE user_id=p_user_id AND window_kind='day';
 IF minute_count >= 10 OR day_count >= 100 THEN RETURN false; END IF;
 UPDATE public.ai_request_limits SET request_count=request_count+1 WHERE user_id=p_user_id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_ai_request(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_request(uuid) TO service_role;