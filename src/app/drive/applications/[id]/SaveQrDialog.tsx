"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { QrCode, X } from "lucide-react";

export function SaveQrDialog({
  driveName,
  driveDateLabel,
}: {
  driveName: string;
  driveDateLabel: string | null;
}) {
  const [open, setOpen] = useState(true);
  // Same server/client first-paint mismatch guard as ZakatDisclaimerDialog —
  // `open` starts true, so the portal must wait for a post-mount render to
  // match the server's (never-portalled) output.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="save-qr-title"
        className="ornate-card relative w-full max-w-md p-7 animate-in"
      >
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute top-4 right-4 text-ink/40 hover:text-ink/70 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-deep/15 mb-4">
          <QrCode className="h-6 w-6 text-emerald-deep" />
        </div>

        <h2 id="save-qr-title" className="heading-serif text-xl font-semibold text-ink">
          Save your QR code
        </h2>

        <p className="mt-3 text-sm text-ink/70 leading-relaxed">
          Please save this QR code — screenshot it or download it below — and
          bring it with you on{" "}
          <strong className="text-emerald-deep">{driveName}</strong>
          {driveDateLabel && (
            <>
              {" "}
              on <strong className="text-emerald-deep">{driveDateLabel}</strong>
            </>
          )}
          . The pickup table will scan it to hand over your copy.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
