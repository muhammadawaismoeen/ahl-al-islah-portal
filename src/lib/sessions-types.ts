/**
 * Session & Activity types — safe to import from client components.
 * All I/O lives in sessions-store.ts (server-only).
 *
 * A Session is one Ahl Al-Islah gathering or workshop.
 * Each Session contains an ordered list of Activities — discrete
 * moments inside that gathering (an exercise, a reflection, a discussion).
 *
 * Activity bodies may contain "stage directions" wrapped in square brackets,
 * e.g. "[4 minutes of writing time — hold silence]". These are speaker cues
 * for the Advisor and are rendered in a distinct italic-gray style on the
 * public page (see ActivityBody.tsx).
 */

export interface Activity {
  id: string;
  title: string;
  timeMarker?: string; // e.g. "1:05"
  durationMin?: number; // e.g. 15
  body: string;
  createdAt: string;
}

export interface Session {
  id: string;
  slug: string;
  title: string;
  arabicTitle?: string;
  date: string; // ISO date YYYY-MM-DD
  description?: string;
  // Optional schedule + join link. Times are HH:MM, 24h, treated as PKT
  // (the org runs in Pakistan); the public UI labels them with PKT.
  startTime?: string;
  endTime?: string;
  meetingLink?: string;
  activities: Activity[];
  createdAt: string;
  updatedAt: string;
}
