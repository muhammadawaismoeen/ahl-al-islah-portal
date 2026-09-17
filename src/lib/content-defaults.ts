import type {
  SiteContent,
  FormConfig,
  FormQuestionSet,
  Position,
} from "./content-types";
import { QUESTION_SETS } from "./questions";
import type { QuestionSet } from "./questions";

// ---------------------------------------------------------------------------
// Default position registry — was previously a hardcoded array in
// src/lib/positions.ts. Now lives here as the seed data for SiteContent;
// the Advisor edits it live via /admin/positions.
// ---------------------------------------------------------------------------

const DEFAULT_POSITIONS: Position[] = [
  {
    slug: "male-head",
    title: "Male Head of Ahl Al-Islah",
    arabicTitle: "رئيس جناح الإخوة",
    wing: "male",
    level: "head",
    reportsTo: "Advisor",
    summary:
      "Lead the brothers' cohort day-to-day. Execute the Advisor's strategic direction, manage all brothers' team members, and represent the cohort in HSE meetings. You are accountable for all brothers' programming and for upholding the values and standards of the department.",
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
      "Comfortable leading within the parallel-cohort model",
      "Able to commit 6–8 hours per week during academic terms",
    ],
    commitment: "6–8 hours/week",
    termLength: "1 academic year",
    questionSet: "head-application",
    open: false,
    priority: 1,
  },
  {
    slug: "female-head",
    title: "Female Head of Ahl Al-Islah",
    arabicTitle: "رئيسة جناح الأخوات",
    wing: "female",
    level: "head",
    reportsTo: "Advisor",
    summary:
      "Lead the sisters' cohort day-to-day. Execute the Advisor's strategic direction, manage all sisters' team members, and represent the cohort in HSE women's forums. You lead an independent cohort with full trust and authority — parallel to, not beneath, the brothers' team.",
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
      "Embodies haya' and is comfortable with the parallel-cohort model",
      "Able to commit 6–8 hours per week during academic terms",
    ],
    commitment: "6–8 hours/week",
    termLength: "1 academic year",
    questionSet: "head-application",
    open: false,
    priority: 2,
  },
  {
    slug: "core-member-male",
    title: "Core Member — Brothers",
    arabicTitle: "عضو أساسي · جناح الإخوة",
    wing: "male",
    level: "member",
    reportsTo: "Head of Brothers' Cohort",
    summary:
      "Core Members are the backbone of Ahl Al-Islah — committed brothers who actively contribute to the cohort's programmes, support department events, and grow in character and leadership under the guidance of the Advisor and the Brothers' Head.",
    responsibilities: [
      "Attend and actively participate in weekly cohort meetings",
      "Support the planning and execution of department events and programmes",
      "Build genuine brotherhood within the cohort",
      "Complete assigned tasks punctually and with excellence",
      "Maintain consistent communication with the Brothers' Head",
      "Work on personal development goals set alongside the Advisor",
    ],
    idealProfile: [
      "Male medical student of any year with a sincere desire to grow",
      "Team-oriented, dependable, and eager to contribute",
      "Able to commit 3–5 hours per week during academic terms",
      "Comfortable working within a structured, values-driven team",
    ],
    commitment: "3–5 hours/week",
    termLength: "1 academic year",
    questionSet: "core-member-brothers-application",
    open: false,
    priority: 5,
  },
  {
    slug: "core-member-female",
    title: "Core Member — Sisters",
    arabicTitle: "عضوة أساسية · جناح الأخوات",
    wing: "female",
    level: "member",
    reportsTo: "Head of Sisters' Cohort",
    summary:
      "Core Members are the backbone of Ahl Al-Islah — committed sisters who actively contribute to the cohort's programmes, support department events, and grow in character and leadership under the guidance of the Advisor and the Sisters' Head.",
    responsibilities: [
      "Attend and actively participate in weekly cohort meetings",
      "Support the planning and execution of department events and programmes",
      "Build genuine sisterhood within the cohort",
      "Complete assigned tasks punctually and with excellence",
      "Maintain consistent communication with the Sisters' Head",
      "Work on personal development goals set alongside the Advisor",
    ],
    idealProfile: [
      "Female medical student of any year with a sincere desire to grow",
      "Team-oriented, dependable, and eager to contribute",
      "Able to commit 3–5 hours per week during academic terms",
      "Comfortable working within a structured, values-driven team",
    ],
    commitment: "3–5 hours/week",
    termLength: "1 academic year",
    questionSet: "core-member-application",
    open: false,
    priority: 6,
  },
  {
    slug: "general-member",
    title: "Ahl Al-Islah Membership",
    arabicTitle: "العضوية",
    wing: "both",
    level: "member",
    reportsTo: "Cohort Head",
    summary:
      "Be part of the Ahl Al-Islah community — show up to sessions, stay on the updates list, and grow alongside the cohort. No leadership commitment required.",
    responsibilities: [
      "Attend sessions when you can",
      "Stay engaged with cohort updates",
      "Grow with the community",
    ],
    idealProfile: ["Any HSE student with sincere interest in the journey"],
    commitment: "As you are able",
    termLength: "Open-ended",
    questionSet: "general-member-application",
    open: true,
    priority: 100,
  },
];

