import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredSubmission {
  id: string;
  positionSlug: string;
  positionTitle: string;
  wing: string;
  submittedAt: string;
  ip?: string;
  data: Record<string, unknown>;
}

const DATA_DIR = path.join(process.cwd(), "data", "submissions");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function saveSubmission(
  input: Omit<StoredSubmission, "id" | "submittedAt">
): Promise<StoredSubmission> {
  await ensureDir();
  const id = `${Date.now().toString(36)}-${crypto.randomBytes(4).toString("hex")}`;
  const record: StoredSubmission = {
    id,
    submittedAt: new Date().toISOString(),
    ...input,
  };
  const file = path.join(DATA_DIR, `${id}.json`);
  await fs.writeFile(file, JSON.stringify(record, null, 2), "utf8");
  return record;
}

export async function listSubmissions(): Promise<StoredSubmission[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const records = await Promise.all(
    jsonFiles.map(async (f) => {
      try {
        const raw = await fs.readFile(path.join(DATA_DIR, f), "utf8");
        return JSON.parse(raw) as StoredSubmission;
      } catch {
        return null;
      }
    })
  );
  return records
    .filter((r): r is StoredSubmission => r !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export async function getSubmission(
  id: string
): Promise<StoredSubmission | null> {
  await ensureDir();
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${id}.json`), "utf8");
    return JSON.parse(raw) as StoredSubmission;
  } catch {
    return null;
  }
}
