# Architecture rules

- Grade bank answers through the authenticated caller client, not a service-role RPC without user identity; grade_answers enforces auth.uid().
- Paper assembly must satisfy each subject and supported question-type quota without cross-subject backfill; incomplete or unsupported section blueprints cannot launch scored papers.
- Extend the existing canonical scorer with explicit opt-in partial-credit and numeric policies; shared policies remain testable and never infer JEE Advanced partial marks from generic multiple-choice questions.

- Link founder Person and Organization structured data through stable canonical `@id` values, and keep those relationships consistent with visible About content so search engines receive one unambiguous identity.
- Keep Google Gen AI access in the shared server-only Gemini module, with endpoint authentication and database-backed per-user limits; this prevents secret exposure and divergent error handling.
- Default existing AI entry points to the explicitly configured Gemini model after verified failure of legacy integrations, while retaining explicit Groq and BYO provider branches; never silently fail over between providers.
- Gemini presentation settings never persist or transmit a browser-supplied key; the shared server credential is the only supported Gemini credential.- Retry Gemini only for transient 5xx and short per-minute 429s, with bounded exponential backoff and jitter before any output streams; daily-quota and permanent errors fail fast, so users get an honest message instead of a long wait.
- Test attempts persist only through /api/submit-attempt: the client sends question IDs, selected answers, and a per-start submission_token; the server re-grades via the caller-scoped grade_answers RPC, scores from exam_configs, and writes with supabaseAdmin (test_attempts blocks client inserts). The unique (user_id, submission_token) index makes retries idempotent — never trust client-computed counts.
- The mock-test catalog renders only from active exam_configs rows; exams without a linked db_exam show "Not available yet" and must never launch from a hardcoded fallback spec.
