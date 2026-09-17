"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Loader2, HandCoins, CheckCircle2, Upload, Landmark, Wallet, Award } from "lucide-react";
import { toast } from "sonner";
import type { Ambassador, Drive, PaymentMethod } from "@/lib/drive-types";
import { DRIVE_CURRENCY, MAX_PROOF_BYTES } from "@/lib/drive-config";
import { submitDonationAction } from "./actions";

export function DonateForm({
  drives,
  ambassadors,
  paymentMethods,
  donateCtaLabel,
}: {
  drives: Drive[];
  ambassadors: Ambassador[];
  paymentMethods: PaymentMethod[];
  donateCtaLabel: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);
  const [driveId, setDriveId] = useState("general");

  const ambassadorsForDrive = useMemo(
    () => ambassadors.filter((a) => a.driveId === driveId),
    [ambassadors, driveId]
  );

  function handleSubmit(formData: FormData) {
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (file && file.size > MAX_PROOF_BYTES) {
      setError(
        `File is ${Math.round(file.size / 1024)} KB — the maximum is ${Math.round(
          MAX_PROOF_BYTES / 1024
        )} KB.`
      );
      return;
    }
    startTransition(async () => {
      const res = await submitDonationAction(formData);
      if (res.ok && res.refCode) {
        setRefCode(res.refCode);
        toast.success("Donation submitted for review.");
      } else {
        setError(res.error ?? "Couldn't submit your donation.");
        toast.error(res.error ?? "Couldn't submit your donation.");
      }
    });
  }

  if (refCode) {
    return (
      <div className="ornate-card p-8 text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-emerald mb-4">
          <CheckCircle2 className="h-7 w-7 text-white" />
        </div>
        <h2 className="heading-serif text-2xl font-semibold text-emerald-deep">
          جزاك الله خيراً
        </h2>
        <p className="mt-2 text-sm text-ink/65">
          Your donation is submitted and pending review. We&apos;ll verify the
          transfer and update your record.
        </p>
        <div className="gold-divider" />
        <p className="text-xs text-ink/50">Reference code</p>
        <code className="inline-block mt-1 font-mono text-lg text-emerald-deep tracking-wide">
          {refCode}
        </code>
      </div>
    );
  }

  return (
    <form action={handleSubmit} encType="multipart/form-data" className="space-y-6">
      <div>
        <label htmlFor="driveId" className="label-field">
          Category
        </label>
        <select
          id="driveId"
          name="driveId"
          className="input-field"
          value={driveId}
          onChange={(e) => setDriveId(e.target.value)}
        >
          <option value="general">General donation</option>
          {drives.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {ambassadorsForDrive.length > 0 && (
        <div>
          <label htmlFor="ambassadorId" className="label-field">
            Select Ambassador (optional)
          </label>
          <select id="ambassadorId" name="ambassadorId" className="input-field" defaultValue="">
            <option value="">No Ambassador</option>
            {ambassadorsForDrive.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
                {a.isIhsanLevel ? " — Ihsan-level" : ""}
              </option>
            ))}
          </select>
          <p className="help-text flex items-center gap-1">
            <Award className="h-3 w-3 text-emerald-deep" />
            Donating on behalf of an Ambassador? Choose their name so it
            counts toward their target.
          </p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="donorName" className="label-field">
            Full name (optional)
          </label>
          <input
            id="donorName"
            name="donorName"
            className="input-field"
            placeholder="Leave blank to donate anonymously"
          />
        </div>
        <div>
          <label htmlFor="donorContact" className="label-field">
            Email or phone (optional)
          </label>
          <input id="donorContact" name="donorContact" className="input-field" />
        </div>
      </div>

      <div>
        <label htmlFor="amount" className="label-field">
          Amount ({DRIVE_CURRENCY})
        </label>
        <input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step="1"
          required
          className="input-field"
          placeholder="e.g. 5000"
        />
      </div>

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink/75">
          <Landmark className="h-4 w-4 text-emerald-deep" />
          Payment details
        </p>
        {paymentMethods.length === 0 ? (
          <div className="ornate-card p-5 bg-surface-2/40">
            <p className="text-sm text-ink/60">
              Payment details aren&apos;t configured yet — please check back soon.
            </p>
          </div>
        ) : (
          paymentMethods.map((m) => (
            <div key={m.id} className="ornate-card p-5 bg-surface-2/40">
              <p className="flex items-center gap-2 text-sm font-medium text-ink/75 mb-3">
                {m.kind === "bank" ? (
                  <Landmark className="h-4 w-4 text-emerald-deep" />
                ) : (
                  <Wallet className="h-4 w-4 text-emerald-deep" />
                )}
                {m.label}
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
                <dt className="text-ink/50">Title</dt>
                <dd className="text-ink/85">{m.accountTitle}</dd>
                <dt className="text-ink/50">
                  {m.kind === "bank" ? "Account #" : "Wallet #"}
                </dt>
                <dd className="text-ink/85 font-mono">{m.accountNumber}</dd>
                {m.iban && (
                  <>
                    <dt className="text-ink/50">IBAN</dt>
                    <dd className="text-ink/85 font-mono">{m.iban}</dd>
                  </>
                )}
                {m.branch && (
                  <>
                    <dt className="text-ink/50">Branch</dt>
                    <dd className="text-ink/85">{m.branch}</dd>
                  </>
                )}
              </dl>
              {m.instructions && (
                <p className="text-xs text-ink/50 mt-2">{m.instructions}</p>
              )}
            </div>
          ))
        )}
      </div>

      <div>
        <label htmlFor="proof" className="label-field">
          Proof of transfer (image or PDF)
        </label>
        <div className="relative">
          <Upload className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40 pointer-events-none" />
          <input
            ref={fileRef}
            id="proof"
            name="proof"
            type="file"
            accept="image/*,application/pdf"
            required
            className="input-field pl-11 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:bg-emerald-deep/10 file:text-emerald-deep file:text-xs file:font-medium"
          />
        </div>
        <p className="help-text">
          JPG, PNG, WebP, or PDF — up to {Math.round(MAX_PROOF_BYTES / 1024)} KB.
        </p>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <HandCoins className="h-4 w-4" />
        )}
        {donateCtaLabel}
      </button>
    </form>
  );
}
