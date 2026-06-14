"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { markSubmissionRead, removeSubmission } from "./actions";
import { toast } from "sonner";

export function DeleteSubmissionButton({ submissionId }: { submissionId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this audit submission permanently?")) return;
    setPending(true);
    const res = await removeSubmission(submissionId);
    setPending(false);
    if (!res.ok) toast.error("Failed to delete.");
    else toast.success("Submission deleted.");
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs text-red-500 hover:text-red-700"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Delete
    </button>
  );
}

export function MarkSubmissionReadButton({
  submissionId,
}: {
  submissionId: string;
}) {
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    await markSubmissionRead(submissionId);
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      Mark as read
    </button>
  );
}
