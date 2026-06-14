import Link from "next/link";

/**
 * Shared form for creating + editing an Activity. Server component —
 * `action` is a server action (already bound to ids by the caller).
 */
export function ActivityForm({
  action,
  submitLabel,
  defaults,
}: {
  action: (formData: FormData) => Promise<unknown>;
  submitLabel: string;
  defaults?: {
    title?: string;
    timeMarker?: string;
    durationMin?: string;
    body?: string;
  };
}) {
  return (
    <form action={action} className="ornate-card p-6 sm:p-8 space-y-5">
      <Field
        label="Activity title *"
        name="title"
        placeholder="e.g. Identity Pillars Audit"
        defaultValue={defaults?.title}
        required
      />
      <div className="grid sm:grid-cols-2 gap-5">
        <Field
          label="Time marker (optional)"
          name="timeMarker"
          placeholder="1:05"
          defaultValue={defaults?.timeMarker}
        />
        <Field
          label="Duration (minutes, optional)"
          name="durationMin"
          type="number"
          placeholder="15"
          defaultValue={defaults?.durationMin}
        />
      </div>
      <FieldArea
        label="Activity body *"
        name="body"
        defaultValue={defaults?.body}
        rows={18}
        placeholder={`Write the activity line by line.\n\nAny line in [square brackets] becomes a facilitator note —\ne.g. [4 minutes of writing time — hold silence]`}
      />
      <p className="text-xs text-ink/55 -mt-2">
        Tip — wrap stage directions in{" "}
        <code className="font-mono bg-cream-muted px-1 rounded">[brackets]</code>.
        They render in a softer italic style on the public page so readers can
        tell facilitator cues apart from spoken script.
      </p>

      <div className="pt-3 flex items-center justify-between">
        <Link href="../" className="btn-ghost text-sm">
          Cancel
        </Link>
        <button type="submit" className="btn-primary">
          {submitLabel}
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
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
        className="w-full px-3 py-2.5 rounded-lg border border-cream-muted bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-emerald-deep/30 focus:border-emerald-deep transition resize-y font-mono leading-relaxed"
      />
    </label>
  );
}
