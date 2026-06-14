"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  deleteSessionAction,
  removeActivityAction,
  seedIdentityPillarsActivity,
} from "./actions";

export function DeleteSessionButton({
  sessionId,
  redirectTo,
}: {
  sessionId: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    if (
      !confirm(
        "Delete this session and all its activities? This cannot be undone."
      )
    )
      return;
    setPending(true);
    const res = await deleteSessionAction(sessionId);
    setPending(false);
    if (!res.ok) {
      toast.error("Failed to delete.");
      return;
    }
    toast.success("Session deleted.");
    if (redirectTo) router.push(redirectTo);
    else router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs text-red-500 hover:text-red-700"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Delete session
    </button>
  );
}

export function DeleteActivityButton({
  sessionId,
  activityId,
}: {
  sessionId: string;
  activityId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    if (!confirm("Remove this activity?")) return;
    setPending(true);
    const res = await removeActivityAction(sessionId, activityId);
    setPending(false);
    if (!res.ok) {
      toast.error("Failed to remove.");
      return;
    }
    toast.success("Activity removed.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1 !px-2 text-[11px] text-red-500 hover:text-red-700"
      title="Remove activity"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
    </button>
  );
}

export function SeedIdentityPillarsButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    const res = await seedIdentityPillarsActivity();
    setPending(false);
    if (!res.ok) {
      toast.error(res.error ?? "Failed to seed.");
      return;
    }
    toast.success("Demo session created.");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-primary inline-flex"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      Seed Ibrahim session + Identity Pillars activity
    </button>
  );
}
