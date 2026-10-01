"use server";

import { revalidatePath } from "next/cache";
import { getFeaturePermission, currentAdminEmail } from "@/app/admin/actions";
import { canRead, canEdit, canDelete } from "@/lib/admin-permissions";
import {
  createDrive,
  updateDrive,
  deleteDrive,
  createDriveItem,
  updateDriveItemStock,
  deleteDriveItem,
  registerAtDesk,
  handOverAtDesk,
  searchApplicationsForDesk,
  confirmApplication,
  deleteApplication,
  reviewDonation,
  deleteDonation,
  getDriveItem,
  reviewAmbassador,
  deleteAmbassador,
  updateAmbassadorName,
  recordManualDonation,
  recordCashDonation,
} from "@/lib/drive-store";
import {
  setIhsanPercentage,
  addPaymentMethod,
  deletePaymentMethod,
} from "@/lib/drive-settings";
import type { DeskOutcome, DeskResult } from "@/lib/drive-store";
import type {
  ApplicationStatus,
  DriveStatus,
  PaymentMethodKind,
} from "@/lib/drive-types";

function refresh() {
  revalidatePath("/admin/drive");
  revalidatePath("/drive");
  revalidatePath("/drive/apply");
  revalidatePath("/drive/donate");
}

export async function createDriveAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.drives");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const name = ((formData.get("name") as string) ?? "").trim();
  const startDate = (formData.get("startDate") as string) ?? "";
  const endDate = (formData.get("endDate") as string) ?? "";
  const pickupDate = (formData.get("pickupDate") as string) ?? "";
  const goalAmount = Number(formData.get("goalAmount"));
  const pickupLocation = ((formData.get("pickupLocation") as string) ?? "").trim();
  const pickupNote = ((formData.get("pickupNote") as string) ?? "").trim() || undefined;

  if (name.length < 2) return { ok: false, error: "Please enter a drive name." };
  if (!startDate || !endDate) return { ok: false, error: "Please set both dates." };
  if (!pickupDate) return { ok: false, error: "Please set the Drive Day (pickup date)." };
  if (!Number.isFinite(goalAmount) || goalAmount < 0) {
    return { ok: false, error: "Please enter a valid goal amount." };
  }
  if (pickupLocation.length < 2) {
    return { ok: false, error: "Please enter a pickup location." };
  }

  await createDrive({ name, startDate, endDate, pickupDate, goalAmount, pickupLocation, pickupNote });
  refresh();
  return { ok: true };
}

