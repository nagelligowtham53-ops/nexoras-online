# Complete All-Exam Engine Repair (14 exams)

## Audit findings (root causes)

1. **Missing configurations**: `exam_configs` has rows for only 7 exam keys (JEE Main, JEE Advanced ×2 papers, NEET, BITSAT, MHT-CET, COMEDK ×2, EAMCET ×2). CUET, GATE, CAT, UPSC, CLAT, NDA, SSC CGL, TG EAPCET have no configuration at all — the UI falls back to hardcoded, inaccurate values.
2. **Question bank reality**: 626 verified+active questions, ALL `single_correct`, only Physics (355) / Chemistry (119) / Mathematics (117) / Biology (35). Zero numerical/integer questions, zero English & Logical Reasoning, zero non-PCM subjects. No full-length paper for ANY exam can currently be generated honestly.
3. **Score forgery risk**: `/api/record-attempt` trusts client-sent correct/wrong counts and uses a hardcoded marking map that diverges from `exam_configs` (e.g. NEET wrong=1 ok, but maxQ values are wrong for several exams). No idempotency — retries create duplicate attempts.
4. **Readiness gate mostly works** (test-generation.ts already blocks cross-subject substitution, enforces the JEE Main MCQ/numerical split, and disables JEE Advanced scored tests) but the mock-tests UI still shows hardcoded fallback exam cards that look launchable.
5. **Explanations**: `/api/explain-question` defaults to the shared server Gemini module (keys server-side, friendly errors); Groq branch kept. Needs end-to-end verification, not a rewrite.

## Plan

### Phase 1 — Configuration authority
- Add `exam_configs` rows for the 8 missing exams (CUET UG, GATE CS, CAT, UPSC CSE Prelims, CLAT, NDA, SSC CGL, TG EAPCET) using the patterns supplied in the project spec, each marked with a `verified` flag in `pattern_note` where official confirmation is pending. No invented values: where the spec gives no value, the exam is created inactive with an explicit "configuration pending" note.
- Remove the hardcoded `EXAMS` fallback in `mock-tests.tsx`: exams without an active DB config render as "Not yet available" cards, never as launchable.

### Phase 2 — Readiness and generation truthfulness
- Keep the existing no-substitution, per-section quota engine; extend the readiness report to show per-section required/available/missing on the instructions screen.
- Begin Test stays disabled unless the exact configured paper can be generated; shorter tests only via explicit size buttons, labelled "Practice test (N questions)" — never "full-length".
- Fix the JEE Main "75 available" message: it counted all single_correct rows; the report now separates MCQ vs numerical availability per subject.

### Phase 3 — Server-authoritative, idempotent grading
- New `submit-attempt` server route: client sends `{ sessionToken, exam_key, answers: [{question_id, answer}] }`; the server grades via the authenticated `grade_answers` path + canonical `evaluation.ts` logic, computes score from the exam's `exam_configs` marking scheme, and persists session + answers + result atomically.
- Idempotency: `sessionToken` (client-generated UUID per test start) is unique per user; retries return the stored result instead of duplicating.
- `/api/record-attempt` is reduced to XP/streak/badge awards driven by the server-computed result, or folded into submit-attempt; client-supplied correct/wrong counts are no longer trusted.
- Score never exceeds configured max; attempted = correct + wrong + partial reconciles with submitted answers.

### Phase 4 — Explanations
- Verify `/api/explain-question` end-to-end with the configured Gemini model; keep friendly error states; explanation failure never affects scoring.

### Phase 5 — Verification suite and release gate
- Automated per-exam tests: config presence, subject mapping, readiness math, scoring rules (negative/partial/zero), idempotent submission, max-score cap.
- An admin release-gate report (`/admin/questions` diagnostics section) showing per exam: config verified / bank verified / full-length ready / chapter-wise ready / scoring verified / blockers.
- Representative signed-in E2E: start a chapter-wise practice, answer, submit, verify saved result.

## Honest blockers (will be reported, not hidden)
- No exam can currently deliver a full-length paper: the bank lacks numerical questions (JEE Main/Advanced), Botany/Zoology volume (NEET), English & LR (BITSAT), and all non-PCM subjects (CUET, GATE, CAT, UPSC, CLAT, NDA, SSC CGL, TG EAPCET). These exams will show truthful "not ready" states with exact shortages until real questions are imported via `/admin/questions`.
- JEE Advanced section-level marking blueprint is not officially verified; scored full papers stay disabled.

## Technical details
- Migration: insert missing `exam_configs` rows (additive only); add `submission_token` uniqueness on `test_attempts` (or a new `attempt_submissions` table) for idempotency.
- Files: `src/routes/mock-tests.tsx`, `src/lib/test-generation.ts`, `src/lib/exam-config.ts`, new `src/routes/api/submit-attempt.ts`, `src/routes/api/record-attempt.ts`, `src/lib/evaluation.ts`, `src/lib/__tests__/exam-restoration.test.ts`, `src/routes/admin.questions.tsx`.
- No UI redesign; existing routes, auth, and features preserved.
