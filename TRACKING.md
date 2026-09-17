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

### Phase 4 — Drive module semantics audit
**Done** (uncommitted at time of writing — see below). Verified against the
actual approved mockup (screens 12–14 in the Lavish artifact), not just the
build-spec prose, since that prose has been wrong once before (the Arabic
quote false alarm in Phase 3).

- **Waitlist derivation** — confirmed correct already. `reserveBook()` in
  `drive-store.ts` sets status purely from `item.remainingStock > 0` at
  request time; no admin action anywhere lets the Advisor set it manually.
- **Public "raised" figure** — confirmed correct already. `/drive` reads
  `drive.raisedAmount`, which only updates from `status === "verified"`
  donations via `recomputeDriveRaised()`. Unreviewed proofs never inflate it.
- **Check-in tab** — confirmed real, not a stub. `CheckInForm` →
  `checkInByCodeAction` → `checkInApplication`, validated against actual
  application state.
- **Gap found and fixed**: the mockup's Admin·Applicants screen (13) shows a
  search bar + Filter button and a third status, `Pending review`, sitting
  alongside Confirmed/Waitlisted — a real applicant there (Hina Nadeem, item
  with stock available) is NOT auto-confirmed. The live code before this pass
  only had `confirmed | waitlisted | picked-up` and auto-confirmed the
  instant stock was available, with no review step at all. Fixed:
  - `drive-types.ts`: `ApplicationStatus` gained `"pending-review"`.
  - `drive-store.ts`: `reserveBook` now assigns `pending-review` (not
    `confirmed`) when stock is available, still reserving the unit
    immediately so it isn't double-booked. Added `confirmApplication()` for
    the Advisor to manually promote `pending-review` → `confirmed`.
    `checkInApplication` now requires `confirmed` (rejects both
    `pending-review` and `waitlisted` with distinct messages).
  - `admin/drive/actions.ts`: added `confirmApplicationAction`.
  - `admin/drive/DriveConsoleActions.tsx`: added `ApplicantsPanel` (search by
    name/email, client-side) and `ConfirmApplicationButton`; exported
    `APP_STATUS_STYLE` (now shared with `page.tsx` instead of duplicated).
  - `drive/me/page.tsx` and `drive/applications/[id]/page.tsx`: added the
    `pending-review` entry to their status-label maps (sapphire/"info" color,
    matching the mockup's `status info` pill class and the `.pill-info`
    token already in `globals.css`).
  - Verified end-to-end: a direct-invocation script exercised
    reserve→pending-review→confirm→check-in and all the reject paths
    (confirm-while-waitlisted, check-in-before-confirm, re-confirm,
    check-in-twice); the admin/student pages were then curled (auth cookie
    for admin) against that same seeded data to confirm the pending-review
    pill, Confirm button, and search box all render. Test data removed after
    (data/drive/ is a local filesystem fallback, not the real Redis-backed
    store — see the Redis misconfig note below).
  - Not touched: no "reject/decline" action for `pending-review` or
    `waitlisted` applicants — not shown in the mockup or spec, out of scope
    for this pass.

**Not yet committed** — do a `wip:` snapshot commit for this pass per the
standing convention, then verify the diff once more before landing.

## What's actually left against the build spec

1. **Visual density pass** (build-spec §3, Sessions/Positions/Drive) — these
   should render as flat `.row-list`/`.index-list` rows per the mockup, not
   a heavier card style left over from the pre-existing product. Lower
   priority — functional data model is correct already, this is presentation
   only. Not yet spot-checked.

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
