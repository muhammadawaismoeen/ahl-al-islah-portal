"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";

interface SessionOption {
  id: string;
  title: string;
  date: string;
  count: number;
}

export function SessionFilter({
  sessions,
  legacyCount,
  totalCount,
  selected,
}: {
  sessions: SessionOption[];
  legacyCount: number;
  totalCount: number;
  selected?: string;
}) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (!value) {
      router.push("/admin/feedback");
    } else {
      router.push(`/admin/feedback?session=${value}`);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-ink/60">Session:</label>
      <select
        value={selected ?? ""}
        onChange={handleChange}
        className="text-sm px-3 py-2 rounded-lg border border-cream-muted bg-white focus:outline-none focus:ring-2 focus:ring-emerald-deep/30 focus:border-emerald-deep transition"
      >
        <option value="">All sessions ({totalCount})</option>
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {formatDate(s.date)} — {s.title} ({s.count})
          </option>
        ))}
        {legacyCount > 0 && (
          <option value="legacy">Pre-session-selector ({legacyCount})</option>
        )}
      </select>
    </div>
  );
}
