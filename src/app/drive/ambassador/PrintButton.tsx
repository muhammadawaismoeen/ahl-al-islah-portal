"use client";

import { Printer } from "lucide-react";

export function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary print:hidden"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
