ALTER TABLE public.test_attempts
  ADD CONSTRAINT test_attempts_nonneg
    CHECK (
      total_questions >= 0
      AND attempted >= 0
      AND correct >= 0
      AND wrong >= 0
      AND score >= 0
      AND max_score >= 0
      AND duration_seconds >= 0
    ) NOT VALID,
  ADD CONSTRAINT test_attempts_counts_within_total
    CHECK (correct + wrong <= total_questions AND attempted <= total_questions) NOT VALID,
  ADD CONSTRAINT test_attempts_score_within_max
    CHECK (score <= max_score) NOT VALID,
  ADD CONSTRAINT test_attempts_duration_cap
    CHECK (duration_seconds <= 86400) NOT VALID;