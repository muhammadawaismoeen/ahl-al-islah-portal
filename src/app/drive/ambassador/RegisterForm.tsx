"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Drive } from "@/lib/drive-types";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { computeSuggestedTarget } from "@/lib/drive-calc";
import { registerAmbassadorAction } from "./actions";

export function RegisterForm({
  drive,
  ihsanPercentage,
  defaultName,
}: {
  drive: Drive;
  ihsanPercentage: number;
  defaultName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [ownTargetInput, setOwnTargetInput] = useState("");
  const [chosenTarget, setChosenTarget] = useState<"own" | "suggested">("own");

  const ownTarget = Number(ownTargetInput);
  const suggestedTarget = useMemo(() => {
    if (!Number.isFinite(ownTarget) || ownTarget <= 0) return 0;
    return computeSuggestedTarget(ownTarget, ihsanPercentage);
  }, [ownTarget, ihsanPercentage]);

  function handleSubmit(formData: FormData) {
    setError(null);
    formData.set("driveId", drive.id);
    formData.set(
      "chosenTarget",
      String(chosenTarget === "suggested" ? suggestedTarget : ownTarget)
    );
    startTransition(async () => {
      const res = await registerAmbassadorAction(formData);
      if (res.ok) {
        toast.success("Registration submitted — awaiting admin approval.");
        router.refresh();
      } else {
        setError(res.error ?? "Couldn't submit your registration.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="ornate-card p-6 sm:p-7 space-y-5">
      <div>
        <label htmlFor="name" className="label-field">Full name</label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaultName}
          className="input-field"
        />
      </div>
      <div>
        <label htmlFor="contact" className="label-field">Phone (optional)</label>
        <input id="contact" name="contact" className="input-field" />
      </div>
      <div>
        <label htmlFor="ownTarget" className="label-field">
          Your donation target ({DRIVE_CURRENCY})
        </label>
        <input
          id="ownTarget"
          name="ownTarget"
          type="number"
          min={1}
          step="1"
          required
          value={ownTargetInput}
          onChange={(e) => setOwnTargetInput(e.target.value)}
          className="input-field"
          placeholder="e.g. 20000"
        />
      </div>

      {suggestedTarget > 0 && (
        <div className="space-y-2">
          <p className="label-field !mb-0">Choose your committed target</p>
          <button
            type="button"
            onClick={() => setChosenTarget("own")}
            className={`w-full text-left p-4 rounded-xl border transition ${
              chosenTarget === "own"
                ? "border-emerald-deep bg-emerald-deep/5"
                : "border-border hover:border-emerald-deep/30"
            }`}
          >
            <p className="text-sm font-medium text-ink">
              {DRIVE_CURRENCY} {ownTarget.toLocaleString()}
            </p>
            <p className="text-xs text-ink/50 mt-0.5">Your own target</p>
          </button>
          <button
            type="button"
            onClick={() => setChosenTarget("suggested")}
            className={`w-full text-left p-4 rounded-xl border transition ${
              chosenTarget === "suggested"
                ? "border-amber bg-amber/5"
                : "border-border hover:border-amber/40"
            }`}
          >
            <p className="text-sm font-medium text-ink flex items-center gap-1.5">
              {DRIVE_CURRENCY} {suggestedTarget.toLocaleString()}
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber/15 text-amber">
                <Sparkles className="h-2.5 w-2.5" /> Ihsan-level
              </span>
            </p>
            <p className="text-xs text-ink/50 mt-0.5">
              Our suggested target, {ihsanPercentage}% beyond your own
            </p>
          </button>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Award className="h-4 w-4" />
        )}
        Register as Ambassador
      </button>
    </form>
  );
}
