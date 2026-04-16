import type { SiteContent, FormConfig, FormQuestionSet } from "./content-types";
import { QUESTION_SETS } from "./questions";
import type { QuestionSet } from "./questions";

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
    items: [
      { label: "About", href: "/#about" },
      { label: "Model", href: "/#structure" },
      { label: "Positions", href: "/positions" },
      { label: "Roadmap", href: "/#roadmap" },
    ],
    ctaLabel: "Apply Now",
  },

  hero: {
    eyebrow: "Powered by Rijal Al-Huda · under HSE",
    arabicTitle: "أهل الإصلاح",
    englishTitle: "Ahl Al-Islah",
    tagline: "People of Reform",
    description:
      "A student-led community within Humanity Still Exists (HSE), cultivating character, purpose, and service in medical education — through dedicated brothers' and sisters' programming, rooted in the Prophetic spirit of excellence.",
    primaryCtaLabel: "Apply for a Position",
    secondaryCtaLabel: "Learn More",
    stats: [
      { value: "2", label: "Dedicated cohorts" },
      { value: "1", label: "Unified mission" },
      { value: "6", label: "Core values" },
    ],
  },

  about: {
    eyebrow: "Vision & Mission",
    heading: "A seed planted with sincerity",
    lead: "Ahl Al-Islah exists to provide a welcoming, values-driven space for Muslim medical students to strengthen their faith, build meaningful peer relationships, develop holistic life skills rooted in the Sunnah, and serve their community with professionalism and excellence.",
    visionArabic: "الرؤية",
    visionTitle: "Vision",
    visionBody:
      "To cultivate a generation of Muslim medical professionals — women and men — who are as strong in their Deen as they are in their profession, and who carry themselves with dignity and service in every setting.",
    missionArabic: "الرسالة",
    missionTitle: "Mission",
    missionBody:
      "Provide a welcoming space for Muslim medical students to strengthen their faith, build meaningful peer relationships within their respective cohorts, develop life skills rooted in the Sunnah, and serve the campus with excellence and care.",
    valuesHeading: "Six pillars that shape every decision",
    values: [
      {
        icon: "Heart",
        arabic: "الإخلاص",
        title: "Ikhlas",
        text: "Sincerity. Everything we do is for the sake of Allah alone.",
      },
      {
        icon: "BookOpen",
        arabic: "الحكمة",
        title: "Hikmah",
        text: "Wisdom. We operate with strategic patience and contextual intelligence.",
      },
      {
        icon: "Users",
        arabic: "الأخوة",
        title: "Ukhuwwah",
        text: "Genuine peer bonds that sustain us through medical school and beyond.",
      },
      {
        icon: "Sun",
        arabic: "الإحسان",
        title: "Ihsan",
        text: "Excellence. Every event, every interaction reflects our best effort.",
      },
      {
        icon: "Sparkles",
        arabic: "الخدمة",
        title: "Khidmah",
        text: "Service. We serve the campus and community, earning respect through action.",
      },
      {
        icon: "Shield",
        arabic: "الحياء",
        title: "Haya'",
        text: "Modesty and dignity — a mark of professionalism in every interaction.",
      },
    ],
  },

  structure: {
    eyebrow: "Organizational Model",
    heading: "Parallel Programming, Unified Leadership",
    description:
      "One department serving all Muslim medical students through two dedicated cohorts — brothers' and sisters' — each with its own leadership, programming, and community. A single Advisor unifies both cohorts under one vision, ensuring consistent quality and alignment across the department.",
    advisorLabel: "Advisor",
    advisorArabic: "المستشار",
    advisorTagline: "Unified Coordinator",
    maleWingLabel: "Brothers' Cohort",
    maleWingArabic: "جناح الإخوة",
    maleWingRoleTitle: "Head, Brothers' Cohort",
    maleWingRoles: [
      "Deputy Head",
      "Da'wah & Content Lead",
      "Outreach & Engagement Lead",
      "Logistics & Operations Lead",
      "Secretary",
    ],
    femaleWingLabel: "Sisters' Cohort",
    femaleWingArabic: "جناح الأخوات",
    femaleWingRoleTitle: "Head, Sisters' Cohort",
    femaleWingRoles: [
      "Deputy Head",
      "Da'wah & Content Lead",
      "Outreach & Engagement Lead",
      "Logistics & Operations Lead",
      "Secretary",
    ],
    whyWorksHeading: "Why this model works",
    whyWorksItems: [
      "Dedicated programming — each cohort receives focused attention tailored to its needs, not a compromised one-size-fits-all approach.",
      "Consistent vision — both cohorts receive the same strategic direction, curriculum quality, and leadership support from the Advisor.",
      "Streamlined coordination — a single Advisor reduces role confusion and keeps decisions moving.",
      "Strong peer leadership — each cohort develops its own leaders, mentors, and community organically.",
      "Scalable — new members join their cohort seamlessly; the model holds as the department grows.",
      "Prophetic inspiration — the Prophet (ﷺ) taught and guided both men and women of the Ummah, through dedicated sessions and trusted channels.",
    ],
  },

  roadmap: {
    eyebrow: "12-Month Roadmap",
    heading: "Patient, Phased, Purposeful",
    description:
      "Both cohorts develop in parallel. Each phase builds trust, competence, and credibility — with the Advisor ensuring consistent quality across both cohorts from day one.",
    phases: [
      {
        phase: "Phase 1",
        timeframe: "Weeks 1–4",
        title: "Foundation",
        description:
          "Appoint Heads for both cohorts. Build each cohort's core team. Draft the department charter. Establish meeting rhythms and cohort-specific communication channels.",
        metric:
          "Both cohorts have appointed leadership · Charter approved by HSE",
      },
      {
        phase: "Phase 2",
        timeframe: "Weeks 5–8",
        title: "Soft Launch",
        description:
          "First brotherhood and sisterhood gatherings. Weekly halaqahs per cohort. One universally appealing event per cohort (e.g., Exam Stress workshop).",
        metric:
          "Weekly attendance of 8+ per cohort · Positive word-of-mouth",
      },
      {
        phase: "Phase 3",
        timeframe: "Months 3–4",
        title: "Credibility",
        description:
          "Host a flagship event with thoughtful programming. Structured Seerah circles. Engage faculty allies per cohort. Establish monthly reporting rhythm.",
        metric:
          "50+ attendees at flagship · Faculty engaged per cohort · HSE leadership satisfied",
      },
      {
        phase: "Phase 4",
        timeframe: "Months 5–8",
        title: "Expand",
        description:
          "Launch signature recurring programs per cohort. Peer mentorship pairs. Community service projects with parallel teams. Collaborations with other HSE departments.",
        metric:
          "25+ consistent members per cohort · Members showing personal growth",
      },
      {
        phase: "Phase 5",
        timeframe: "Months 9–12",
        title: "Legacy",
        description:
          "Document operations manuals per cohort. Each Head trains their own successor. Establish Ahl Al-Islah as a campus brand synonymous with professionalism, values, and service.",
        metric:
          "Both cohorts self-sustaining · Successors identified and trained",
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
    structureHeading: "Leadership",
    structureItems: [
      "Advisor — Unified Coordinator",
      "Brothers' Cohort — جناح الإخوة",
      "Sisters' Cohort — جناح الأخوات",
      "Under HSE / Rijal Al-Huda",
    ],
    smallPrint: "Built with ikhlas for Rijal Al-Huda.",
  },

  visibility: {
    hero: true,
    about: true,
    structure: true,
    roadmap: true,
    cta: true,
  },

  customLogo: "",

  formConfig: buildDefaultFormConfig(),
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
