"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Loader2, X } from "lucide-react";

export function ZakatDisclaimerDialog({
  open,
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  // `document` exists on both the server-render pass (never) and the client's
  // very first hydration pass (always) — checking `typeof document` alone
  // isn't enough when `open` can already be true on first paint (e.g. a
  // page-load gate), since the client's first pass would then portal content
  // the server never rendered. Deferring to a post-mount state ensures the
  // client's first pass matches the server's null before rendering the portal.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => !pending && onCancel()}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="zakat-disclaimer-title"
        className="ornate-card relative w-full max-w-md p-7 animate-in"
      >
        <button
          type="button"
          onClick={() => !pending && onCancel()}
          className="absolute top-4 right-4 text-ink/40 hover:text-ink/70 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-amber/15 mb-4">
          <AlertCircle className="h-6 w-6 text-amber" />
        </div>

        <h2 id="zakat-disclaimer-title" className="heading-serif text-xl font-semibold text-ink">
          Before you send this
        </h2>

        <div className="mt-3 rounded-2xl border border-gold/30 bg-gradient-to-b from-gold/[0.08] to-transparent p-4">
          <p className="text-sm text-ink/75 leading-relaxed">
            <strong className="text-emerald-deep">We do not accept Zakat</strong> as
            part of this drive. This is only for Sadaqah and other voluntary
            donations.
          </p>
        </div>

        <p className="mt-3 text-xs text-ink/50 leading-relaxed">
          If this is meant to be your Zakat, please route it through a
          Zakat-eligible channel instead — go back and check before sending.
        </p>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="btn-ghost !py-2 !px-4 text-sm"
          >
            Go back
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            This isn&apos;t Zakat — Send it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
