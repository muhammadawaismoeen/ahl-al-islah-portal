"use server";

import { revalidatePath } from "next/cache";
import { getFeaturePermission } from "@/app/admin/actions";
import { canEdit } from "@/lib/admin-permissions";
import { getContent, saveContent } from "@/lib/content-store";
import type { Position } from "@/lib/content-types";

export async function updatePositions(
  jsonString: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("programming.positions");
  if (!canEdit(tier)) return { ok: false, error: "You don't have permission to edit positions." };

  let positions: Position[];
  try {
    positions = JSON.parse(jsonString) as Position[];
  } catch {
    return { ok: false, error: "Invalid JSON payload." };
  }

  try {
    const content = await getContent();
    await saveContent({ ...content, positions });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Failed to save positions:", msg, err);
    return { ok: false, error: `Save failed: ${msg}` };
  }
}
