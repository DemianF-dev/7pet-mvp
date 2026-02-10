# Definition of Done (Engineering)

- Changes are scoped to bugfix/hardening/refactor only (no new features).
- All relevant unit tests pass (and new tests are added for regressions fixed).
- Lint and typecheck are green locally and in CI.
- No breaking API/route/schema changes without explicit migration plan.
- Error responses are explicit and consistent (400/403/404/409/422/500 as appropriate).
- Idempotency is enforced for critical write flows.
- Critical business rules are validated in the backend (not only in frontend).
- Logs/audit entries exist for critical state changes.
- Rollback plan is documented for risky changes.
