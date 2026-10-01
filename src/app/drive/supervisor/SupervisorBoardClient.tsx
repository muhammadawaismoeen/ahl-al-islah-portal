"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, RefreshCw } from "lucide-react";
import { unlockSupervisorBoardAction } from "./actions";

/** How often the projected board re-reads the counts. Short enough that a
 *  supervisor watching the hall sees a scan land within a few seconds of it
 *  happening, long enough not to hammer the store all day. */
const REFRESH_MS = 15_000;

export function SupervisorPinGate() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await unlockSupervisorBoardAction(pin);
      if (res.ok) {
        router.refresh();
      } else {
        setPin("");
        setError(res.error ?? "That didn't work.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="ornate-card p-8 sm:p-10 text-center">
        <span className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald/10 mb-5">
          <Lock className="h-5 w-5 text-emerald-deep" />
        </span>
        <h1 className="heading-serif text-2xl text-ink mb-1.5">Drive Day board</h1>
        <p className="text-sm text-ink/55 mb-7">
          Enter the PIN your Advisor gave you.
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          aria-label="Supervisor PIN"
          className="input-field text-center text-2xl tracking-[0.45em] font-mono !py-3"
        />
        {error && <p className="text-sm text-danger mt-3">{error}</p>}
        <button
          type="submit"
          disabled={pending || pin.length < 1}
          className="btn-primary w-full mt-5"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Open the board
        </button>
      </div>
    </form>
  );
}

/**
 * Keeps a projected board current without anyone touching the laptop, and
 * shows when it last succeeded — a frozen clock is the only way a supervisor
 * can tell the numbers have gone stale.
 */
export function BoardAutoRefresh({ generatedAt }: { generatedAt: string }) {
  const router = useRouter();
  const [clock, setClock] = useState("");

  useEffect(() => {
    setClock(
      new Date(generatedAt).toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      })
    );
  }, [generatedAt]);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center gap-2 text-sm text-ink/40 hover:text-emerald-deep transition-colors"
    >
      <RefreshCw className="h-3.5 w-3.5" />
      {/* Rendered empty on the server: the time is formatted in the
          viewer's locale, which would otherwise mismatch and hydrate-error. */}
      <span suppressHydrationWarning>
        {clock ? `Updated ${clock}` : "Updating…"}
      </span>
    </button>
  );
}
