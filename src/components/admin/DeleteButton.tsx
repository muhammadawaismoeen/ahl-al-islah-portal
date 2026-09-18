"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "./ConfirmDialog";

export function DeleteButton({
  title,
  description,
  confirmLabel = "Delete",
  successMessage = "Deleted.",
  action,
  redirectTo,
  iconOnly = false,
  label = "Delete",
  ariaLabel,
  className,
}: {
  title: string;
  description?: string;
  confirmLabel?: string;
  successMessage?: string;
  action: () => Promise<{ ok: boolean; error?: string }>;
  redirectTo?: string;
  iconOnly?: boolean;
  label?: string;
  ariaLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    const res = await action();
    setPending(false);
    setOpen(false);
    if (res.ok) {
      toast.success(successMessage);
      if (redirectTo) router.push(redirectTo);
      else router.refresh();
    } else {
      toast.error(res.error ?? "Failed to delete.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-label={ariaLabel ?? (iconOnly ? label : undefined)}
        className={
          className ??
          `btn-ghost !py-1.5 ${iconOnly ? "!px-2.5" : "!px-3"} text-xs text-danger hover:text-danger-700`
        }
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Trash2 className="h-3.5 w-3.5" />
        )}
        {!iconOnly && label}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        pending={pending}
        onConfirm={handleConfirm}
        onCancel={() => !pending && setOpen(false)}
      />
    </>
  );
}
