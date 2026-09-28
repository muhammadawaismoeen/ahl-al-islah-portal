"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download } from "lucide-react";

const INK = "#17241D";
const TEXT_DIM = "#55625A";
const TEXT_FAINT = "#8A938C";
const EMERALD_DEEP = "#057A55";
const LINE = "#DED4BE";
const BG = "#FAF7F1";

const CANVAS_WIDTH = 640;
const SCALE = 2;

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Draws the ticket onto `ctx` at logical (unscaled) coordinates, returning
 *  the total logical height used. Called twice - once at a throwaway height
 *  to measure wrapped text, once for real once the canvas has been resized
 *  to fit - since canvas dimensions must be known before drawing starts. */
function drawTicket(
  ctx: CanvasRenderingContext2D,
  qrSource: HTMLCanvasElement,
  fields: {
    driveName: string;
    itemName: string;
    applicantName: string;
    applicantContact: string;
    dateLabel: string;
    pickupLocation: string;
    pickupCode: string;
  },
  draw: boolean
): number {
  const padding = 40;
  const contentWidth = CANVAS_WIDTH - padding * 2;
  let y = padding;

  if (draw) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 10000);
  }

  ctx.textBaseline = "top";
  ctx.font = "700 22px Georgia, serif";
  if (draw) {
    ctx.fillStyle = EMERALD_DEEP;
    ctx.fillText(fields.driveName, padding, y);
  }
  y += 32;

  ctx.font = "600 15px Arial, sans-serif";
  if (draw) {
    ctx.fillStyle = INK;
    ctx.fillText(fields.itemName, padding, y);
  }
  y += 28;

  if (draw) {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(CANVAS_WIDTH - padding, y);
    ctx.stroke();
  }
  y += 24;

  const rows: [string, string][] = [
    ["Applicant", fields.applicantName],
    ["Contact number", fields.applicantContact],
    ["Drive Day", fields.dateLabel],
    ["Pickup location", fields.pickupLocation],
  ];

  for (const [label, value] of rows) {
    ctx.font = "600 10.5px Arial, sans-serif";
    if (draw) {
      ctx.fillStyle = TEXT_FAINT;
      ctx.fillText(label.toUpperCase(), padding, y);
    }
    y += 17;

    ctx.font = "600 16px Arial, sans-serif";
    const lines = wrapLines(ctx, value, contentWidth);
    for (const line of lines) {
      if (draw) {
        ctx.fillStyle = INK;
        ctx.fillText(line, padding, y);
      }
      y += 21;
    }
    y += 12;
  }

  if (draw) {
    ctx.strokeStyle = LINE;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(CANVAS_WIDTH - padding, y);
    ctx.stroke();
  }
  y += 32;

  const qrSize = 200;
  const qrX = (CANVAS_WIDTH - qrSize) / 2;
  if (draw) {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(qrX - 12, y - 12, qrSize + 24, qrSize + 24);
    ctx.strokeStyle = LINE;
    ctx.strokeRect(qrX - 12, y - 12, qrSize + 24, qrSize + 24);
    ctx.drawImage(qrSource, qrX, y, qrSize, qrSize);
  }
  y += qrSize + 12 + 24;

  ctx.font = "700 20px 'Courier New', monospace";
  const codeWidth = ctx.measureText(fields.pickupCode).width;
  if (draw) {
    ctx.fillStyle = EMERALD_DEEP;
    ctx.fillText(fields.pickupCode, (CANVAS_WIDTH - codeWidth) / 2, y);
  }
  y += 34;

  ctx.font = "500 12px Arial, sans-serif";
  const footerLines = wrapLines(
    ctx,
    "Bring this to the pickup table on Drive Day - printed or on your phone.",
    contentWidth
  );
  for (const line of footerLines) {
    const lineWidth = ctx.measureText(line).width;
    if (draw) {
      ctx.fillStyle = TEXT_DIM;
      ctx.fillText(line, (CANVAS_WIDTH - lineWidth) / 2, y);
    }
    y += 17;
  }
  y += padding - 12;

  return y;
}

export function TicketQr({
  value,
  driveName,
  itemName,
  applicantName,
  applicantContact,
  dateLabel,
  pickupLocation,
}: {
  value: string;
  driveName: string;
  itemName: string;
  applicantName: string;
  applicantContact: string;
  dateLabel: string | null;
  pickupLocation: string;
}) {
  const qrRef = useRef<HTMLCanvasElement>(null);

  function handleDownload() {
    const qrSource = qrRef.current;
    if (!qrSource) return;

    const fields = {
      driveName,
      itemName,
      applicantName,
      applicantContact,
      dateLabel: dateLabel ?? "To be announced",
      pickupLocation,
      pickupCode: value,
    };

    const measureCanvas = document.createElement("canvas");
    measureCanvas.width = CANVAS_WIDTH;
    measureCanvas.height = 10;
    const measureCtx = measureCanvas.getContext("2d");
    if (!measureCtx) return;
    const totalHeight = drawTicket(measureCtx, qrSource, fields, false);

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH * SCALE;
    canvas.height = totalHeight * SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(SCALE, SCALE);
    drawTicket(ctx, qrSource, fields, true);

    const link = document.createElement("a");
    link.download = `drive-ticket-${value}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="inline-flex items-center justify-center bg-white p-4 rounded-2xl border border-border">
        <QRCodeCanvas ref={qrRef} value={value} size={176} level="M" />
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
