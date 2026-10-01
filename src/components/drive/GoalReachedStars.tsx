"use client";

import { useEffect, useState } from "react";

/** How many stars fall. Enough to read as a shower, few enough that the
 *  twenty absolutely-positioned SVGs cost nothing on a mid-range phone. */
const STAR_COUNT = 20;

interface Star {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  spin: number;
  opacity: number;
}

/** Deterministic-per-mount star field. Generated in an effect rather than
 *  during render so the server and the first client paint agree (Math.random
 *  in the render body would hydrate-mismatch). */
function makeStars(): Star[] {
  return Array.from({ length: STAR_COUNT }, () => ({
    left: 3 + Math.random() * 94,
    size: 9 + Math.random() * 9,
    duration: 2.4 + Math.random() * 1.6,
    delay: Math.random() * 1.1,
    drift: -28 + Math.random() * 56,
    spin: 120 + Math.random() * 180,
    opacity: 0.55 + Math.random() * 0.4,
  }));
}

/**
 * The goal-reached moment: a fall of eight-point gold stars over the hero.
 * Plays on every page load, by design — see the Drive goal-reached brief.
 *
 * Renders nothing at all when the visitor has asked for reduced motion, and
 * nothing on the server, so the celebration is purely additive: the page is
 * complete and readable without it.
 */
export function GoalReachedStars() {
  const [stars, setStars] = useState<Star[] | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setStars(makeStars());
  }, []);

  if (!stars) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden z-10"
    >
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute -top-8 animate-star-fall"
          style={{
            left: `${s.left}%`,
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            ["--star-drift" as string]: `${s.drift}px`,
            ["--star-spin" as string]: `${s.spin}deg`,
            ["--star-opacity" as string]: `${s.opacity}`,
          }}
        >
          <svg
            width={s.size}
            height={s.size}
            viewBox="0 0 24 24"
            fill="none"
            role="presentation"
          >
            <path
              d="M12 1.5l2.6 6.3 6.3 2.6-6.3 2.6L12 19.3l-2.6-6.3L3.1 10.4l6.3-2.6z"
              className="fill-gold"
            />
            <path
              d="M12 5.2l1.5 3.6 3.6 1.5-3.6 1.5L12 15.4l-1.5-3.6-3.6-1.5 3.6-1.5z"
              className="fill-amber/50"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}
