"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { upload } from "@vercel/blob/client";

interface Defaults {
  title: string;
  arabicTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink: string;
  description: string;
}

interface Props {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  defaults: Defaults;
  currentPosterUrl?: string;
  /** True in prod (BLOB_READ_WRITE_TOKEN set) → direct-upload to Blob bypasses Vercel's 4.5 MB body cap. */
  hasBlobUpload: boolean;
  cancelHref: string;
  submitLabel: string;
}

export function SessionForm({
  mode,
  action,
  defaults,
  currentPosterUrl,
  hasBlobUpload,
  cancelHref,
  submitLabel,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const posterUrlRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (busy) {
      e.preventDefault();
      return;
    }
    const file = fileRef.current?.files?.[0];
    if (file && hasBlobUpload) {
      e.preventDefault();
      setBusy(true);
      setErr(null);
      try {
        const rawExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt)
          ? rawExt
          : "jpg";
        const stem = `${Date.now().toString(36)}`;
        const result = await upload(`sessions/posters/${stem}.${ext}`, file, {
          access: "public",
          handleUploadUrl: "/api/sessions/poster-token",
          contentType: file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
        });
        if (posterUrlRef.current) posterUrlRef.current.value = result.url;
        if (fileRef.current) fileRef.current.value = "";
        formRef.current?.requestSubmit();
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error ? uploadErr.message : "Upload failed.";
        setErr(`Poster upload failed: ${msg}`);
        setBusy(false);
      }
    }
    // Otherwise: dev path (no Blob) or no file → let the form go through the
    // Server Action with the multipart body as-is.
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className="space-y-5"
    >
      <input
        ref={posterUrlRef}
        type="hidden"
        name="posterUrl"
        defaultValue=""
      />

      <Field
        label="Session title *"
        name="title"
        defaultValue={defaults.title}
        placeholder="e.g. Ibrahim عليه السلام: Khalilullah"
        required
      />
      <Field
        label="Arabic title (optional)"
        name="arabicTitle"
        defaultValue={defaults.arabicTitle}
        placeholder="إبراهيم عليه السلام"
        dir="rtl"
      />
      <Field
        label="Date *"
        name="date"
        type="date"
        defaultValue={defaults.date}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start time (PKT)"
          name="startTime"
          type="time"
          defaultValue={defaults.startTime}
          placeholder="16:00"
        />
        <Field
          label="End time (PKT)"
          name="endTime"
          type="time"
          defaultValue={defaults.endTime}
          placeholder="17:15"
        />
      </div>
      <Field
        label="Meeting link (optional)"
        name="meetingLink"
        type="url"
        defaultValue={defaults.meetingLink}
        placeholder="https://meet.google.com/… or https://zoom.us/j/…"
      />
      <FieldArea
        label="One-line description (optional)"
        name="description"
        defaultValue={defaults.description}
        rows={3}
        placeholder="What this session was about — visible on the public Sessions page."
      />

      <div>
        <span className="text-xs uppercase tracking-wider text-ink/55 font-medium block mb-1.5">
          Poster image {mode === "create" && "(optional)"}
        </span>
        {currentPosterUrl && (
          <div className="mb-3 flex items-start gap-4 rounded-lg border border-cream-muted bg-cream-warm/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPosterUrl}
              alt="Current poster"
              className="h-28 w-auto rounded-md border border-cream-muted object-cover"
            />
            <label className="text-xs text-ink/70 inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="removePoster"
                className="h-3.5 w-3.5"
              />
              Remove the current poster
            </label>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          name="poster"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="block w-full text-sm text-ink file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-emerald-deep file:text-white file:font-medium hover:file:bg-emerald-rich file:cursor-pointer cursor-pointer"
        />
        <span className="text-[11px] text-ink/45 mt-1.5 block">
          {mode === "edit"
            ? "Upload to replace the current poster. JPG, PNG, WebP, or GIF — up to 16 MB."
            : "JPG, PNG, WebP, or GIF — up to 16 MB."}
        </span>
      </div>

      {err && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {err}
        </p>
      )}

      <div
        className={
          mode === "create"
            ? "pt-4 flex items-center justify-between"
            : "pt-3 flex justify-end gap-3"
        }
      >
        {mode === "create" && (
          <Link href={cancelHref} className="btn-ghost text-sm">
            Cancel
          </Link>
        )}
        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? "Uploading poster…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  dir,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  dir?: "rtl" | "ltr";
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/55 font-medium block mb-1.5">
        {label}
      </span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        required={required}
        dir={dir}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-lg border border-cream-muted bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-deep/30 focus:border-emerald-deep transition"
      />
    </label>
  );
}

function FieldArea({
  label,
  name,
  placeholder,
  rows = 4,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/55 font-medium block mb-1.5">
        {label}
      </span>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-lg border border-cream-muted bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-deep/30 focus:border-emerald-deep transition resize-y"
      />
    </label>
  );
}
