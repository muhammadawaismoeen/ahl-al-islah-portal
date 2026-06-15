"use client";

import { useEffect, useState } from "react";
import { Video, CircleDot } from "lucide-react";

interface Props {
  meetingLink: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM 24h PKT
  endTime?: string; // HH:MM 24h PKT
  className?: string;
}

/**
 * "Join the session" button with live countdown until startTime (PKT, UTC+5).
 * Pre-start: shows countdown on the button label, link remains clickable so
 * attendees can confirm the meeting opens.
 * In window (start..end): "Join now — live".
 * After end: disabled "Session ended".
 */
export function JoinSessionButton({
  meetingLink,
  date,
  startTime,
  endTime,
  className = "",
}: Props) {
  const startAt = (() => {
    if (!startTime) return NaN;
    const t = new Date(`${date}T${startTime}:00+05:00`).getTime();
    return Number.isFinite(t) ? t : NaN;
  })();

  const endAt = (() => {
    if (!endTime) return NaN;
    const t = new Date(`${date}T${endTime}:00+05:00`).getTime();
    return Number.isFinite(t) ? t : NaN;
  })();

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const baseClass = `btn-primary inline-flex ${className}`.trim();
  const disabledClass = `btn-secondary inline-flex cursor-not-allowed opacity-60 ${className}`.trim();

  // Server / first paint: neutral label to avoid hydration mismatch.
  if (now === null || !Number.isFinite(startAt)) {
    return (
      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
      >
        <Video className="h-4 w-4" />
        Join the session
      </a>
    );
  }

  if (Number.isFinite(endAt) && now > endAt) {
    return (
      <button type="button" disabled className={disabledClass}>
        <Video className="h-4 w-4" />
        Session ended
      </button>
    );
  }

  if (now >= startAt) {
    return (
      <a
        href={meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        aria-live="polite"
      >
        <CircleDot className="h-4 w-4 animate-pulse" />
        Join now — live
      </a>
    );
  }

  const remainingMs = startAt - now;
  return (
    <a
      href={meetingLink}
      target="_blank"
      rel="noopener noreferrer"
      className={baseClass}
      aria-live="polite"
    >
      <Video className="h-4 w-4" />
      Join the session · starts in {formatCountdown(remainingMs)}
    </a>
  );
}

function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");

  if (days > 0) {
    return `${days}d ${hours}h ${pad(minutes)}m`;
  }
  if (hours > 0) {
    return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${pad(seconds)}s`;
  }
  return `${seconds}s`;
}
