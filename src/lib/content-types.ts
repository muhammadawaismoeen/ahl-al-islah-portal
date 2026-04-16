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
}
