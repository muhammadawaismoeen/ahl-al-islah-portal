"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
import { getContent, saveContent, resetContent } from "@/lib/content-store";
import type { SiteContent } from "@/lib/content-types";

/**
 * Save the full site content payload. Revalidates all pages
 * so the next request sees the updated text.
 */
export async function updateContent(
  content: SiteContent
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  try {
    await saveContent(content);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    console.error("Failed to save content:", err);
    return { ok: false, error: "Failed to save content." };
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
