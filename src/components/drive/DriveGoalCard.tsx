"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import type { GoalProgress } from "@/lib/drive-goal";

/** useLayoutEffect warns when React renders on the server, so fall back to
 *  useEffect there. On the client we need the layout variant: it runs before
 *  the browser paints, so the card can be rewound to zero without the final
 *  figure flashing up first. */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const FILL_MS = 1200;

/** Ease-out cubic — fast off the mark, settling gently into the goal. */
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

/**
 * The Drive's "raised so far" card once the goal has been reached.
 *
 * Server-rendered in its finished state, so a visitor with JavaScript off or
 * reduced motion on sees the completed card immediately. When motion is
 * allowed, a layout effect rewinds it to zero before the first paint and
 * plays the climb — the bar fills, the figure counts up, and the card settles
 * into gold.
 */
export function DriveGoalCard({ progress }: { progress: GoalProgress }) {
  const { raised, goal, barPct, surplus } = progress;
  // 1 = finished. Server render and the no-motion path both start here.
  const [t, setT] = useState(1);
  const [animating, setAnimating] = useState(false);
  const frame = useRef<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setT(0);
    setAnimating(true);
  }, []);

  useEffect(() => {
    if (!animating) return;
    let start: number | null = null;
    const step = (now: number) => {
      if (start === null) start = now;
      const p = Math.min(1, (now - start) / FILL_MS);
      setT(ease(p));
      if (p < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        setAnimating(false);
      }
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [animating]);

  const won = !animating;
  const shownRaised = Math.round(raised * t);
  const shownPct = Math.round(barPct * t);

  return (
    <div
      className={`ornate-card p-6 sm:p-7 mb-8 transition-shadow duration-700 ${
        won ? "glow-ring-gold border-gold/50" : ""
      }`}
    >
      <div className="flex items-end justify-between gap-3 mb-2">
        <p className="text-sm font-medium text-ink/75 flex items-center gap-2 min-w-0">
          {won && (
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gold text-amber shrink-0 animate-seal-pop">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
          )}
          {won ? "Goal reached" : "Raised so far"}
        </p>
        <p
          className={`text-sm font-semibold shrink-0 transition-colors duration-700 ${
            won ? "text-amber" : "text-emerald-deep"
          }`}
        >
          {shownPct}%
        </p>
      </div>

      <div className="h-3 rounded-full bg-surface-2 overflow-hidden border border-border">
        <div
          className={`h-full rounded-full ${
            won
              ? "bg-gradient-to-r from-emerald-deep via-emerald to-gold"
              : "bg-emerald"
          }`}
          style={{ width: `${barPct * t}%` }}
        />
      </div>

      <p className="mt-2 text-sm text-ink/60">
        <span className="font-medium text-ink">
          {DRIVE_CURRENCY} {shownRaised.toLocaleString()}
        </span>{" "}
        raised of {DRIVE_CURRENCY} {goal.toLocaleString()} goal
        {won && surplus > 0 && (
          <>
            {" · "}
            <span className="text-amber">
              {DRIVE_CURRENCY} {surplus.toLocaleString()} beyond goal
            </span>
          </>
        )}
      </p>

      {won && (
        <p className="mt-3 animate-fade-up">
          <span className="font-arabic text-amber text-lg leading-none">
            الحمد لله
          </span>
        </p>
      )}
    </div>
  );
}
