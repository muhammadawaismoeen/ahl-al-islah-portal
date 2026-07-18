"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Loader2,
  CheckCircle,
  Copy,
  Check,
  KeyRound,
  ArrowRight,
} from "lucide-react";
import { startCounselThread, claimThreadByCode } from "./actions";

export function StartCounselForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimCode, setClaimCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await startCounselThread(data);
    setPending(false);
    if (res.ok && res.claimCode) {
      setClaimCode(res.claimCode);
      formRef.current?.reset();
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  function copyCode() {
    if (!claimCode) return;
    navigator.clipboard.writeText(claimCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (claimCode) {
    return (
      <div className="ornate-card p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
            <CheckCircle className="h-7 w-7 text-emerald-deep" />
          </div>
          <h2 className="heading-serif text-2xl font-semibold text-emerald-deep">
            Your thread is open
          </h2>
          <p className="mt-2 text-sm text-ink/70 max-w-md mx-auto">
            The Advisor will see your message and reply when they can. Return
            to this page anytime — you&apos;ll be recognised on this device.
          </p>
        </div>

        <div className="bg-cream-warm rounded-xl p-5 border border-cream-muted">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound className="h-4 w-4 text-gold-antique" />
            <p className="text-xs uppercase tracking-wider text-ink/60 font-semibold">
              Your Claim Code — save this now
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <code className="font-mono text-lg text-emerald-deep bg-white px-4 py-2 rounded-lg border border-cream-muted select-all">
              {claimCode}
            </code>
            <button
              type="button"
              onClick={copyCode}
              className="p-2 hover:bg-cream-muted rounded-lg transition text-ink/50 hover:text-emerald-deep"
              aria-label="Copy claim code"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-deep" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-ink/60 leading-relaxed">
            This is your only key to reach this thread from a different device
            (phone, another browser). It won&apos;t be shown again. Store it
            somewhere private.
          </p>
        </div>

        <button
          type="button"
          onClick={async () => {
            await claimThreadByCode(claimCode);
            router.refresh();
          }}
          className="btn-primary w-full"
        >
          <ArrowRight className="h-4 w-4" />
          Continue to my thread
        </button>
      </div>
    );
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
