"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Plus, Award, Landmark, Wallet, Pencil, HandCoins } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import type { Ambassador, PaymentMethod } from "@/lib/drive-types";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { DeleteButton } from "@/components/admin/DeleteButton";
import {
  reviewAmbassadorAction,
  deleteAmbassadorAction,
  updateAmbassadorNameAction,
  recordManualDonationAction,
  setIhsanPercentageAction,
  addPaymentMethodAction,
  deletePaymentMethodAction,
} from "./actions";

const AMB_STATUS_STYLE: Record<Ambassador["status"], string> = {
  pending: "bg-amber/15 text-amber",
  approved: "bg-emerald-deep/15 text-emerald-deep",
  rejected: "bg-danger-100 text-danger-700",
};

export function AmbassadorReviewButtons({ ambassadorId }: { ambassadorId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"approved" | "rejected" | null>(null);
  const [confirmingReject, setConfirmingReject] = useState(false);

  async function handle(decision: "approved" | "rejected") {
    setPending(decision);
    const res = await reviewAmbassadorAction(ambassadorId, decision);
    setPending(null);
    setConfirmingReject(false);
    if (res.ok) {
      toast.success(decision === "approved" ? "Ambassador approved." : "Registration rejected.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to review registration.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handle("approved")}
        disabled={pending !== null}
        className="btn-ghost !py-1.5 !px-3 text-xs text-emerald-deep"
      >
        {pending === "approved" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button
        type="button"
        onClick={() => setConfirmingReject(true)}
        disabled={pending !== null}
        className="btn-ghost !py-1.5 !px-3 text-xs text-danger hover:text-danger-700"
      >
        {pending === "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </button>
      <ConfirmDialog
        open={confirmingReject}
        title="Reject this Ambassador registration?"
        confirmLabel="Reject"
        pending={pending === "rejected"}
        onConfirm={() => handle("rejected")}
        onCancel={() => setConfirmingReject(false)}
      />
    </div>
  );
}

export function AmbassadorsPanel({
  ambassadors,
  driveNameById,
}: {
  ambassadors: Ambassador[];
  driveNameById: Record<string, string>;
}) {
  if (ambassadors.length === 0) {
    return (
      <div className="ornate-card p-10 text-center">
        <p className="text-sm text-ink/60">No Ambassador registrations yet.</p>
      </div>
    );
  }

  return (
    <div className="ornate-card p-2">
      <ul className="divide-y divide-border">
        {ambassadors.map((a) => (
          <AmbassadorRow key={a.id} ambassador={a} driveName={driveNameById[a.driveId] ?? "Drive"} />
        ))}
      </ul>
    </div>
  );
}

function AmbassadorRow({ ambassador: a, driveName }: { ambassador: Ambassador; driveName: string }) {
  const router = useRouter();
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(a.name);
  const [savingName, setSavingName] = useState(false);

  const [addingDonation, setAddingDonation] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationNote, setDonationNote] = useState("");
  const [savingDonation, setSavingDonation] = useState(false);

  async function saveName() {
    if (nameValue.trim() === a.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const res = await updateAmbassadorNameAction(a.id, nameValue);
    setSavingName(false);
    if (res.ok) {
      toast.success("Name updated.");
      setEditingName(false);
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update name.");
    }
  }

  async function saveDonation() {
    const amount = Number(donationAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setSavingDonation(true);
    const res = await recordManualDonationAction(a.id, amount, undefined, donationNote || undefined);
    setSavingDonation(false);
    if (res.ok) {
      toast.success(`${DRIVE_CURRENCY} ${amount.toLocaleString()} donation recorded.`);
      setAddingDonation(false);
      setDonationAmount("");
      setDonationNote("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to record donation.");
    }
  }

  return (
    <li className="p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        {editingName ? (
          <div className="flex items-center gap-2 mb-1">
            <input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="input-field !py-1 text-sm max-w-xs"
              autoFocus
            />
            <button
              type="button"
              onClick={saveName}
              disabled={savingName}
              className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep"
            >
              {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setNameValue(a.name);
                setEditingName(false);
              }}
              disabled={savingName}
              className="btn-ghost !py-1 !px-2.5 text-xs text-danger"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="font-medium text-sm text-ink flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-emerald-deep shrink-0" />
            {a.name}
            {a.isIhsanLevel && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber/15 text-amber">
                Ihsan-level
              </span>
            )}
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-ink/30 hover:text-emerald-deep transition"
              aria-label={`Edit ${a.name}'s name`}
            >
              <Pencil className="h-3 w-3" />
            </button>
          </p>
        )}
        <p className="text-xs text-ink/50 mt-0.5">
          {a.email} · {driveName}
        </p>
        <p className="text-[11px] text-ink/40 mt-0.5">
          Target {DRIVE_CURRENCY} {a.chosenTarget.toLocaleString()} · Raised{" "}
          {DRIVE_CURRENCY} {a.raisedAmount.toLocaleString()} · Registered {formatDate(a.createdAt)}
          {a.certificateIssuedAt && " · Certificate issued"}
        </p>
        {addingDonation && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <input
              type="number"
              min={1}
              placeholder="Amount"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="input-field !py-1 text-sm w-28"
              autoFocus
            />
            <input
              placeholder="Note (optional)"
              value={donationNote}
              onChange={(e) => setDonationNote(e.target.value)}
              className="input-field !py-1 text-sm w-40"
            />
            <button
              type="button"
              onClick={saveDonation}
              disabled={savingDonation}
              className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep"
            >
              {savingDonation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setAddingDonation(false);
                setDonationAmount("");
                setDonationNote("");
              }}
              disabled={savingDonation}
              className="btn-ghost !py-1 !px-2.5 text-xs text-danger"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${AMB_STATUS_STYLE[a.status]}`}>
          {a.status}
        </span>
        {a.status === "approved" && !addingDonation && (
          <button
            type="button"
            onClick={() => setAddingDonation(true)}
            className="btn-ghost !py-1.5 !px-2.5 text-xs text-emerald-deep"
          >
            <HandCoins className="h-3.5 w-3.5" />
            Add donation
          </button>
        )}
        {a.status === "pending" && <AmbassadorReviewButtons ambassadorId={a.id} />}
        {a.status !== "pending" && (
          <DeleteButton
            title={`Delete ${a.name}'s registration?`}
            description="This removes the Ambassador registration record. This cannot be undone."
            successMessage="Registration deleted."
            action={() => deleteAmbassadorAction(a.id)}
            iconOnly
            ariaLabel={`Delete ${a.name}'s registration`}
            className="btn-ghost !py-1.5 !px-2.5 text-xs text-danger hover:text-danger-700"
          />
        )}
      </div>
    </li>
  );
}

