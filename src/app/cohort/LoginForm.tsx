"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { headSignIn } from "./actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.82-.07-1.6-.2-2.36H12v4.47h6.47c-.28 1.5-1.13 2.78-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.74z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1C3.24 21.3 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.27a12 12 0 0 0 0 10.78z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.3 0 3.24 2.7 1.27 6.61l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

export function CohortLoginForm() {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => headSignIn())}
        className="btn-primary w-full"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Sign in with Google
      </button>
      <p className="text-[11px] text-ink/50 text-center leading-relaxed pt-2">
        Access is restricted to the Head/Deputy Google accounts on file.
      </p>
    </div>
  );
}