/**
 * DEFAULT PUBLIC COPY — practicing Hikmah and Diplomacy.
 *
 * The college is secular. Every string below is intentionally written
 * to avoid language that frames the department's dual-cohort model as
 * a governance or enforcement mechanism. Islamic identity itself
 * (Muslim students, Deen, Prophetic inspiration, Arabic terminology)
 * is kept; the structural firewall is reframed in professional,
 * program-design language.
 *
 * Internal strategic language ("zero cross-gender interaction,"
 * "Shariah-first structure," "firewall," etc.) lives only in the
 * internal Department Structure document — never on the portal.
 */
export const DEFAULT_CONTENT: SiteContent = {
  nav: {
    siteName: "Ahl Al-Islah",
    siteNameArabic: "أهل الإصلاح",
    items: [
      { label: "About", href: "/about" },
      { label: "Model", href: "/model" },
      { label: "Sessions", href: "/sessions" },
      { label: "Positions", href: "/positions" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Drive", href: "/drive" },
      { label: "Feedback", href: "/feedback" },
    ],
    ctaLabel: "Apply Now",
  },

  hero: {
    eyebrow: "Ahl Al-Islah · أَهل الِإصلاح",
    headingLine1: "Character,",
    headingLine2: "purpose, service.",
    lede: "A student-led community within Humanity Still Exists (HSE), powered by Rijal Al-Huda — cultivating character, purpose, and service in medical education.",
    primaryCtaLabel: "Become a Member",
    secondaryCtaLabel: "Read the Model",
    quoteText:
      "Indeed, Allah does not change the condition of a people until they change what is within themselves.",
    quoteCitation: "— Surah Ar-Ra'd, 13:11",
    stats: [
      { value: "1,200", label: "Books given" },
      { value: "4", label: "Drives run" },
      { value: "Rs. 94k", label: "General fund" },
      { value: "2", label: "Active cohorts" },
      { value: "86", label: "Sessions done" },
    ],
    cohorts: [
      {
        label: "Brothers' Cohort",
        title: "Weekly halaqah, Fridays",
        text: "Character-building sessions rooted in the Rijal Al-Huda model, open to all HSE-affiliated brothers.",
      },
      {
        label: "Sisters' Cohort",
        title: "Weekly circle, Sundays",
        text: "A parallel track for sisters, same model, led by senior cohort members.",
      },
    ],
  },

  about: {
    eyebrow: "Who we are",
    heading: "About Ahl Al-Islah",
    lead: "Ahl Al-Islah is a student-led community within Humanity Still Exists (HSE) at AMDC, built around the Rijal Al-Huda character model. We run weekly cohort sessions, seasonal drives, and small acts of organised service — the aim isn't attendance, it's formation.",
    pillars: [
      {
        title: "Character",
        text: "Weekly sessions grounded in adab, sincerity, and self-accountability before anything programmatic.",
      },
      {
        title: "Purpose",
        text: "Every cohort member is tied to a role — nobody attends without a function within the community.",
      },
      {
        title: "Service",
        text: "Drives, donations, and campus outreach are the visible output of what happens in the room.",
      },
    ],
  },

  model: {
    eyebrow: "Rijal Al-Huda",
    heading: "The Model",
    lead: "Four stages every cohort member moves through, in order — nobody skips ahead.",
    stages: [
      {
        title: "Tazkiyah — self-purification",
        description:
          "Weekly reflection, honest self-audit, and a mentor check-in before anything else is asked of a member.",
      },
      {
        title: "Ta'lim — grounded knowledge",
        description:
          "Structured study of seerah, fiqh essentials, and the Qur'an — not passive listening, but retained and tested.",
      },
      {
        title: "Tarbiyah — mentorship",
        description:
          "Every member is paired with a senior cohort member who is accountable for their growth, not just their attendance.",
      },
      {
        title: "Khidmah — service",
        description:
          "The model closes with organised service — drives, campus outreach — as the visible proof of the first three stages.",
      },
    ],
  },

  roadmap: {
    eyebrow: "Where we're headed",
    heading: "Roadmap",
    description: "",
    phases: [
      {
        phase: "Milestone 1",
        timeframe: "Sep 2025",
        title: "Cohort structure launched",
        description: "",
        metric: "",
        status: "done",
      },
      {
        phase: "Milestone 2",
        timeframe: "Jan 2026",
        title: "Mentor-pairing programme",
        description: "",
        metric: "",
        status: "done",
      },
      {
        phase: "Milestone 3",
        timeframe: "Ramadan 2027",
        title: "Qur'an & Seerah Drive",
        description: "",
        metric: "",
        status: "active",
      },
      {
        phase: "Milestone 4",
        timeframe: "Planned — no date set",
        title: "Second campus chapter",
        description: "",
        metric: "",
        status: "planned",
      },
    ],
  },

  cta: {
    arabicTitle: "انضم إلى العمل",
    heading: "Plant this seed with sincerity",
    description:
      "The Prophet ﷺ spent 13 years in Makkah building a community under far more difficult circumstances — one conversation, one relationship, one heart at a time. If you feel called to carry a piece of this work, we would love to hear from you.",
    buttonLabel: "View Open Positions",
  },

  footer: {
    tagline:
      "A student-led community within Humanity Still Exists (HSE), powered by Rijal Al-Huda — cultivating character, purpose, and service in medical education, one heart at a time.",
    quote:
      "\u201CIndeed, Allah does not change the condition of a people until they change what is within themselves.\u201D",
    quoteAttribution: "— Surah Ar-Ra'd, 13:11",
    exploreHeading: "Explore",
    exploreLinks: [
      { label: "About", href: "/about" },
      { label: "Model", href: "/model" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Open Positions", href: "/positions" },
      { label: "Qur'an & Seerah Drive", href: "/drive" },
    ],
    structureHeading: "Leadership",
    structureItems: [
      "Advisor — Unified Coordinator",
      "Brothers' Cohort — جناح الإخوة",
      "Sisters' Cohort — جناح الأخوات",
      "Under HSE / Rijal Al-Huda",
    ],
    smallPrint: "Built with ikhlas for Rijal Al-Huda.",
  },

  customLogo: "",

  formConfig: buildDefaultFormConfig(),

  positions: DEFAULT_POSITIONS,

  drive: {
    landingHeroEyebrow: "قرآن وسيرة",
    landingHeroTitle: "Qur'an & Seerah Drive",
    landingTagline:
      "Every book we place in a student's hands is a seed for the deen — sponsored, distributed, and tracked with care.",
    pickupInfoFallback:
      "Pickup details are announced once a drive is open — check back soon.",
    applyCtaLabel: "Apply for a Book",
    donateCtaLabel: "Donate",
    reserveButtonLabel: "Reserve my copy",
    statBooksLabel: "Books given all-time",
    statDrivesLabel: "Drives run",
    statFundLabel: "General fund total",
    whatsIncludedHeading: "What's included",
    whatsIncludedItems: [
      {
        title: "A physical copy",
        text: "A Qur'an or Seerah book, sponsored by the Ahl Al-Islah general fund or a specific drive.",
      },
      {
        title: "A pickup ticket",
        text: "A QR-coded ticket generated instantly after you apply — show it at pickup.",
      },
      {
        title: "Transparent tracking",
        text: "Every book given is logged, so the community can see the drive's impact over time.",
      },
    ],
    howItWorksHeading: "How it works",
    howItWorksSteps: [
      {
        title: "Apply for a book",
        text: "Choose an item from the current drive's catalog and submit your request.",
      },
      {
        title: "Get your ticket",
        text: "Receive a pickup ticket with a QR code right after applying.",
      },
      {
        title: "Collect at pickup",
        text: "Bring your ticket to the announced pickup time and location.",
      },
    ],
  },

  feedbackPage: {
    eyebrow: "ملاحظاتكم",
    heading: "Session Feedback",
    lead: "Pick the session you're reflecting on and share what stayed with you. Your honest words shape every session that follows.",
  },

  becomeMemberPage: {
    eyebrow: "انضم إلينا",
    heading: "Become a Member",
    lead: "Sign up to be part of the Ahl Al-Islah community. Show up to sessions, stay on our cohort updates, and grow alongside the team. No leadership commitment required.",
  },
};

// ---------------------------------------------------------------------------
// Seed form config from the static question-sets registry
// ---------------------------------------------------------------------------

function questionSetToFormConfig(qs: QuestionSet): FormQuestionSet {
  return {
    id: qs.id,
    name: qs.name,
    description: qs.description,
    sections: qs.sections.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      arabicTitle: s.arabicTitle,
      fields: s.fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        placeholder: f.placeholder,
        help: f.help,
        required: f.required,
        options: f.options?.map((o) => ({ label: o.label, value: o.value })),
        minLength: f.minLength,
        maxLength: f.maxLength,
        min: f.min,
        max: f.max,
        minSelected: f.minSelected,
      })),
    })),
  };
}

function buildDefaultFormConfig(): FormConfig {
  const headQs = QUESTION_SETS["head-application"];
  const converted = headQs ? questionSetToFormConfig(headQs) : undefined;
  const config: FormConfig = {};
  if (converted) {
    // Both head positions share the same form by default
    config["male-head"] = { ...converted, id: "male-head", name: "Male Head Application" };
    config["female-head"] = { ...converted, id: "female-head", name: "Female Head Application" };
  }
  return config;
}