export async function updateDriveDetailsAction(
  id: string,
  input: {
    name: string;
    startDate: string;
    endDate: string;
    pickupDate: string;
    pickupLocation: string;
    pickupNote?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.drives");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const name = input.name.trim();
  const pickupLocation = input.pickupLocation.trim();
  const pickupNote = input.pickupNote?.trim() || undefined;

  if (name.length < 2) return { ok: false, error: "Please enter a drive name." };
  if (!input.startDate || !input.endDate) return { ok: false, error: "Please set both dates." };
  if (!input.pickupDate) return { ok: false, error: "Please set the Drive Day (pickup date)." };
  if (pickupLocation.length < 2) {
    return { ok: false, error: "Please enter a pickup location." };
  }

  const updated = await updateDrive(id, {
    name,
    startDate: input.startDate,
    endDate: input.endDate,
    pickupDate: input.pickupDate,
    pickupLocation,
    pickupNote,
  });
  if (!updated) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function setDriveStatusAction(
  id: string,
  status: DriveStatus
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.drives");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const updated = await updateDrive(id, { status });
  if (!updated) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function setApplicationsOpenAction(
  id: string,
  applicationsOpen: boolean
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.drives");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const updated = await updateDrive(id, { applicationsOpen });
  if (!updated) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function updateDriveGoalAction(
  id: string,
  goalAmount: number
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.drives");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };
  if (!Number.isFinite(goalAmount) || goalAmount < 0) {
    return { ok: false, error: "Please enter a valid goal amount." };
  }

  const updated = await updateDrive(id, { goalAmount });
  if (!updated) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function deleteDriveAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.drives");
  if (!canDelete(tier)) return { ok: false, error: "Not authorized." };

  const ok = await deleteDrive(id);
  if (!ok) return { ok: false, error: "Drive not found." };
  refresh();
  return { ok: true };
}

export async function createDriveItemAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.catalog");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

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

/** `remainingStock` and `remainingDelta` are mutually exclusive and both
 *  optional: the console sends the first only when the Advisor edited the
 *  Left box by hand, and the second when Left is just following a change
 *  to Total. Sending neither (a per-student-limit tweak on its own) leaves
 *  the running count untouched instead of rewriting it from a stale page. */
export async function updateDriveItemAction(
  id: string,
  patch: {
    totalStock: number;
    perStudentLimit: number;
    remainingStock?: number;
    remainingDelta?: number;
  }
): Promise<{
  ok: boolean;
  error?: string;
  item?: { totalStock: number; remainingStock: number; perStudentLimit: number };
}> {
  const tier = await getFeaturePermission("drive.catalog");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  if (
    !Number.isInteger(patch.totalStock) ||
    !Number.isInteger(patch.perStudentLimit) ||
    patch.totalStock < 0 ||
    patch.perStudentLimit < 1 ||
    (patch.remainingStock !== undefined &&
      (!Number.isInteger(patch.remainingStock) || patch.remainingStock < 0)) ||
    (patch.remainingDelta !== undefined && !Number.isInteger(patch.remainingDelta))
  ) {
    return { ok: false, error: "Please enter valid numbers." };
  }

  const updated = await updateDriveItemStock(id, patch);
  if (!updated) return { ok: false, error: "Item not found." };
  refresh();
  return {
    ok: true,
    item: {
      totalStock: updated.totalStock,
      remainingStock: updated.remainingStock,
      perStudentLimit: updated.perStudentLimit,
    },
  };
}

export async function updateDriveItemNameAction(
  id: string,
  name: string
): Promise<{ ok: boolean; error?: string; name?: string }> {
  const tier = await getFeaturePermission("drive.catalog");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const trimmed = name.trim();
  if (trimmed.length < 2) return { ok: false, error: "Please enter an item name." };

  const updated = await updateDriveItemStock(id, { name: trimmed });
  if (!updated) return { ok: false, error: "Item not found." };
  refresh();
  return { ok: true, name: updated.name };
}

export async function deleteDriveItemAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.catalog");
  if (!canDelete(tier)) return { ok: false, error: "Not authorized." };

  const ok = await deleteDriveItem(id);
  if (!ok) return { ok: false, error: "Item not found." };
  refresh();
  return { ok: true };
}

/** What a desk scan reports back to the volunteer standing at the table.
 *  `outcome` is what the scanner turns into the "scan 1 of 2 / scan 2 of 2"
 *  line, so it is always present on success — the UI never has to guess
 *  which of the two scans just happened. */
export interface DeskScanResult {
  ok: boolean;
  error?: string;
  outcome?: DeskOutcome;
  applicantName?: string;
  itemName?: string;
  pickupCode?: string;
  /** ISO timestamp of the scan this outcome refers to: the check-in time for
   *  a registration outcome, the pickup time for a handover one. Lets the UI
   *  say "already registered at 11:04" instead of just "already registered". */
  at?: string;
}

async function describeDeskResult(
  result: DeskResult,
  at: string | undefined
): Promise<DeskScanResult> {
  const item = await getDriveItem(result.application.itemId);
  return {
    ok: true,
    outcome: result.outcome,
    applicantName: result.application.applicantName,
    itemName: item?.name ?? "item",
    pickupCode: result.application.pickupCode,
    at,
  };
}

/** Scan 1 of 2 — the Registration Desk. */
export async function registerAtDeskAction(code: string): Promise<DeskScanResult> {
  const tier = await getFeaturePermission("drive.checkin");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Please enter a pickup code." };

  const result = await registerAtDesk(normalized);
  if (!result.ok) return { ok: false, error: result.error };

  refresh();
  return describeDeskResult(result.result, result.result.application.checkedInAt);
}

/** Scan 2 of 2 — the Book Handover desk. */
export async function handOverAtDeskAction(code: string): Promise<DeskScanResult> {
  const tier = await getFeaturePermission("drive.handover");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const normalized = code.trim().toUpperCase();
  if (!normalized) return { ok: false, error: "Please enter a pickup code." };

  const result = await handOverAtDesk(normalized);
  if (!result.ok) return { ok: false, error: result.error };

  refresh();
  return describeDeskResult(result.result, result.result.application.pickedUpAt);
}

export interface DeskSearchHit {
  pickupCode: string;
  applicantName: string;
  applicantContact: string;
  itemName: string;
  status: ApplicationStatus;
}

/** Backs the name/phone fallback at both desks, for a QR that won't scan —
 *  a damaged screen, a flat battery, a student who left the ticket at home.
 *  Read access to the desk is enough: the volunteer still has to scan or
 *  pick a result to actually change anything. */
export async function searchApplicationsForDeskAction(
  query: string
): Promise<DeskSearchHit[]> {
  const [registration, handover] = await Promise.all([
    getFeaturePermission("drive.checkin"),
    getFeaturePermission("drive.handover"),
  ]);
  if (!canRead(registration) && !canRead(handover)) return [];

  const matches = await searchApplicationsForDesk(query);
  const items = await Promise.all(matches.map((a) => getDriveItem(a.itemId)));
  return matches.map((a, i) => ({
    pickupCode: a.pickupCode,
    applicantName: a.applicantName,
    applicantContact: a.applicantContact,
    itemName: items[i]?.name ?? "item",
    status: a.status,
  }));
}

export async function confirmApplicationAction(
  id: string,
  itemId?: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.applicants");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const result = await confirmApplication(id, itemId);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function deleteApplicationAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.applicants");
  if (!canDelete(tier)) return { ok: false, error: "Not authorized." };

  const result = await deleteApplication(id);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function reviewDonationAction(
  id: string,
  decision: "verified" | "rejected",
  correctedAmount?: number
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.donations");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const result = await reviewDonation(id, decision, "Admin", correctedAmount);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function deleteDonationAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.donations");
  if (!canDelete(tier)) return { ok: false, error: "Not authorized." };

  const result = await deleteDonation(id);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function reviewAmbassadorAction(
  id: string,
  decision: "approved" | "rejected"
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.ambassadors");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const result = await reviewAmbassador(id, decision, "Admin");
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function deleteAmbassadorAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.ambassadors");
  if (!canDelete(tier)) return { ok: false, error: "Not authorized." };

  const ok = await deleteAmbassador(id);
  if (!ok) return { ok: false, error: "Registration not found." };
  refresh();
  return { ok: true };
}

export async function updateAmbassadorNameAction(
  id: string,
  name: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.ambassadors");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const result = await updateAmbassadorName(id, name);
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function recordManualDonationAction(
  ambassadorId: string,
  amount: number,
  donorName?: string,
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.ambassadors");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const result = await recordManualDonation({
    ambassadorId,
    amount,
    donorName: donorName?.trim() || null,
    note: note?.trim() || null,
    reviewedBy: "Admin",
  });
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function recordCashDonationAction(
  driveId: string | null,
  amount: number,
  donorName?: string,
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.donations");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const reviewedBy = (await currentAdminEmail()) ?? "Admin";
  const result = await recordCashDonation({
    driveId,
    amount,
    donorName: donorName?.trim() || null,
    note: note?.trim() || null,
    reviewedBy,
  });
  if (!result.ok) return { ok: false, error: result.error };
  refresh();
  return { ok: true };
}

export async function setIhsanPercentageAction(
  value: number
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.payments");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };
  if (!Number.isFinite(value) || value < 0) {
    return { ok: false, error: "Please enter a valid percentage." };
  }

  await setIhsanPercentage(value);
  refresh();
  return { ok: true };
}

export async function addPaymentMethodAction(
  formData: FormData
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.payments");
  if (!canEdit(tier)) return { ok: false, error: "Not authorized." };

  const kind = ((formData.get("kind") as string) ?? "bank") as PaymentMethodKind;
  const label = ((formData.get("label") as string) ?? "").trim();
  const accountTitle = ((formData.get("accountTitle") as string) ?? "").trim();
  const accountNumber = ((formData.get("accountNumber") as string) ?? "").trim();
  const iban = ((formData.get("iban") as string) ?? "").trim() || undefined;
  const branch = ((formData.get("branch") as string) ?? "").trim() || undefined;
  const instructions = ((formData.get("instructions") as string) ?? "").trim() || undefined;

  if (kind !== "bank" && kind !== "wallet") {
    return { ok: false, error: "Please choose a valid method type." };
  }
  if (label.length < 2) return { ok: false, error: "Please enter a label." };
  if (accountTitle.length < 2) return { ok: false, error: "Please enter an account title." };
  if (accountNumber.length < 2) return { ok: false, error: "Please enter an account number." };

  await addPaymentMethod({ kind, label, accountTitle, accountNumber, iban, branch, instructions });
  refresh();
  return { ok: true };
}

export async function deletePaymentMethodAction(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  const tier = await getFeaturePermission("drive.payments");
  if (!canDelete(tier)) return { ok: false, error: "Not authorized." };

  await deletePaymentMethod(id);
  refresh();
  return { ok: true };
}
