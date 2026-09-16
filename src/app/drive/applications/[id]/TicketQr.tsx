"use client";

import { QRCodeSVG } from "qrcode.react";

export function TicketQr({ value }: { value: string }) {
  return (
    <div className="inline-flex items-center justify-center bg-white p-4 rounded-2xl border border-border">
      <QRCodeSVG value={value} size={176} level="M" />
    </div>
  );
}
