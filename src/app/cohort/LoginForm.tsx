"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { loginHead } from "./actions";

export function CohortLoginForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          try {
            const result = await loginHead(fd);
            if (result && result.ok === false) {
              setError(result.error);
            }
          } catch {
            // redirect throws on success — no-op
          }
        });
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="email" className="label-field">
          Email address
        </label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input-field pl-11"
            placeholder="your@email.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="label-field">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/40" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="input-field pl-11"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in to Cohort Portal"
        )}
      </button>
    </form>
  );
}
