"use server";

import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/app/admin/actions";
import {
  createDrive,
  updateDrive,
  createDriveItem,
  updateDriveItemStock,
  checkInApplication,
  confirmApplication,
  reviewDonation,
  getDriveItem,
} from "@/lib/drive-store";
import type { DriveStatus } from "@/lib/drive-types";

function refresh() {
  revalidatePath("/admin/drive");
  revalidatePath("/drive");
  revalidatePath("/drive/apply");
  revalidatePath("/drive/donate");
}

export async function createDriveAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  const name = ((formData.get("name") as string) ?? "").trim();
  const startDate = (formData.get("startDate") as string) ?? "";
  const endDate = (formData.get("endDate") as string) ?? "";
  const goalAmount = Number(formData.get("goalAmount"));
  const pickupLocation = ((formData.get("pickupLocation") as string) ?? "").trim();
  const pickupNote = ((formData.get("pickupNote") as string) ?? "").trim() || undefined;

  if (name.length < 2) return { ok: false, error: "Please enter a drive name." };
  if (!startDate || !endDate) return { ok: false, error: "Please set both dates." };
  if (!Number.isFinite(goalAmount) || goalAmount < 0) {
    return { ok: false, error: "Please enter a valid goal amount." };
  }
  if (pickupLocation.length < 2) {
    return { ok: false, error: "Please enter a pickup location." };
  }

  await createDrive({ name, startDate, endDate, goalAmount, pickupLocation, pickupNote });
  refresh();
  return { ok: true };
}

export async function setDriveStatusAction(
  id: string,
  status: DriveStatus
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  const updated = await updateDrive(id, { status });
  if (!updated) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function updateDriveGoalAction(
  id: string,
  goalAmount: number
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };
  if (!Number.isFinite(goalAmount) || goalAmount < 0) {
    return { ok: false, error: "Please enter a valid goal amount." };
  }

  const updated = await updateDrive(id, { goalAmount });
  if (!updated) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function createDriveItemAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  const driveId = (formData.get("driveId") as string) ?? "";
  const name = ((formData.get("name") as string) ?? "").trim();
  const totalStock = Number(formData.get("totalStock"));
  const perStudentLimit = Number(formData.get("perStudentLimit"));

  if (!driveId) return { ok: false, error: "Please choose a drive." };
  if (name.length < 2) return { ok: false, error: "Please enter an item name." };
  if (!Number.isInteger(totalStock) || totalStock < 0) {
    return { ok: false, error: "Please enter a valid stock count." };
  }
  if (!Number.isInteger(perStudentLimit) || perStudentLimit < 1) {
    return { ok: false, error: "Please enter a valid per-student limit." };
  }

  await createDriveItem({ driveId, name, totalStock, perStudentLimit });
  refresh();
  return { ok: true };
}

export async function updateDriveItemAction(
  id: string,
  patch: { totalStock: number; remainingStock: number; perStudentLimit: number }
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  if (
    !Number.isInteger(patch.totalStock) ||
    !Number.isInteger(patch.remainingStock) ||
    !Number.isInteger(patch.perStudentLimit) ||
    patch.totalStock < 0 ||
    patch.remainingStock < 0 ||
    patch.perStudentLimit < 1
  ) {
    return { ok: false, error: "Please enter valid numbers." };
  }

  const updated = await updateDriveItemStock(id, patch);
  if (!updated) return { ok: false, error: "Item not found." };
  refresh();
  return { ok: true };
}

export async function checkInByCodeAction(
  code: string
): Promise<{ ok: boolean; error?: string; applicantName?: string; itemName?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Please enter a pickup code." };

  const result = await checkInApplication(normalized);
  if (!result.ok) return { ok: false, error: result.error };

  const item = await getDriveItem(result.application.itemId);
  refresh();
  return {
    ok: true,
    applicantName: result.application.applicantName,
    itemName: item?.name ?? "item",
  };
}

export async function confirmApplicationAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  const result = await confirmApplication(id);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function reviewDonationAction(
  id: string,
  decision: "verified" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  const authed = await isAuthenticated();
  if (!authed) return { ok: false, error: "Not authenticated." };

  const result = await reviewDonation(id, decision, "Admin");
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}
