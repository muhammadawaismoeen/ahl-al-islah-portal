"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/DeleteButton";
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
  return (
    <DeleteButton
      title="Delete this session?"
      description="All its activities are deleted along with it. This cannot be undone."
      successMessage="Session deleted."
      action={() => deleteSessionAction(sessionId)}
      redirectTo={redirectTo}
      label="Delete session"
      className="btn-ghost !py-1.5 !px-3 text-xs text-danger hover:text-danger-700"
    />
  );
}

export function DeleteActivityButton({
  sessionId,
  activityId,
}: {
  sessionId: string;
  activityId: string;
}) {
  return (
    <DeleteButton
      title="Remove this activity?"
      successMessage="Activity removed."
      action={() => removeActivityAction(sessionId, activityId)}
      iconOnly
      ariaLabel="Remove activity"
      className="btn-ghost !py-1 !px-2 text-[11px] text-danger hover:text-danger-700"
    />
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
