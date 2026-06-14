"use client";

import { useState, useRef } from "react";
import {
  Send,
  Loader2,
  CheckCircle,
  Shield,
  Printer,
  RefreshCw,
  Download,
} from "lucide-react";
import { submitIdentityPillars } from "./actions";
import { PILLAR_TYPE_LABELS } from "@/lib/activity-submissions-types";
import type {
  IdentityPillar,
  PillarType,
} from "@/lib/activity-submissions-types";

interface Props {
  sessionId?: string;
  sessionTitle?: string;
  sessionDate?: string;
}

interface CompletedRecord {
  name?: string;
  pillar1: IdentityPillar;
  pillar2: IdentityPillar;
  pillar3: IdentityPillar;
  reflection?: string;
  sessionTitle?: string;
  sessionDate?: string;
  submittedAt: string;
}

const PILLARS: Array<{ index: 1 | 2 | 3; label: string }> = [
  { index: 1, label: "Pillar One" },
  { index: 2, label: "Pillar Two" },
  { index: 3, label: "Pillar Three" },
];

export function IdentityPillarsForm({
  sessionId,
  sessionTitle,
  sessionDate,
}: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<CompletedRecord | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formEl = e.currentTarget;
    const data = new FormData(formEl);

    const snapshot: CompletedRecord = {
      name: (data.get("name") as string | null)?.trim() || undefined,
      pillar1: {
        text: ((data.get("pillar1_text") as string | null) ?? "").trim(),
        type: ((data.get("pillar1_type") as string | null) ?? "") as PillarType,
      },
      pillar2: {
        text: ((data.get("pillar2_text") as string | null) ?? "").trim(),
        type: ((data.get("pillar2_type") as string | null) ?? "") as PillarType,
      },
      pillar3: {
        text: ((data.get("pillar3_text") as string | null) ?? "").trim(),
        type: ((data.get("pillar3_type") as string | null) ?? "") as PillarType,
      },
      reflection:
        ((data.get("reflection") as string | null) ?? "").trim() || undefined,
      sessionTitle,
      sessionDate,
      submittedAt: new Date().toISOString(),
    };

    const res = await submitIdentityPillars(data);
    setPending(false);

    if (res.ok) {
      setCompleted(snapshot);
      formEl.reset();
    } else {
      setError(res.error ?? "Could not save your submission.");
    }
  }

  if (completed) {
    return <CompletedView record={completed} onReset={() => setCompleted(null)} />;
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="ornate-card p-6 sm:p-8 space-y-8"
    >
      {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}

      {/* Privacy banner */}
      <div className="flex items-start gap-3 p-4 bg-emerald-deep/5 rounded-xl border border-emerald-deep/15">
        <Shield className="h-5 w-5 text-emerald-deep shrink-0 mt-0.5" />
        <div className="text-xs text-ink/75 leading-relaxed">
          <p className="font-semibold text-emerald-deep">
            Your audit goes privately to the Speaker.
          </p>
          <p className="mt-0.5">
            Only the Speaker reads your responses. You will see a printable
            copy and a PDF download on the next screen.
          </p>
        </div>
      </div>

      {/* Name */}
      <section className="space-y-3">
        <label className="label-field">Your name *</label>
        <input
          type="text"
          name="name"
          required
          maxLength={100}
          className="input-field"
          placeholder="Your full name"
        />
      </section>

      {/* Pillars */}
      <section className="space-y-6 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            Your Three Pillars
          </h3>
          <p className="text-xs text-ink/55 mt-0.5 leading-relaxed">
            Not what you wish they were — what they actually are. The three
            non-negotiables your decisions currently rest on. Next to each, mark
            <strong className="text-emerald-deep"> A</strong> if it would hold
            even if everyone around you withdrew their approval, or{" "}
            <strong className="text-gold-antique">B</strong> if it depends on
            that approval to stay standing.
          </p>
        </div>

        {PILLARS.map((p) => (
          <PillarRow key={p.index} index={p.index} label={p.label} />
        ))}
      </section>

      {/* Reflection */}
      <section className="space-y-3 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            One Honest Sentence *
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            What did this audit show you about yourself?
          </p>
        </div>
        <textarea
          name="reflection"
          required
          rows={4}
          minLength={1}
          maxLength={2000}
          className="input-field resize-y"
          placeholder="A single honest sentence — only the Speaker will read it."
        />
      </section>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Audit
          </>
        )}
      </button>

      <p className="text-center text-xs text-ink/40">
        Your audit goes privately to the Speaker. You will see a printable copy
        on the next screen.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  PillarRow                                                          */
