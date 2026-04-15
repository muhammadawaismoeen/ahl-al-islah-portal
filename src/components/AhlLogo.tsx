import { cn } from "@/lib/utils";

/**
 * Ahl Al-Islah mark: an eight-pointed Islamic star (rub el hizb /
 * khatam) with an inner circle. Pure SVG so it scales and themes
 * via currentColor.
 */
export function AhlLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("", className)}
      aria-hidden
    >
      <g stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="none">
        {/* 8-point star (two squares rotated 45 degrees) */}
        <rect
          x="10"
          y="10"
          width="44"
          height="44"
          rx="2"
          transform="rotate(0 32 32)"
        />
        <rect
          x="10"
          y="10"
          width="44"
          height="44"
          rx="2"
          transform="rotate(45 32 32)"
        />
        {/* Inner circle */}
        <circle cx="32" cy="32" r="8" />
        {/* Center dot */}
        <circle cx="32" cy="32" r="1.8" fill="currentColor" stroke="none" />
      </g>
    </svg>
  );
}
