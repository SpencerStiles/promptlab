# PromptLab — Deferred Work

Items considered during v1.0 architecture review and explicitly deferred.

---

## P2 — High Priority

### Redis-backed rate limiting for Vercel/serverless
**Why:** The in-memory rate limiter resets on server restart and is per-instance. On Vercel (serverless), each function invocation is isolated, making rate limiting effectively disabled.
**Fix:** Use `upstash/ratelimit` or similar. Swap the `rate-limit.ts` implementation — the call sites don't need to change.
**Context:** Only affects hosted/Vercel deployments. Self-hosted Docker runs as a persistent process so in-memory works fine there.
**Depends on:** Rate limiter implementation (done in v1.0 hardening)

---

## P3 — Standard

### Optimistic locking for concurrent edits
**Why:** Two browser tabs editing the same prompt → last write silently wins.
**Fix:** Add an `updatedAt` check in `updatePrompt` — if the row was modified since the client loaded it, reject the update.
**Context:** Low risk with per-user scoping (same-user two-tabs scenario only). Start tracking `updatedAt` on the client side when the prompt loads, pass it back with the update, and reject if stale.
**Depends on:** Nothing

### React component tests (RTL/Playwright)
**Why:** `PromptEditor`, `ComparePage`, `PlaygroundPage` have no component-level tests. Server action + unit tests cover critical backend paths, but UI rendering/interaction logic is untested.
**Fix:** Add React Testing Library. Write tests for `PromptEditor` (edit/delete flow, confirmation dialog) and `ComparePage` (model selection, variable inputs, compare trigger).
**Context:** ~2–4 hours of authoring. Start with `PromptEditor` since it has the most interaction logic.
**Depends on:** `PromptEditor` component implementation

### Landing page: Convert inline CSS to Tailwind
**Why:** `src/app/page.tsx` has ~70 lines of inline `<style>` CSS while the rest of the app uses Tailwind. Inconsistent, harder to maintain.
**Fix:** Replace inline styles with Tailwind utility classes. The dark theme green palette (`#4ade80`, `#16a34a`) already maps to Tailwind's `green-400`/`green-600`.
**Context:** Self-contained cosmetic change — the landing page works fine as-is. Convert when next touching the marketing page.
**Depends on:** Nothing

### Pagination for run and version history
**Why:** Prompt detail page loads up to 50 runs and all versions. With heavy usage this query will grow.
**Fix:** Add cursor-based pagination to the run history (`take: 50` → paginated) and version list (all → paginated with a "load more" pattern).
**Context:** The `take: 50` limit on runs is adequate for launch. Versions grow slowly. Revisit when users have prompts with 100+ runs regularly.
**Depends on:** Nothing
