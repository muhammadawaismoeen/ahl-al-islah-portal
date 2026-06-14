"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Lock } from "lucide-react";

interface Props {
  sessionId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM, 24h, treated as PKT
  offsetMinutes?: number;
  activityHref?: string;
}

/**
 * Live-countdown button next to "Join the session".
 * Stays locked until session.startTime + offsetMinutes (PKT, UTC+5).
 * Once unlocked, becomes a link to the Identity Pillars activity.
 *
 * PKT is UTC+5 with no DST, so we construct the unlock instant by
 * appending the "+05:00" offset to the date+time the admin entered.
 */
export function ClassActivityButton({
  sessionId,
  date,
  startTime,
  offsetMinutes = 40,
  activityHref,
}: Props) {
  const href = activityHref ?? `/activity/identity-pillars?session=${sessionId}`;

  // Compute target unlock timestamp once. If the input is malformed,
  // unlockAt will be NaN and we'll hide the button entirely.
  const unlockAt = (() => {
    const iso = `${date}T${startTime}:00+05:00`;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return NaN;
    return t + offsetMinutes * 60 * 1000;
  })();

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(unlockAt)) return;
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [unlockAt]);

  if (!Number.isFinite(unlockAt)) return null;

  // Server render and first paint: show locked state with no countdown text
  // (avoids hydration mismatch since "now" depends on the client clock).
  if (now === null) {
    return (
      <button
        type="button"
        disabled
        className="btn-secondary inline-flex cursor-not-allowed opacity-70"
      >
        <Lock className="h-4 w-4" />
        Class activity locked
      </button>
    );
  }

  const remainingMs = unlockAt - now;
  const unlocked = remainingMs <= 0;

  if (unlocked) {
    return (
      <Link href={href} className="btn-secondary inline-flex">
        <ClipboardList className="h-4 w-4" />
        Open the class activity
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled
      className="btn-secondary inline-flex cursor-not-allowed opacity-70"
      aria-live="polite"
    >
      <Lock className="h-4 w-4" />
      Activity opens in {formatCountdown(remainingMs)}
    </button>
  );
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}
