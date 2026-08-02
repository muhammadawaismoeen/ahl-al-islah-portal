import { promises as fs } from "fs";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import { DEFAULT_CONTENT } from "./content-defaults";
import type { SiteContent } from "./content-types";
import { isRedisStore, setDoc, getDoc, deleteDoc } from "./redis";

const CONTENT_FILE = path.join(process.cwd(), "data", "content.json");
const COLLECTION = "content";
const DOC_ID = "site";

/**
 * Read live content. Uses Upstash Redis in production (when the REST env
 * vars are set), otherwise falls back to the local data/content.json file.
 * Returns compiled-in defaults when neither source has stored content yet.
 */
export async function getContent(): Promise<SiteContent> {
  noStore();
  try {
    if (isRedisStore()) {
      const stored = await getDoc<Partial<SiteContent>>(COLLECTION, DOC_ID);
      if (!stored) return DEFAULT_CONTENT;
      return mergeWithDefaults(stored);
    } else {
      const raw = await fs.readFile(CONTENT_FILE, "utf8");
      const parsed = JSON.parse(raw) as Partial<SiteContent>;
      return mergeWithDefaults(parsed);
    }
  } catch (err) {
    if (isRedisStore()) {
      console.error("[content-store] getContent failed:", err);
    }
    return DEFAULT_CONTENT;
  }
}

export async function saveContent(content: SiteContent): Promise<void> {
  if (isRedisStore()) {
    await setDoc(COLLECTION, DOC_ID, content);
  } else {
    await fs.mkdir(path.dirname(CONTENT_FILE), { recursive: true });
    await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
  }
}

export async function resetContent(): Promise<void> {
  try {
    if (isRedisStore()) {
      await deleteDoc(COLLECTION, DOC_ID);
    } else {
      await fs.unlink(CONTENT_FILE);
    }
  } catch {
    // already absent — fine
  }
}

/**
 * Internal portal routes that must always appear in the public nav,
 * even if a previously-saved nav configuration predates them. Each
 * entry is appended to stored nav.items only if no item with the same
 * href is already present.
 */
const REQUIRED_NAV_ROUTES: { label: string; href: string }[] = [
  { label: "Sessions", href: "/sessions" },
  { label: "Feedback", href: "/feedback" },
];

/**
 * Shallow-merge stored content with defaults so newly-added fields
 * (after a code update) don't render as undefined on the public site.
 */
function mergeWithDefaults(stored: Partial<SiteContent>): SiteContent {
  const mergedNav = { ...DEFAULT_CONTENT.nav, ...(stored.nav ?? {}) };
  // ensure portal-required routes are always present in nav.items
  const items = [...(mergedNav.items ?? [])];
  for (const required of REQUIRED_NAV_ROUTES) {
    if (!items.some((it) => it.href === required.href)) {
      items.push(required);
    }
  }
  mergedNav.items = items;

  return {
    hero: { ...DEFAULT_CONTENT.hero, ...(stored.hero ?? {}) },
    about: { ...DEFAULT_CONTENT.about, ...(stored.about ?? {}) },
    structure: { ...DEFAULT_CONTENT.structure, ...(stored.structure ?? {}) },
    roadmap: { ...DEFAULT_CONTENT.roadmap, ...(stored.roadmap ?? {}) },
    cta: { ...DEFAULT_CONTENT.cta, ...(stored.cta ?? {}) },
    footer: { ...DEFAULT_CONTENT.footer, ...(stored.footer ?? {}) },
    nav: mergedNav,
    visibility: { ...DEFAULT_CONTENT.visibility, ...(stored.visibility ?? {}) },
    customLogo: stored.customLogo ?? DEFAULT_CONTENT.customLogo,
    formConfig: { ...DEFAULT_CONTENT.formConfig, ...(stored.formConfig ?? {}) },
  };
}
