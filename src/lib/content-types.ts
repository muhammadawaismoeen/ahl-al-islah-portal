/**
 * Content types — the shape of every editable block on the public site.
 * Edited by the Advisor via /admin/content. Defaults live in
 * src/lib/content-defaults.ts. Runtime content is loaded by
 * src/lib/content-store.ts.
 */

export interface HeroContent {
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  lede: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  quoteText: string;
  quoteCitation: string;
  stats: Array<{ value: string; label: string }>;
  cohorts: Array<{ label: string; title: string; text: string }>;
}

export interface AboutContent {
  eyebrow: string;
  heading: string;
  lead: string;
  pillars: Array<{ title: string; text: string }>;
}

export interface ModelStage {
  title: string;
  description: string;
}

export interface ModelContent {
  eyebrow: string;
  heading: string;
  lead: string;
  stages: ModelStage[];
}

export interface RoadmapPhase {
  phase: string;
  timeframe: string;
  title: string;
  description: string;
  metric: string;
  status: "done" | "active" | "planned";
}

export interface RoadmapContent {
  eyebrow: string;
  heading: string;
  description: string;
  phases: RoadmapPhase[];
}

export interface CtaContent {
  arabicTitle: string;
  heading: string;
  description: string;
  buttonLabel: string;
}

export interface FooterContent {
  tagline: string;
  quote: string;
  quoteAttribution: string;
  exploreHeading: string;
  exploreLinks: Array<{ label: string; href: string }>;
  structureHeading: string;
  structureItems: string[];
  smallPrint: string;
}

export interface NavContent {
  siteName: string;
  siteNameArabic: string;
  items: Array<{ label: string; href: string }>;
  ctaLabel: string;
}

// ---------------------------------------------------------------------------
// Application form configuration — editable from the admin content editor.
// Mirrors the shape of questions.ts but is stored as dynamic JSON so the
// Advisor can add/remove/edit fields without touching code.
// ---------------------------------------------------------------------------

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormField {
  id: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "radio" | "checkbox" | "date" | "url";
  label: string;
  placeholder?: string;
  help?: string;
  required?: boolean;
  options?: FormFieldOption[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minSelected?: number;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  arabicTitle?: string;
  fields: FormField[];
}

export interface FormQuestionSet {
  id: string;
  name: string;
  description: string;
  sections: FormSection[];
}

/**
 * Stores per-position form overrides. Keys are position slugs
 * (e.g. "male-head", "female-head"). When a key is present the
 * apply page uses this config instead of the static questions.ts.
 */
export interface FormConfig {
  [positionSlug: string]: FormQuestionSet;
}

// ---------------------------------------------------------------------------
// Positions — admin-editable leadership/service role registry.
// Mirrors the shape that used to live as a hardcoded array in
// src/lib/positions.ts. Positions are looked up by `slug`; apply/[slug]
// and become-a-member resolve against this array via src/lib/positions.ts,
// which now reads from SiteContent instead of a static file.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Drive / Feedback / Become-a-Member page copy — admin-editable.
// ---------------------------------------------------------------------------

export interface DriveContent {
  landingHeroEyebrow: string;
  landingHeroTitle: string;
  landingTagline: string;
  pickupInfoFallback: string;
  applyCtaLabel: string;
  donateCtaLabel: string;
  reserveButtonLabel: string;
  statBooksLabel: string;
  statDrivesLabel: string;
  statFundLabel: string;
  whatsIncludedHeading: string;
  whatsIncludedItems: Array<{ title: string; text: string }>;
  howItWorksHeading: string;
  howItWorksSteps: Array<{ title: string; text: string }>;
}

export interface FeedbackPageContent {
  eyebrow: string;
  heading: string;
  lead: string;
}

export interface BecomeMemberPageContent {
  eyebrow: string;
  heading: string;
  lead: string;
}

export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  model: ModelContent;
  roadmap: RoadmapContent;
  cta: CtaContent;
  footer: FooterContent;
  nav: NavContent;
  customLogo: string; // base64 data URL, or empty string for default SVG
  formConfig: FormConfig;
  positions: Position[];
  drive: DriveContent;
  feedbackPage: FeedbackPageContent;
  becomeMemberPage: BecomeMemberPageContent;
}
