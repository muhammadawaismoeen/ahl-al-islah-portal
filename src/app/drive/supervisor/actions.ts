"use server";

import { checkSupervisorPin } from "@/lib/drive-supervisor";

export async function unlockSupervisorBoardAction(
  pin: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await checkSupervisorPin(pin);
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
