/**
 * Dynamic Position Registry
 * ----------------------------------------------------------------
 * Add or remove positions here. Everything else in the portal —
 * the positions listing, apply pages, admin panel — reads from
 * this file. No code changes needed to open a new role.
 *
 * To add a new position:
 *   1. Append a new entry to the POSITIONS array below.
 *   2. Pick a unique `slug` (used in the URL).
 *   3. Set `wing` to "male", "female", or "both".
 *   4. Set `open` to true/false to open/close applications.
 *
 * The application form itself is driven by the question sets in
 * `src/lib/questions.ts` — positions reference question sets by id.
 */

export type Wing = "male" | "female" | "both";

export type PositionLevel = "head" | "deputy" | "lead" | "member";

export interface Position {
  slug: string;
  title: string;
  arabicTitle?: string;
  wing: Wing;
  level: PositionLevel;
  reportsTo: string;
  summary: string;
  responsibilities: string[];
  idealProfile: string[];
  commitment: string;
  termLength: string;
  questionSet: string; // references id in questions.ts
  open: boolean;
  closesOn?: string; // ISO date string
  priority: number; // lower = shown first
}

export const POSITIONS: Position[] = [
  {
    slug: "male-head",
    title: "Male Head of Ahl Al-Islah",
    arabicTitle: "رئيس جناح الإخوة",
    wing: "male",
    level: "head",
    reportsTo: "Advisor",
    summary:
      "Lead the brothers' wing day-to-day. Execute the Advisor's strategic direction, manage all male team members, and represent the wing in HSE meetings. You are accountable for all brothers' programming and for upholding the Shariah-first structure of the department.",
    responsibilities: [
      "Lead weekly meetings with the male core team",
      "Execute the curriculum and quarterly plan set by the Advisor",
      "Onboard and mentor male team members and new brothers",
      "Represent Ahl Al-Islah at HSE general meetings",
      "Submit weekly/monthly written reports to the Advisor",
      "Train your successor before end of term",
    ],
    idealProfile: [
      "Senior male medical student with genuine taqwa",
      "Respected by male peers, strong communicator",
      "Committed to the 5 daily prayers and consistent in Deen",
      "Understands and agrees with the zero cross-gender interaction policy",
      "Able to commit 6–8 hours per week during academic terms",
    ],
    commitment: "6–8 hours/week",
    termLength: "1 academic year",
    questionSet: "head-application",
    open: true,
    priority: 1,
  },
  {
    slug: "female-head",
    title: "Female Head of Ahl Al-Islah",
    arabicTitle: "رئيسة جناح الأخوات",
    wing: "female",
    level: "head",
    reportsTo: "Advisor (via written communication / intermediary)",
    summary:
      "Lead the sisters' wing day-to-day. Execute the Advisor's strategic direction, manage all female team members, and represent the wing in HSE women's forums. You run an independent wing — not an assistant to the brothers' team — with full trust and authority.",
    responsibilities: [
      "Lead weekly meetings with the female core team",
      "Execute the curriculum and quarterly plan set by the Advisor",
      "Onboard and mentor female team members and new sisters",
      "Represent Ahl Al-Islah in HSE women's committees or forums",
      "Submit weekly/monthly written reports to the Advisor",
      "Train your successor before end of term",
    ],
    idealProfile: [
      "Senior female medical student with genuine taqwa",
      "Respected by female peers, strong communicator",
      "Committed to the 5 daily prayers and consistent in Deen",
      "Embraces haya' and the Shariah-first structure",
      "Able to commit 6–8 hours per week during academic terms",
    ],
    commitment: "6–8 hours/week",
    termLength: "1 academic year",
    questionSet: "head-application",
    open: true,
    priority: 2,
  },
  // Example of a future position you can uncomment/add:
  // {
  //   slug: "male-deputy",
  //   title: "Male Deputy",
  //   wing: "male",
  //   level: "deputy",
  //   reportsTo: "Male Head",
  //   summary: "Support the Male Head, lead in his absence, oversee sub-leads.",
  //   responsibilities: ["..."],
  //   idealProfile: ["Reliable, organized, holds people accountable"],
  //   commitment: "4–6 hours/week",
  //   termLength: "1 academic year",
  //   questionSet: "deputy-application",
  //   open: false,
  //   priority: 3,
  // },
];

export function getPositionBySlug(slug: string): Position | undefined {
  return POSITIONS.find((p) => p.slug === slug);
}

export function getOpenPositions(): Position[] {
  return POSITIONS.filter((p) => p.open).sort((a, b) => a.priority - b.priority);
}

export function getAllPositions(): Position[] {
  return [...POSITIONS].sort((a, b) => a.priority - b.priority);
}
