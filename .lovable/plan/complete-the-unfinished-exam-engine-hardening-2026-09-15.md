# Complete the unfinished exam-engine hardening

## Outcome
- Replace the mock-test screen’s duplicate score calculations with the tested evaluator.
- Treat missing grading results as ungraded and worth zero, never as wrong or negatively marked.
- Keep one frozen result for saving attempts, analytics, and answer review.
- Load answer-bearing admin question records through the existing admin-only database function instead of direct browser reads.
- Verify scoring tests and the affected pages.

## Technical details
- Adapt server grade results into the evaluator’s canonical answer-key shape.
- Preserve each exam’s configured positive and negative marking scheme.
- Update result analytics and review rows to read the evaluator submissions.
- Add a protected server function for `admin_questions_list`; authenticate and verify the admin role before calling it.
- Leave existing import, edit, and delete permissions unchanged unless verification exposes a direct blocker.
