import { promises as fs } from "fs";
import path from "path";
import { unstable_noStore as noStore } from "next/cache";
import { DEFAULT_CONTENT } from "./content-defaults";
import type { SiteContent } from "./content-types";

const CONTENT_FILE = path.join(process.cwd(), "data", "content.json");

/**
 * Read live content. If data/content.json is missing, returns the
 * compiled-in defaults (src/lib/content-defaults.ts). Admin edits
 * persist to the JSON file; defaults act as a safety net.
 */
export async function getContent(): Promise<SiteContent> {
  noStore();
  try {
    const raw = await fs.readFile(CONTENT_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    return mergeWithDefaults(parsed);
  } catch {
    return DEFAULT_CONTENT;
  }
}

export async function saveContent(content: SiteContent): Promise<void> {
  await fs.mkdir(path.dirname(CONTENT_FILE), { recursive: true });
  await fs.writeFile(CONTENT_FILE, JSON.stringify(content, null, 2), "utf8");
}

export async function resetContent(): Promise<void> {
  try {
    await fs.unlink(CONTENT_FILE);
  } catch {
    // already absent — that's fine
  }
}

/**
 * Shallow-merge stored content with defaults so newly-added fields
 * (after a code update) don't render as undefined on the public site.
 */
function mergeWithDefaults(stored: Partial<SiteContent>): SiteContent {
  return {
    hero: { ...DEFAULT_CONTENT.hero, ...(stored.hero ?? {}) },
    about: { ...DEFAULT_CONTENT.about, ...(stored.about ?? {}) },
    structure: { ...DEFAULT_CONTENT.structure, ...(stored.structure ?? {}) },
    roadmap: { ...DEFAULT_CONTENT.roadmap, ...(stored.roadmap ?? {}) },
    cta: { ...DEFAULT_CONTENT.cta, ...(stored.cta ?? {}) },
    footer: { ...DEFAULT_CONTENT.footer, ...(stored.footer ?? {}) },
    nav: { ...DEFAULT_CONTENT.nav, ...(stored.nav ?? {}) },
    visibility: { ...DEFAULT_CONTENT.visibility, ...(stored.visibility ?? {}) },
  };
}
