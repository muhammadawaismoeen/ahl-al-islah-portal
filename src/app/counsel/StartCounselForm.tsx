"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, Loader2 } from "lucide-react";
import { CLAIM_CODE_STORAGE_KEY } from "@/lib/counsel-types";
import { startCounselThread } from "./actions";

export function StartCounselForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await startCounselThread(data);
    if (res.ok && res.claimCode) {
      // The server already set this device's thread cookie. Hand the claim
      // code to ThreadView (it shows a save-this-code banner until dismissed),
      // then re-render into the thread.
      try {
        sessionStorage.setItem(CLAIM_CODE_STORAGE_KEY, res.claimCode);
      } catch {
        // storage unavailable — the thread still opens; only the code banner is lost
      }
      router.refresh();
    } else {
      setPending(false);
      setError(res.error ?? "Something went wrong.");
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="ornate-card p-8 space-y-6">
      <div>
        <label className="label-field">Which cohort are you from? *</label>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <label className="cursor-pointer">
            <input
              type="radio"
              name="cohort"
              value="brothers"
              required
              className="peer sr-only"
            />
            <span className="block text-center text-sm px-3 py-2.5 rounded-xl border border-cream-muted bg-cream-warm peer-checked:bg-emerald-deep peer-checked:text-white peer-checked:border-emerald-deep transition">
              Brothers
            </span>
          </label>
          <label className="cursor-pointer">
            <input
              type="radio"
              name="cohort"
              value="sisters"
              required
              className="peer sr-only"
            />
            <span className="block text-center text-sm px-3 py-2.5 rounded-xl border border-cream-muted bg-cream-warm peer-checked:bg-gold-antique peer-checked:text-white peer-checked:border-gold-antique transition">
              Sisters
            </span>
          </label>
        </div>
        <p className="help-text">Helps the Advisor with context.</p>
      </div>

      <div>
        <label className="label-field">What&apos;s on your mind? *</label>
        <textarea
          name="body"
          required
          rows={8}
          className="input-field resize-y"
          placeholder="Write freely — a question, a struggle, a decision. Take your time. Nothing you say leaves this thread."
          minLength={10}
          maxLength={5000}
        />
        <p className="help-text">
          No name required. Reply lands in this same private thread on this
          device.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Start a private thread with the Advisor
          </>
        )}
      </button>
    </form>
  );
}
