# Ahl Al-Islah Portal — Project Tracking

Design source of truth: Lavish mockup at
`~/naseeha-lms/.lavish/ahl-al-islah-v2-editorial.html` (14 screens, approved by
Awais through the Lavish review loop — this is "the Artifact"). Build spec
consolidated from it lives at `~/ahl-al-islah-build-spec.md`.

This file now lives in the repo and is kept up to date from sessions rooted
here (`cd ~/ahl-al-islah-portal && claude`) — it used to live in the home
directory because a previous naseeha-lms session's `foreign-repo-guard` hook
blocked it from reading/writing into this repo directly, so work went through
one-shot blind briefs instead. That's no longer the setup; update this file
directly going forward.

## Status

### Phase 1 — Visual design system
Done. Design tokens (Jewel Manuscript palette, Fraunces/Inter, `.ornate-card`,
`.pill`, `.btn-*`, `.gold-divider`, `.arabic-text`, etc.) correctly implemented
in `src/app/globals.css` and match the mockup's CSS spec.

### Phase 2 — Admin editability
Done. `/admin/content`, `/admin/positions`, `/admin/drive`, etc. wired up so
the Advisor can edit site content without touching code. Positions/Sessions/
Drive already have real functional data models (slugs, question sets, apply
flows) — these were NOT rebuilt from mockup placeholder data, since the
mockup's row entries there are illustrative examples, not literal content to
copy in.

### Phase 3 — Content & structure correction
**Done and committed** (`67fcb50`, 2026-09-17). This pass replaced the site's
pre-existing page content/IA with what was actually approved: Home hero is now
"Character, purpose, service." + Qur'an quote + Drive stats; About is a real
3-pillar Character/Purpose/Service page; `/model` and `/roadmap` are real
routes (not anchor-scroll sections on the homepage) — nav now points at real
pages, matching the site map.

While reviewing this pass before committing, found and fixed one gap: Phase 3
had left `/roadmap`'s content untouched from before — it was still rendering
the old "12-Month Roadmap" / "Patient, Phased, Purposeful" / 5 phase-cards
(Foundation, Soft Launch, Credibility, Expand, Legacy with Weeks/Months
timeframes) instead of the mockup's 4 concrete dated milestones. Fixed in
`src/lib/content-defaults.ts` (roadmap section now matches the mockup
verbatim: "Where we're headed" / "Roadmap" / Cohort structure launched (Sep
2025, Done) → Mentor-pairing programme (Jan 2026, Done) → Qur'an & Seerah
Drive (Ramadan 2027, Active) → Second campus chapter (Planned, no date)) and
`src/components/sections/Roadmap.tsx` (lede paragraph now only renders when
set — the mockup's roadmap screen has none).

Also verified: the build spec's "(Arabic + translation + citation)" note for
the home quote block is aspirational — the actual approved mockup has no
Arabic in that block, only the English translation + citation, and the
current implementation matches the mockup exactly. Not a bug.

## What's actually left against the build spec

1. **Drive module semantics** (build-spec §4) — not yet re-confirmed this
   session (these files weren't touched in the Phase 3 diff, so lower
   priority, but still unverified):
   - Applicant `Waitlisted` status must be *derived* from catalog stock
     hitting 0 at request time, never a manually-set Advisor state.
   - The public `/drive` "raised" figure must only count donations the
     Advisor has reviewed/approved, not raw submitted proofs.
   - Check-in tab exists in the admin tab bar — verify the screen behind it
     is real, not a stub.
2. **Visual density pass** (build-spec §3, Sessions/Positions/Drive) — these
   should render as flat `.row-list`/`.index-list` rows per the mockup, not
   a heavier card style left over from the pre-existing product. Lower
   priority — functional data model is correct already, this is presentation
   only. Not touched in the Phase 3 diff; not yet spot-checked this session.

## Explicitly out of scope

- No deployment without explicit instruction from Awais.
- The pre-existing Upstash Redis misconfig (confirmed still present —
  `[content-store] getContent failed: ... Redis client was passed an invalid
  URL` on every request; falls back to defaults harmlessly). Not this
  project's problem.
- The gameable Drive application limit — known, not being fixed here.

## Standing constraints

- Every implementation pass should start with a `wip:` snapshot commit for
  safe rollback (three exist on the branch before Phase 3: `5a2a06f`,
  `e0d50cf`, `d53d81e`).
- No deployment without explicit instruction.
