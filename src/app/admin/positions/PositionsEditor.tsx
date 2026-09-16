"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Check,
  ChevronDown,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { Position, Wing, PositionLevel } from "@/lib/content-types";
import { updatePositions } from "./actions";

const WING_OPTIONS: { value: Wing; label: string }[] = [
  { value: "male", label: "Brothers' Cohort" },
  { value: "female", label: "Sisters' Cohort" },
  { value: "both", label: "Either Cohort" },
];

const LEVEL_OPTIONS: { value: PositionLevel; label: string }[] = [
  { value: "head", label: "Head" },
  { value: "deputy", label: "Deputy" },
  { value: "lead", label: "Lead" },
  { value: "member", label: "Member" },
];

function blankPosition(priority: number): Position {
  return {
    slug: "",
    title: "",
    arabicTitle: "",
    wing: "both",
    level: "member",
    reportsTo: "",
    summary: "",
    responsibilities: [],
    idealProfile: [],
    commitment: "",
    termLength: "",
    questionSet: "general-member",
    open: false,
    closesOn: "",
    priority,
  };
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/50 font-medium">
        {label}
      </span>
      {help && (
        <span className="block text-[11px] text-ink/40 mt-0.5">{help}</span>
      )}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      className="input-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      className="input-field resize-y"
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] transition-colors ${
        checked
          ? "bg-emerald-deep border-emerald-deep"
          : "bg-transparent border-line-strong"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full transition-transform ${
          checked ? "translate-x-5 bg-white" : "translate-x-1 bg-ink/40"
        }`}
      />
    </button>
  );
}

function PositionCard({
  position,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  position: Position;
  index: number;
  total: number;
  onChange: (patch: Partial<Position>) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronDown
          className={`h-4 w-4 text-ink/40 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-ink truncate">
            {position.title || "Untitled position"}
          </p>
          <p className="text-xs text-ink/50 truncate">
            {position.slug || "no-slug"} · {position.wing} · {position.level}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
            position.open
              ? "border-emerald-deep text-emerald-deep"
              : "border-line-strong text-ink/50"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              position.open ? "bg-emerald-deep" : "bg-ink/30"
            }`}
          />
          {position.open ? "Open" : "Closed"}
        </span>
        <Toggle
          checked={position.open}
          onChange={(v) => onChange({ open: v })}
          label="Open for applications"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove(-1);
          }}
          disabled={index === 0}
          className="text-ink/40 hover:text-emerald-deep disabled:opacity-30 disabled:hover:text-ink/40"
          aria-label="Move up"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove(1);
          }}
          disabled={index === total - 1}
          className="text-ink/40 hover:text-emerald-deep disabled:opacity-30 disabled:hover:text-ink/40"
          aria-label="Move down"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remove "${position.title || position.slug}"?`)) {
              onRemove();
            }
          }}
          className="text-ink/40 hover:text-danger"
          aria-label="Remove position"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="p-4 pt-0 space-y-4 border-t border-border">
          <div className="grid sm:grid-cols-2 gap-4 pt-4">
            <Field label="Slug" help="Used in URLs — /apply/<slug>">
              <TextInput
                value={position.slug}
                onChange={(v) => onChange({ slug: v })}
                placeholder="e.g. male-head"
              />
            </Field>
            <Field label="Title">
              <TextInput
                value={position.title}
                onChange={(v) => onChange({ title: v })}
              />
            </Field>
            <Field label="Arabic Title (optional)">
              <TextInput
                value={position.arabicTitle ?? ""}
                onChange={(v) => onChange({ arabicTitle: v })}
              />
            </Field>
            <Field label="Reports To">
              <TextInput
                value={position.reportsTo}
                onChange={(v) => onChange({ reportsTo: v })}
              />
            </Field>
            <Field label="Wing">
              <select
                className="input-field"
                value={position.wing}
                onChange={(e) => onChange({ wing: e.target.value as Wing })}
              >
                {WING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Level">
              <select
                className="input-field"
                value={position.level}
                onChange={(e) =>
                  onChange({ level: e.target.value as PositionLevel })
                }
              >
                {LEVEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commitment">
              <TextInput
                value={position.commitment}
                onChange={(v) => onChange({ commitment: v })}
                placeholder="e.g. 5-8 hrs/week"
              />
            </Field>
            <Field label="Term Length">
              <TextInput
                value={position.termLength}
                onChange={(v) => onChange({ termLength: v })}
                placeholder="e.g. 1 academic year"
              />
            </Field>
            <Field
              label="Question Set"
              help="Static fallback id from questions.ts — dynamic form config in Content Editor overrides this per slug"
            >
              <TextInput
                value={position.questionSet}
                onChange={(v) => onChange({ questionSet: v })}
              />
            </Field>
            <Field label="Priority" help="Lower shows first">
              <input
                type="number"
                className="input-field"
                value={position.priority}
                onChange={(e) =>
                  onChange({ priority: Number(e.target.value) || 0 })
                }
              />
            </Field>
            <Field label="Closes On (optional)">
              <input
                type="date"
                className="input-field"
                value={position.closesOn ?? ""}
                onChange={(e) => onChange({ closesOn: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Summary">
            <TextArea
              value={position.summary}
              onChange={(v) => onChange({ summary: v })}
              rows={3}
            />
          </Field>

          <Field label="Responsibilities" help="One per line">
            <TextArea
              value={position.responsibilities.join("\n")}
              onChange={(v) =>
                onChange({ responsibilities: v.split("\n").filter(Boolean) })
              }
              rows={5}
            />
          </Field>

          <Field label="Ideal Profile" help="One per line">
            <TextArea
              value={position.idealProfile.join("\n")}
              onChange={(v) =>
                onChange({ idealProfile: v.split("\n").filter(Boolean) })
              }
              rows={5}
            />
          </Field>
        </div>
      )}
    </div>
  );
}

export function PositionsEditor({
  initialPositions,
}: {
  initialPositions: Position[];
}) {
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const patch = useCallback((index: number, p: Partial<Position>) => {
    setPositions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...p };
      return next;
    });
    setDirty(true);
  }, []);

  const remove = useCallback((index: number) => {
    setPositions((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const move = useCallback((index: number, dir: -1 | 1) => {
    setPositions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((p, i) => ({ ...p, priority: i }));
    });
    setDirty(true);
  }, []);

  const addPosition = useCallback(() => {
    setPositions((prev) => [...prev, blankPosition(prev.length)]);
    setDirty(true);
  }, []);

  const handleSave = async () => {
    const slugs = positions.map((p) => p.slug.trim());
    if (slugs.some((s) => !s)) {
      toast.error("Every position needs a slug.");
      return;
    }
    if (new Set(slugs).size !== slugs.length) {
      toast.error("Slugs must be unique.");
      return;
    }
    setSaving(true);
    const result = await updatePositions(JSON.stringify(positions));
    setSaving(false);
    if (result.ok) {
      setDirty(false);
      toast.success("Positions saved. Changes are live.");
    } else {
      toast.error(result.error ?? "Save failed.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-40 bg-bg border-b border-border -mx-4 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber font-medium">
              <span className="h-2 w-2 rounded-full bg-amber animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addPosition}
            className="btn-ghost !py-2 !px-4 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Add position
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !dirty}
            className="btn-primary !py-2 !px-5 text-xs"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : dirty ? (
              <Save className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            {saving ? "Saving..." : dirty ? "Save & Publish" : "Saved"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {positions.map((p, i) => (
          <PositionCard
            key={i}
            position={p}
            index={i}
            total={positions.length}
            onChange={(patchObj) => patch(i, patchObj)}
            onRemove={() => remove(i)}
            onMove={(dir) => move(i, dir)}
          />
        ))}
        {positions.length === 0 && (
          <p className="text-sm text-ink/50 text-center py-10">
            No positions yet. Add one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
