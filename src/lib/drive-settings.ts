import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { isRedisStore, setDoc, getDoc } from "./redis";
import type { DriveSettings, PaymentMethod, PaymentMethodKind } from "./drive-types";
import { DEFAULT_IHSAN_PERCENTAGE } from "./drive-config";

const SETTINGS_FILE = path.join(process.cwd(), "data", "drive", "settings.json");
const COLLECTION = "drive-settings";
const DOC_ID = "config";
const SETTINGS_TAG = "drive-settings";

/** Seeded from the previously hardcoded BANK_TRANSFER_DETAILS so existing
 *  donors keep seeing a working bank card until an admin edits it. */
const DEFAULT_SETTINGS: DriveSettings = {
  ihsanPercentage: DEFAULT_IHSAN_PERCENTAGE,
  paymentMethods: [
    {
      id: "pm-default",
      kind: "bank",
      label: "Meezan Bank",
      accountTitle: "Ahl Al-Islah — Rijal Al-Huda",
      accountNumber: "0123-4567891-01",
      iban: "PK00MEZN0001234567891",
      branch: "Main Branch",
      createdAt: new Date(0).toISOString(),
    },
  ],
};

function genId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
}

async function readSettings(): Promise<DriveSettings> {
  try {
    if (isRedisStore()) {
      const stored = await getDoc<Partial<DriveSettings>>(COLLECTION, DOC_ID);
      if (!stored) return DEFAULT_SETTINGS;
      return mergeWithDefaults(stored);
    }
    const raw = await fs.readFile(SETTINGS_FILE, "utf8");
    return mergeWithDefaults(JSON.parse(raw) as Partial<DriveSettings>);
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const getCachedSettings = unstable_cache(readSettings, ["drive-settings"], {
  tags: [SETTINGS_TAG],
  revalidate: false,
});

export async function getDriveSettings(): Promise<DriveSettings> {
  return getCachedSettings();
}

async function writeSettings(settings: DriveSettings): Promise<void> {
  if (isRedisStore()) {
    await setDoc(COLLECTION, DOC_ID, settings);
  } else {
    await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf8");
  }
  revalidateTag(SETTINGS_TAG);
}

export async function setIhsanPercentage(value: number): Promise<DriveSettings> {
  const current = await getDriveSettings();
  const updated: DriveSettings = { ...current, ihsanPercentage: value };
  await writeSettings(updated);
  return updated;
}

export async function addPaymentMethod(input: {
  kind: PaymentMethodKind;
  label: string;
  accountTitle: string;
  accountNumber: string;
  iban?: string;
  branch?: string;
  instructions?: string;
}): Promise<DriveSettings> {
  const current = await getDriveSettings();
  const method: PaymentMethod = {
    id: genId("pm"),
    kind: input.kind,
    label: input.label,
    accountTitle: input.accountTitle,
    accountNumber: input.accountNumber,
    iban: input.iban,
    branch: input.branch,
    instructions: input.instructions,
    createdAt: new Date().toISOString(),
  };
  const updated: DriveSettings = {
    ...current,
    paymentMethods: [...current.paymentMethods, method],
  };
  await writeSettings(updated);
  return updated;
}

export async function deletePaymentMethod(id: string): Promise<DriveSettings> {
  const current = await getDriveSettings();
  const updated: DriveSettings = {
    ...current,
    paymentMethods: current.paymentMethods.filter((m) => m.id !== id),
  };
  await writeSettings(updated);
  return updated;
}

function mergeWithDefaults(stored: Partial<DriveSettings>): DriveSettings {
  return {
    ihsanPercentage:
      typeof stored.ihsanPercentage === "number"
        ? stored.ihsanPercentage
        : DEFAULT_SETTINGS.ihsanPercentage,
    paymentMethods: Array.isArray(stored.paymentMethods)
      ? stored.paymentMethods
      : DEFAULT_SETTINGS.paymentMethods,
  };
}

export { computeSuggestedTarget } from "./drive-calc";
