ALTER TABLE public.test_attempts ADD COLUMN submission_token text;
ALTER TABLE public.test_attempts ADD COLUMN answers jsonb;
CREATE UNIQUE INDEX test_attempts_submission_token_idx ON public.test_attempts (user_id, submission_token) WHERE submission_token IS NOT NULL;
COMMENT ON COLUMN public.test_attempts.submission_token IS 'Client-generated UUID per test start; makes submission idempotent — retries return the stored result.';
COMMENT ON COLUMN public.test_attempts.answers IS 'Server-verified submitted answers snapshot for audit and re-grading.';