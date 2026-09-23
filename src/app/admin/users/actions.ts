"use server";

import { revalidatePath } from "next/cache";
import { getAdminRole, currentAdminEmail } from "@/app/admin/actions";
import {
  addAdminUser,
  updateAdminUserRole,
  updateAdminUserPermissions,
  removeAdminUser,
} from "@/lib/admin-users-store";
import { ADMIN_ROLES, isValidFeature, isValidPermissionTier } from "@/lib/admin-permissions";
import type { AdminRole, AdminFeature, PermissionTier } from "@/lib/admin-types";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireOwner(): Promise<string | null> {
  const role = await getAdminRole();
  if (role !== "owner") return null;
  return currentAdminEmail();
}

function isValidRole(role: string): role is AdminRole {
  return (ADMIN_ROLES as string[]).includes(role);
}

export async function addAdminUserAction(formData: FormData): Promise<ActionResult> {
  const ownerEmail = await requireOwner();
  if (!ownerEmail) return { ok: false, error: "Only Owners can add admin users." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");

  if (!email || !email.includes("@")) return { ok: false, error: "Enter a valid email." };
  if (!isValidRole(role)) return { ok: false, error: "Choose a valid role." };

  try {
    await addAdminUser({ email, role, addedBy: ownerEmail });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Couldn't add that user." };
  }
}

export async function updateAdminUserRoleAction(
  id: string,
  role: string
): Promise<ActionResult> {
  const ownerEmail = await requireOwner();
  if (!ownerEmail) return { ok: false, error: "Only Owners can change roles." };
  if (!isValidRole(role)) return { ok: false, error: "Choose a valid role." };

  const updated = await updateAdminUserRole(id, role);
  if (!updated) return { ok: false, error: "That user no longer exists." };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateAdminUserPermissionsAction(
  id: string,
  overrides: Partial<Record<AdminFeature, PermissionTier>>
): Promise<ActionResult> {
  const ownerEmail = await requireOwner();
  if (!ownerEmail) return { ok: false, error: "Only Owners can change permissions." };

  for (const [feature, tier] of Object.entries(overrides)) {
    if (!isValidFeature(feature)) return { ok: false, error: "Invalid feature." };
    if (tier !== undefined && !isValidPermissionTier(tier)) {
      return { ok: false, error: "Invalid permission tier." };
    }
  }

  const updated = await updateAdminUserPermissions(id, overrides);
  if (!updated) return { ok: false, error: "That user no longer exists." };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function removeAdminUserAction(id: string): Promise<ActionResult> {
  const ownerEmail = await requireOwner();
  if (!ownerEmail) return { ok: false, error: "Only Owners can remove admin users." };

  const ok = await removeAdminUser(id);
  if (!ok) return { ok: false, error: "Couldn't remove that user." };
  revalidatePath("/admin/users");
  return { ok: true };
}
