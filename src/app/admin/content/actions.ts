"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
import { getContent, saveContent, resetContent } from "@/lib/content-store";
import type { SiteContent } from "@/lib/content-types";

/**
 * Save the full site content payload. Accepts a JSON string and
 * parses server-side to guard against stale client JS sending an
 * incompatible object shape. Revalidates all pages so the next
 * request sees the updated text.
 */
export async function updateContent(
  jsonString: string
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  let content: SiteContent;
  try {
    content = JSON.parse(jsonString) as SiteContent;
  } catch {
    return { ok: false, error: "Invalid JSON payload." };
  }

  try {
    await saveContent(content);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Failed to save content:", msg, err);
    return { ok: false, error: `Save failed: ${msg}` };
  }
}

/**
 * Reset content to compiled-in defaults (deletes data/content.json).
 */
export async function resetToDefaults(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  try {
    await resetContent();
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    console.error("Failed to reset content:", err);
    return { ok: false, error: "Failed to reset content." };
  }
}

/**
 * Return current live content (for the editor to populate).
 */
export async function fetchContent(): Promise<SiteContent> {
  return getContent();
}
