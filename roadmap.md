# Roadmap

## Examination engine restoration (uploaded master requirements)
- [x] Audit configuration, retrieval, bank readiness, grading and persistence; identify hardcoded/config drift, cross-subject backfill, unsupported formats and client-count persistence
- [x] Repair authenticated grade_answers caller mismatch, strict numeric parsing and explicit partial-credit scoring; 301 automated regressions passed
- [ ] Add immutable configuration versions, exam-specific sections and server-owned atomic submissions
- [ ] Verify supplied patterns against official bulletins for all 14 requested exams
- [x] Block incomplete subject quotas, fake JEE Main MCQ-only full papers, generic JEE Advanced scoring, unmapped Botany/Zoology and unconfigured exam starts; remove invented rank predictions
- [ ] Complete answer-key/explanation and syllabus validation: bank currently has only single-correct records (Physics 355, Chemistry 119, Mathematics 117, Biology 35), not readiness certification
- [ ] Connect section timers, grouped questions, autosave, answer controls and reconciled saved results
- [ ] Execute supplied acceptance tests and authenticated desktop/mobile exam flows; release validated exams only
- [x] Verify signed-in 25-question COMEDK Physics practice starts, accepts an answer, grades in the UI without ungraded errors, applies zero wrong-answer penalty and saves 0/25 through the existing path
- [ ] Replace legacy client-count attempt recording with atomic server-owned manifests and idempotent grading; existing save verification is not proof against forged counts

## Secure Gemini integration
- [x] Audit existing AI features and application credit wallet
- [x] Configure GEMINI_API_KEY securely; verify gemini-3.8-flash with a useful direct response
- [x] Add shared authenticated Gemini access to chat (including resume/interview callers), planner, explanations, recommendations, themes, presentations, and blog drafts; retain explicit provider branches
- [x] Implement durable per-user request limits; defer credit charging per owner's Keep AI free decision (zero AI debit rows verified)
- [x] Validate bounded inputs, structured-output checks, safe errors, 28 automated tests, signed-in failure flows, and desktop/mobile rendering
- [ ] Verify successful app-level AI flows: blocked by repeated Google 503 high-demand responses, despite one successful direct streaming request; no automatic model/provider fallback
- [ ] Verify published Gemini behavior: requires owner publishing updated app and secrets
- [x] Identify unsupported runtime AI exam generation and static career roadmaps; leave verified question bank and deterministic grading unchanged

## Founder identity correction
- [x] Correct About page copy, search metadata and founder structured data
- [x] Audit website and published blog content for conflicting founder claims (none found)
- [x] Verify About indexing signals, sitemap, and desktop/mobile presentation (published page returns 200; corrected metadata verified in preview; publishing and Google recrawl still required)

## Earlier campaign work (outside this correction)

- [ ] Audit existing credits, auth, admin, routing, and theme architecture
- [ ] Design secure reusable campaign and referral data model
- [ ] Implement and apply database migration with atomic rewards and analytics
- [ ] Implement signup attribution, verification processing, and server functions
- [ ] Add temporary festive shell, homepage banner, and distraction-free indicators
- [ ] Build Refer & Earn dashboard and protected admin campaign controls
- [ ] Add automated tests for referral security, expiry, credits, and UI behavior
- [ ] Verify routes, metadata, mobile behavior, and regression safety
