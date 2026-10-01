import "server-only";
import crypto from "crypto";
import { cookies } from "next/headers";
import {
  getActiveDrive,
  listDrives,
  listDriveItems,
  listApplications,
} from "./drive-store";
import { getDriveSettings } from "./drive-settings";
import type { DriveWing, Drive } from "./drive-types";

/* ------------------------------------------------------------------ */
/*  The board's numbers                                                 */
/* ------------------------------------------------------------------ */

export interface WingTotals {
  /** Scanned at the Registration Desk — still in the hall or already served. */
  registered: number;
  /** Walked away with their copy (second scan done). */
  handedOver: number;
  /** Holds a reserved copy but hasn't been scanned in yet. */
  yetToArrive: number;
  /** registered + yetToArrive — every live ticket for this wing. */
  booked: number;
}

export interface BookRow {
  id: string;
  name: string;
  booked: number;
  given: number;
  left: number;
}

export interface SupervisorBoard {
  driveName: string;
  pickupLocation: string;
  wings: Record<DriveWing, WingTotals>;
  /** Both wings plus the unassigned tickets — the hall's real headcount. */
  overall: WingTotals;
  /** Tickets with no wing recorded yet. Counted in `overall` but in neither
   *  wing column, and surfaced on the board so an incomplete backfill can't
   *  be misread as a genuine Brothers/Sisters split. */
  unassigned: WingTotals;
  books: BookRow[];
  generatedAt: string;
}

function emptyTotals(): WingTotals {
  return { registered: 0, handedOver: 0, yetToArrive: 0, booked: 0 };
}

/**
 * Everything the projected Drive Day board shows, off one pass over the
 * active drive's applications.
 *
 * "Registered" deliberately includes picked-up tickets: the Registration
 * Desk did scan them, and a supervisor reading "Registered 40 / Handed over
 * 40" needs those to agree rather than watch the registered count drain as
 * books go out. Waitlisted records are excluded everywhere — they never held
 * a copy (see reserveBook, which now refuses an out-of-stock item).
 */
export async function getSupervisorBoard(): Promise<SupervisorBoard | null> {
  const active = await getActiveDrive();
  // An Advisor sometimes flips the drive to "completed" the moment the last
  // book goes out; falling back to the newest drive keeps the board readable
  // through the end of the day instead of blanking mid-queue.
  const drive: Drive | null = active ?? (await listDrives())[0] ?? null;
  if (!drive) return null;

  const [items, applications] = await Promise.all([
    listDriveItems(drive.id),
    listApplications(drive.id),
  ]);

  const wings: Record<DriveWing, WingTotals> = {
    male: emptyTotals(),
    female: emptyTotals(),
  };
  const unassigned = emptyTotals();
  const overall = emptyTotals();
  const givenByItem = new Map<string, number>();
  const bookedByItem = new Map<string, number>();

  for (const app of applications) {
    if (app.status === "waitlisted") continue;

    const buckets = [
      overall,
      app.applicantGender ? wings[app.applicantGender] : unassigned,
    ];
    for (const b of buckets) {
      b.booked += 1;
      if (app.status === "picked-up") {
        b.registered += 1;
        b.handedOver += 1;
      } else if (app.status === "checked-in") {
        b.registered += 1;
      } else {
        b.yetToArrive += 1;
      }
    }

    bookedByItem.set(app.itemId, (bookedByItem.get(app.itemId) ?? 0) + 1);
    if (app.status === "picked-up") {
      givenByItem.set(app.itemId, (givenByItem.get(app.itemId) ?? 0) + 1);
    }
  }

  const books: BookRow[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    booked: bookedByItem.get(item.id) ?? 0,
    given: givenByItem.get(item.id) ?? 0,
    left: item.remainingStock,
  }));

  return {
    driveName: drive.name,
    pickupLocation: drive.pickupLocation,
    wings,
    overall,
    unassigned,
    books,
    generatedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/*  PIN gate                                                            */
/* ------------------------------------------------------------------ */

const PIN_COOKIE = "aai_drive_board";
/** One Drive Day. A supervisor unlocks the board in the morning and the
 *  laptop stays on it until the hall closes. */
const PIN_MAX_AGE = 60 * 60 * 12;

/** The cookie carries a hash of the PIN, never the PIN, and the hash is
 *  peppered with the app secret so it can't be precomputed. Because the hash
 *  is PIN-derived, rotating the PIN in the Drive console silently logs every
 *  existing board out — which is the point of being able to rotate it. */
function pinToken(pin: string): string {
  const pepper =
    process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "aai-drive-board";
  return crypto.createHmac("sha256", pepper).update(pin.trim()).digest("hex");
}

function sameToken(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function supervisorPinIsSet(): Promise<boolean> {
  return Boolean((await getDriveSettings()).supervisorPin);
}

/** True when this browser has already entered the current PIN. A changed or
 *  cleared PIN makes every outstanding cookie fail here. */
export async function hasSupervisorPinCookie(): Promise<boolean> {
  const pin = (await getDriveSettings()).supervisorPin;
  if (!pin) return false;
  const cookie = (await cookies()).get(PIN_COOKIE)?.value;
  if (!cookie) return false;
  return sameToken(cookie, pinToken(pin));
}

export async function checkSupervisorPin(
  entered: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const pin = (await getDriveSettings()).supervisorPin;
  if (!pin) {
    return { ok: false, error: "The supervisor board is switched off." };
  }
  if (!sameToken(pinToken(entered), pinToken(pin))) {
    return { ok: false, error: "That PIN doesn't match. Try again." };
  }
  (await cookies()).set(PIN_COOKIE, pinToken(pin), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PIN_MAX_AGE,
  });
  return { ok: true };
}

export async function clearSupervisorPinCookie(): Promise<void> {
  (await cookies()).delete(PIN_COOKIE);
}
