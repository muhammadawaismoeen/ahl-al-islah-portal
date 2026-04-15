# Ahl Al-Islah Portal

<p align="center">
  <em>أهل الإصلاح — People of Reform</em><br/>
  A Shariah-first portal for a dual-wing student department under HSE, powered by Rijal Al-Huda.
</p>

---

## Overview

This is the official portal for **Ahl Al-Islah** — a department within Humanity Still Exists (HSE) that operates two independent wings (brothers' and sisters') under a single Advisor-as-Bridge model. The portal currently supports:

- A modern, responsive landing page (vision, values, structure diagram, 12-month roadmap)
- A **dynamic position registry** — add or retire roles by editing a single TypeScript file
- A multi-step application form driven by declarative **question sets** (no form code changes needed to add new roles)
- A **server-side submission store** (`/data/submissions/*.json`)
- A **password-protected admin panel** at `/admin` for reviewing applications
- Optional email notifications via [Resend](https://resend.com)

Built with Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, React Hook Form + Zod, and Framer Motion.

---

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Copy the example env file and set your values
cp .env.example .env.local

# 3. Run the dev server
npm run dev
```

Then visit <http://localhost:3000>.

### Required environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `ADMIN_PASSWORD` | Yes | Password for the `/admin` panel. Pick a strong one. |
| `RESEND_API_KEY` | No | Optional — enables email notifications on new applications. |
| `NOTIFICATION_EMAIL` | No | Address to receive notifications. Required if `RESEND_API_KEY` is set. |

---

## Managing positions (dynamic)

All open positions live in **[`src/lib/positions.ts`](src/lib/positions.ts)**. To open a new role, append an entry:

```ts
{
  slug: "male-deputy",
  title: "Male Deputy",
  wing: "male",           // "male" | "female" | "both"
  level: "deputy",
  reportsTo: "Male Head",
  summary: "…",
  responsibilities: ["…"],
  idealProfile: ["…"],
  commitment: "4–6 hours/week",
  termLength: "1 academic year",
  questionSet: "head-application", // id from questions.ts
  open: true,
  priority: 3,
}
```

To close a position temporarily, set `open: false` — it stays listed under "Future positions" but applications are disabled.

### Custom question sets

The application form is built from declarative question sets in **[`src/lib/questions.ts`](src/lib/questions.ts)**. Each question set has sections, each section has fields, and every field has type/validation metadata (text, textarea, email, tel, number, select, radio, checkbox, date).

To add a tailored form for a different role:
1. Define a new `QuestionSet` in `questions.ts`.
2. Register it under its id in the `QUESTION_SETS` map.
3. Reference the id from the position's `questionSet` field.

Validation (required, min/max length, email format, etc.) is derived automatically by `src/lib/schema.ts` — no duplicate work.

---

## Architecture

```
src/
├── app/
│   ├── layout.tsx           — Root layout, fonts, toast provider
│   ├── page.tsx             — Landing page
│   ├── positions/           — Listing of open roles
│   ├── apply/[slug]/        — Dynamic application page + server action
│   ├── admin/               — Password-gated submission review
│   └── not-found.tsx
├── components/
│   ├── Navbar.tsx, Footer.tsx, AhlLogo.tsx
│   ├── ApplicationForm.tsx  — Multi-step form, driven by question sets
│   └── sections/            — Landing-page sections
├── lib/
│   ├── positions.ts         — Position registry
│   ├── questions.ts         — Question-set registry
│   ├── schema.ts            — Zod schema builder (declarative → runtime)
│   ├── storage.ts           — Filesystem submission store
│   └── notify.ts            — Resend email notifier (optional)
└── data/
    └── submissions/         — JSON file per submission (gitignored)
```

### Zero cross-gender interaction by design

The structure is baked into the app's data model, not enforced by convention:

- Each position has a `wing` field (`male` / `female` / `both`)
- The `WingBadge` component renders differently per wing
- Admin panel shows wing-coded dots so the Advisor can sort at a glance
- There is no shared state or channel — brothers' and sisters' applications are parallel records, differentiated only at the data layer

---

## Deployment

The portal is a standard Next.js app. Any Node-compatible host works — **Vercel** is the easiest:

```bash
npm run build
```

When deploying to a serverless host (Vercel, Netlify), swap the filesystem store in `src/lib/storage.ts` for a database (Postgres / Supabase / MongoDB). The interface is small and stable.

---

## License

Confidential — for internal use by Ahl Al-Islah / Rijal Al-Huda only.

---

<p align="center"><em>
"Indeed, Allah does not change the condition of a people until they change what is within themselves."<br/>
— Surah Ar-Ra'd, 13:11
</em></p>