/* ------------------------------------------------------------------ */

function PillarRow({
  index,
  label,
}: {
  index: 1 | 2 | 3;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <label className="label-field">{label} *</label>
      <textarea
        name={`pillar${index}_text`}
        required
        rows={2}
        maxLength={500}
        className="input-field resize-y"
        placeholder="A non-negotiable you currently build your decisions on."
      />
      <div className="flex flex-wrap gap-2 pt-1">
        <PillarTypeChoice index={index} value="A" />
        <PillarTypeChoice index={index} value="B" />
      </div>
    </div>
  );
}

function PillarTypeChoice({
  index,
  value,
}: {
  index: 1 | 2 | 3;
  value: "A" | "B";
}) {
  return (
    <label
      className={`flex items-start gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition flex-1 min-w-[14rem] ${
        value === "A"
          ? "border-cream-muted bg-cream-warm/40 hover:bg-emerald-deep/5 hover:border-emerald-deep/30 has-[:checked]:bg-emerald-deep/10 has-[:checked]:border-emerald-deep"
          : "border-cream-muted bg-cream-warm/40 hover:bg-gold-antique/5 hover:border-gold-antique/30 has-[:checked]:bg-gold-antique/10 has-[:checked]:border-gold-antique"
      }`}
    >
      <input
        type="radio"
        name={`pillar${index}_type`}
        value={value}
        required
        className="h-4 w-4 mt-0.5 accent-emerald-deep shrink-0"
      />
      <div className="text-xs leading-snug">
        <div className="font-semibold text-emerald-deep">
          {value} — {PILLAR_TYPE_LABELS[value]}
        </div>
        <div className="text-ink/55 mt-0.5">
          {value === "A"
            ? "Holds even if everyone around me disagrees."
            : "Depends on approval from people around me."}
        </div>
      </div>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/*  CompletedView — shown after submit, printable                      */
/* ------------------------------------------------------------------ */

function CompletedView({
  record,
  onReset,
}: {
  record: CompletedRecord;
  onReset: () => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const formattedDate = new Date(record.submittedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  function handlePrint() {
    window.print();
  }

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "pt", format: "letter", compress: true });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 60;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const ensureRoom = (needed: number) => {
        if (y + needed > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      };

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(15, 64, 51);
      doc.text("Identity Pillars Audit", pageWidth / 2, y, { align: "center" });
      y += 26;

      if (record.sessionTitle) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        const sessionLine = record.sessionDate
          ? `${record.sessionTitle}  ·  ${record.sessionDate}`
          : record.sessionTitle;
        doc.text(sessionLine, pageWidth / 2, y, { align: "center" });
        y += 16;
      }

      doc.setFontSize(10);
      doc.setTextColor(140, 140, 140);
      const meta = record.name
        ? `By ${record.name}  ·  Completed ${formattedDate}`
        : `Completed ${formattedDate}`;
      doc.text(meta, pageWidth / 2, y, { align: "center" });
      y += 22;

      doc.setDrawColor(180, 140, 40);
      doc.setLineWidth(1);
      doc.line(pageWidth / 2 - 30, y, pageWidth / 2 + 30, y);
      y += 28;

      // Pillars
      const pillars = [record.pillar1, record.pillar2, record.pillar3];
      pillars.forEach((pillar, i) => {
        ensureRoom(80);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(180, 140, 40);
        doc.text(`PILLAR ${i + 1}`, margin, y);

        if (pillar.type) {
          const typeText =
            pillar.type === "A"
              ? "A  ·  Allah-grounded"
              : "B  ·  Approval-grounded";
          if (pillar.type === "A") {
            doc.setTextColor(15, 64, 51);
          } else {
            doc.setTextColor(180, 140, 40);
          }
          doc.text(typeText, pageWidth - margin, y, { align: "right" });
        }
        y += 14;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        const lines = doc.splitTextToSize(pillar.text || "—", contentWidth);
        lines.forEach((line: string) => {
          ensureRoom(14);
          doc.text(line, margin, y);
          y += 14;
        });
        y += 14;
      });

      // Reflection
      if (record.reflection) {
        ensureRoom(60);
        doc.setDrawColor(220, 213, 200);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 20;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(180, 140, 40);
        doc.text("ONE HONEST SENTENCE", margin, y);
        y += 14;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(30, 30, 30);
        const reflectionLines = doc.splitTextToSize(
          record.reflection,
          contentWidth
        );
        reflectionLines.forEach((line: string) => {
          ensureRoom(14);
          doc.text(line, margin, y);
          y += 14;
        });
      }

      // Footer line on last page
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      const footerLines = doc.splitTextToSize(
        "Ibrahim (alayhi as-salam) held one pillar. Every test was the same question: will you hold this pillar even now?",
        contentWidth
      );
      const footerY = pageHeight - margin - footerLines.length * 12;
      doc.text(footerLines, pageWidth / 2, footerY, { align: "center" });

      const safeName = record.name
        ? record.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 40)
        : "anonymous";
      const dateSlug = new Date(record.submittedAt).toISOString().slice(0, 10);
      doc.save(`identity-pillars-${safeName}-${dateSlug}.pdf`);
    } catch (err) {
      console.error("PDF download failed:", err);
      setDownloadError(
        "Could not generate the PDF. Try the Print option instead."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Confirmation — hidden in print */}
      <div className="ornate-card p-6 text-center space-y-4 no-print">
        <CheckCircle className="h-12 w-12 text-emerald-deep mx-auto" />
        <div>
          <h2 className="heading-serif text-2xl font-semibold text-emerald-deep">
            Audit Saved
          </h2>
          <p className="mt-2 text-sm text-ink/70 max-w-md mx-auto">
            JazakAllāhu khayran. Your pillars have been recorded privately for
            the Speaker. Download your own copy below, or print it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary inline-flex"
          >
            {downloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing PDF…
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download PDF
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-ghost inline-flex"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button
            type="button"
            onClick={onReset}
            className="btn-ghost inline-flex"
          >
            <RefreshCw className="h-4 w-4" />
            Submit another
          </button>
        </div>
        {downloadError && (
          <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2 inline-block">
            {downloadError}
          </p>
        )}
      </div>

      {/* Printable card */}
      <div
        id="printable-audit"
        className="ornate-card p-6 sm:p-10 space-y-6 print-card"
      >
        <header className="text-center pb-5 border-b border-cream-muted">
          <span className="arabic-text block text-gold-antique text-lg mb-1">
            ركائز الهوية
          </span>
          <h2 className="heading-serif text-2xl sm:text-3xl font-semibold text-emerald-deep">
            Identity Pillars Audit
          </h2>
          {record.sessionTitle && (
            <p className="mt-2 text-sm text-ink/65">
              {record.sessionTitle}
              {record.sessionDate ? ` · ${record.sessionDate}` : ""}
            </p>
          )}
          <p className="mt-2 text-xs text-ink/45">
            {record.name ? `By ${record.name} · ` : ""}
            Completed {formattedDate}
          </p>
        </header>

        <div className="space-y-5">
          <PrintablePillar number={1} pillar={record.pillar1} />
          <PrintablePillar number={2} pillar={record.pillar2} />
          <PrintablePillar number={3} pillar={record.pillar3} />
        </div>

        {record.reflection && (
          <div className="pt-5 border-t border-cream-muted">
            <h3 className="text-xs uppercase tracking-wider text-gold-antique font-semibold mb-2">
              One Honest Sentence
            </h3>
            <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-cream-warm rounded-xl p-4 border border-cream-muted print:bg-transparent print:border-ink/15">
              {record.reflection}
            </p>
          </div>
        )}

        <footer className="pt-5 border-t border-cream-muted text-center">
          <p className="arabic-text text-gold-antique text-lg">
            لَآ إِلَٰهَ إِلَّا ٱللَّٰهُ
          </p>
          <p className="text-xs text-ink/45 mt-1 italic">
            Ibrahim عليه السلام held one pillar. Every test was the same
            question: will you hold this pillar even now?
          </p>
        </footer>
      </div>
    </div>
  );
}

function PrintablePillar({
  number,
  pillar,
}: {
  number: number;
  pillar: IdentityPillar;
}) {
  const typeLabel = pillar.type ? PILLAR_TYPE_LABELS[pillar.type] : "";
  const isA = pillar.type === "A";
  return (
    <div className="rounded-xl p-4 border border-cream-muted bg-cream-warm/40 print:bg-transparent print:border-ink/15">
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-gold-antique font-medium">
          Pillar {number}
        </span>
        {pillar.type && (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isA
                ? "bg-emerald-deep text-white"
                : "bg-gold-antique/15 text-gold-antique"
            } print:bg-transparent print:border print:border-ink/30 print:text-ink`}
          >
            {pillar.type} · {typeLabel}
          </span>
        )}
      </div>
      <p className="text-sm sm:text-base text-ink leading-relaxed whitespace-pre-wrap">
        {pillar.text}
      </p>
    </div>
  );
}