export function IhsanPercentageForm({ ihsanPercentage }: { ihsanPercentage: number }) {
  const router = useRouter();
  const [value, setValue] = useState(String(ihsanPercentage));
  const [pending, setPending] = useState(false);

  async function handle() {
    const parsed = Number(value);
    setPending(true);
    const res = await setIhsanPercentageAction(parsed);
    setPending(false);
    if (res.ok) {
      toast.success("Ihsan percentage updated.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update.");
    }
  }

  return (
    <div className="ornate-card p-5 sm:p-6">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-3">
        Ihsan-level suggestion
      </p>
      <p className="text-sm text-ink/65 mb-4">
        When an Ambassador types their own target, the portal suggests a
        higher &quot;Ihsan-level&quot; target this percentage above it.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="input-field !py-1.5 text-sm w-24"
        />
        <span className="text-sm text-ink/60">%</span>
        <button type="button" onClick={handle} disabled={pending} className="btn-ghost !py-1.5 !px-3 text-xs ml-2">
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save
        </button>
      </div>
    </div>
  );
}

export function AddPaymentMethodForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPaymentMethodAction(formData);
      if (res.ok) {
        toast.success("Payment method added.");
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(res.error ?? "Couldn't add the payment method.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="ornate-card p-5 sm:p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
        New payment method
      </p>
      <div>
        <label htmlFor="kind" className="label-field">Type</label>
        <select id="kind" name="kind" className="input-field" defaultValue="bank">
          <option value="bank">Bank transfer</option>
          <option value="wallet">Mobile wallet</option>
        </select>
      </div>
      <div>
        <label htmlFor="label" className="label-field">Label</label>
        <input id="label" name="label" required className="input-field" placeholder="Meezan Bank / JazzCash" />
      </div>
      <div>
        <label htmlFor="accountTitle" className="label-field">Account title</label>
        <input id="accountTitle" name="accountTitle" required className="input-field" />
      </div>
      <div>
        <label htmlFor="accountNumber" className="label-field">Account / wallet number</label>
        <input id="accountNumber" name="accountNumber" required className="input-field" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="iban" className="label-field">IBAN (optional)</label>
          <input id="iban" name="iban" className="input-field" />
        </div>
        <div>
          <label htmlFor="branch" className="label-field">Branch (optional)</label>
          <input id="branch" name="branch" className="input-field" />
        </div>
      </div>
      <div>
        <label htmlFor="instructions" className="label-field">Extra instructions (optional)</label>
        <input id="instructions" name="instructions" className="input-field" />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add method
      </button>
    </form>
  );
}

export function PaymentMethodsList({ methods }: { methods: PaymentMethod[] }) {
  if (methods.length === 0) {
    return (
      <div className="ornate-card p-10 text-center">
        <p className="text-sm text-ink/60">No payment methods configured yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {methods.map((m) => (
        <div key={m.id} className="ornate-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm text-ink flex items-center gap-1.5">
                {m.kind === "bank" ? (
                  <Landmark className="h-3.5 w-3.5 text-emerald-deep" />
                ) : (
                  <Wallet className="h-3.5 w-3.5 text-emerald-deep" />
                )}
                {m.label}
              </p>
              <p className="text-xs text-ink/50 mt-0.5">{m.accountTitle}</p>
              <p className="text-xs text-ink/70 font-mono mt-1">{m.accountNumber}</p>
              {m.iban && <p className="text-xs text-ink/70 font-mono">{m.iban}</p>}
              {m.branch && <p className="text-[11px] text-ink/40 mt-0.5">{m.branch}</p>}
              {m.instructions && <p className="text-[11px] text-ink/50 mt-1">{m.instructions}</p>}
            </div>
            <DeleteButton
              title="Remove this payment method?"
              description={`"${m.label}" will no longer be shown to donors.`}
              confirmLabel="Remove"
              successMessage="Payment method removed."
              action={() => deletePaymentMethodAction(m.id)}
              iconOnly
              className="btn-ghost !py-1.5 !px-2.5 text-xs text-danger hover:text-danger-700 shrink-0"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
