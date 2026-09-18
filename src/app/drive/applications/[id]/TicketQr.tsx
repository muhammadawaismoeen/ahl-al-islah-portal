"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";

export function TicketQr({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `drive-ticket-${value}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex items-center justify-center bg-white p-4 rounded-2xl border border-border">
        <QRCodeCanvas ref={canvasRef} value={value} size={176} level="M" />
      </div>
      <button
        type="button"
        onClick={handleDownload}
        className="btn-ghost !py-1.5 !px-3.5 text-xs text-emerald-deep"
      >
        <Download className="h-3.5 w-3.5" />
        Download QR code
      </button>
    </div>
  );
}
