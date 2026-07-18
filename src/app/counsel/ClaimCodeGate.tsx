"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2, ArrowRight } from "lucide-react";
import { claimThreadByCode } from "./actions";

export function ClaimCodeGate() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const res = await claimThreadByCode(code);
    setPending(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError(res.error ?? "Couldn't find that thread.");
    }
  }

  return (
    <details className="ornate-card p-5 sm:p-6">
      <summary className="cursor-pointer flex items-center gap-2 text-sm font-medium text-ink/75 hover:text-emerald-deep transition">
        <KeyRound className="h-4 w-4 text-gold-antique" />
        Have a claim code? Return to your thread
      </summary>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="input-field font-mono tracking-wide"
          placeholder="NS-XXXX-XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
        />
        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            {error}
          </p>
        )}
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
          Open my thread
        </button>
        <p className="text-xs text-ink/50">
          Your claim code was shown once at first submission. If you lost it,
          you&apos;ll need to start a fresh thread.
        </p>
      </form>
    </details>
  );
}
