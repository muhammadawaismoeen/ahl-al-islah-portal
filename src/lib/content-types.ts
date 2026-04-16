/**
 * Content types — the shape of every editable block on the public site.
 * Edited by the Advisor via /admin/content. Defaults live in
 * src/lib/content-defaults.ts. Runtime content is loaded by
 * src/lib/content-store.ts.
 */

export interface HeroContent {
  eyebrow: string;
  arabicTitle: string;
  englishTitle: string;
  tagline: string;
  description: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  stats: Array<{ value: string; label: string }>;
}

export interface AboutContent {
  eyebrow: string;
  heading: string;
  lead: string;
  visionArabic: string;
  visionTitle: string;
  visionBody: string;
  missionArabic: string;
  missionTitle: string;
  missionBody: string;
  valuesHeading: string;
  values: Array<{ icon: string; arabic: string; title: string; text: string }>;
}

export interface StructureContent {
  eyebrow: string;
  heading: string;
  description: string;
  advisorLabel: string;
  advisorArabic: string;
  advisorTagline: string;
  maleWingLabel: string;
  maleWingArabic: string;
  maleWingRoleTitle: string;
  maleWingRoles: string[];
  femaleWingLabel: string;
  femaleWingArabic: string;
  femaleWingRoleTitle: string;
  femaleWingRoles: string[];
  whyWorksHeading: string;
  whyWorksItems: string[];
}

export interface RoadmapPhase {
  phase: string;
  timeframe: string;
  title: string;
  description: string;
  metric: string;
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
  structureHeading: string;
  structureItems: string[];
  smallPrint: string;
}

export interface NavContent {
  items: Array<{ label: string; href: string }>;
  ctaLabel: string;
}

/**
 * Controls which sections are visible on the public landing page.
 * Toggled from the admin content editor.
 */
export interface SectionVisibility {
  hero: boolean;
  about: boolean;
  structure: boolean;
  roadmap: boolean;
  cta: boolean;
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

export interface SiteContent {
  hero: HeroContent;
  about: AboutContent;
  structure: StructureContent;
  roadmap: RoadmapContent;
  cta: CtaContent;
  footer: FooterContent;
  nav: NavContent;
  visibility: SectionVisibility;
  customLogo: string; // base64 data URL, or empty string for default SVG
  formConfig: FormConfig;
}
