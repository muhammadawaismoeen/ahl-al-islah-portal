import { cookies } from "next/headers";
import { DRIVE_DEVICE_COOKIE } from "./drive-types";

/**
 * Device-recognition cookie for the Drive module. This portal has no
 * individual student login (see counsel's claim-code cookie for the same
 * pattern) — instead, every application/donation submitted from a device is
 * remembered here so /drive/me can show "your" records without an account.
 * Ids are plain application/donation ids, not secrets: nothing sensitive is
 * exposed by an id alone, and each record additionally has its own
 * plaintext pickup/reference code for cross-device recovery.
 */
interface DriveDeviceRecord {
  applications: string[];
  donations: string[];
}

const MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function getDriveDeviceIds(): Promise<DriveDeviceRecord> {
  const raw = (await cookies()).get(DRIVE_DEVICE_COOKIE)?.value;
  if (!raw) return { applications: [], donations: [] };
  try {
    const parsed = JSON.parse(raw) as Partial<DriveDeviceRecord>;
    return {
      applications: Array.isArray(parsed.applications) ? parsed.applications : [],
      donations: Array.isArray(parsed.donations) ? parsed.donations : [],
    };
  } catch {
    return { applications: [], donations: [] };
  }
}

/** Server-action-only: adds an id to the device cookie. */
export async function addDriveDeviceId(
  kind: keyof DriveDeviceRecord,
  id: string
): Promise<void> {
  const current = await getDriveDeviceIds();
  if (!current[kind].includes(id)) current[kind].push(id);
  (await cookies()).set(DRIVE_DEVICE_COOKIE, JSON.stringify(current), COOKIE_OPTS);
}
