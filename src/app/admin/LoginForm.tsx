"use client";

import { useState, useTransition } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";

interface Props {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string } | void>;
}

export function LoginForm({ action }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          try {
            const result = await action(fd);
            if (result && result.ok === false) {
              setError(result.error ?? "Login failed.");
              toast.error(result.error ?? "Login failed.");
            }
          } catch {
            // redirect throws intentionally when login succeeds — no-op
          }
        });
      }}
      className="space-y-4"
    >
      <div>
        <label htmlFor="password" className="label-field">
          Admin password
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
        {error && <p className="error-text">{error}</p>}
      </div>
      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign in"
        )}
      </button>
      <p className="text-[11px] text-ink/50 text-center leading-relaxed pt-2">
        Set <code className="font-mono">ADMIN_PASSWORD</code> in your{" "}
        <code className="font-mono">.env.local</code> file before first login.
      </p>
    </form>
  );
}
