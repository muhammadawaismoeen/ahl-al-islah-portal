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
    <form onSubmit={submit} className="w-full max-w-xs text-center">
      <Lock className="h-7 w-7 text-gold mx-auto mb-5" />
      <h1 className="font-serif text-2xl text-white mb-1">Drive Day board</h1>
      <p className="text-sm text-white/55 mb-7">
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
        className="w-full text-center text-2xl tracking-[0.5em] font-mono bg-white/10 border border-white/20 rounded-xl py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-gold"
      />
      {error && <p className="text-sm text-gold mt-3">{error}</p>}
      <button
        type="submit"
        disabled={pending || pin.length < 1}
        className="w-full mt-5 rounded-xl bg-gold text-[#17241D] font-semibold py-3 disabled:opacity-40 inline-flex items-center justify-center gap-2"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Open the board
      </button>
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
      className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white/80 transition-colors"
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
