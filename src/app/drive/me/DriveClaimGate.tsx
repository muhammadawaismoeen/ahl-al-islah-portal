"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import { claimByCodeAction } from "./actions";

export function DriveClaimGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await claimByCodeAction(code);
    setPending(false);
    if (res.ok) {
      setCode("");
      router.refresh();
    } else {
      setError(res.error ?? "Couldn't find a record for that code.");
    }
  }

  return (
    <details className="ornate-card p-5 sm:p-6">
      <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-ink/75 hover:text-emerald-deep transition">
        <KeyRound className="h-4 w-4 text-emerald-deep" />
        Add a record from another device
      </summary>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="input-field font-mono tracking-wide"
          placeholder="BK-XXXX-XXXX or DN-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
        />
        {error && <p className="error-text">{error}</p>}
        <button
          type="submit"
          disabled={pending || !code.trim()}
          className="btn-secondary w-full"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
          Add to this device
        </button>
        <p className="text-xs text-ink/50">
          Enter the pickup code from your ticket or the reference code from
          your donation to pull it up here.
        </p>
      </form>
    </details>
  );
}
