"use client";

import { useState, useCallback, useRef } from "react";
import {
  Save,
  RotateCcw,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  X,
  ArrowUp,
  ArrowDown,
  GripVertical,
  FileText,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import type {
  SiteContent,
  SectionVisibility,
  FormConfig,
  FormQuestionSet,
  FormSection,
  FormField,
} from "@/lib/content-types";
import { updateContent, resetToDefaults } from "./actions";

// ---------------------------------------------------------------------------
// Reusable field components
// ---------------------------------------------------------------------------

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
      {help && <span className="block text-[11px] text-ink/40 mt-0.5">{help}</span>}
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

// ---------------------------------------------------------------------------
// Toggle switch
// ---------------------------------------------------------------------------

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
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
        checked ? "bg-emerald-deep" : "bg-ink/20"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Collapsible section wrapper (with optional visibility toggle)
// ---------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  icon,
  defaultOpen = false,
  visible,
  onVisibilityChange,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: string;
  defaultOpen?: boolean;
  visible?: boolean;
  onVisibilityChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasVisibility = visible !== undefined && onVisibilityChange;
  return (
    <div
      className={`ornate-card overflow-hidden transition-opacity ${
        hasVisibility && !visible ? "opacity-60" : ""
      }`}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className="w-full flex items-center justify-between p-5 hover:bg-cream-warm/30 transition text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {icon && <span className="text-lg shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-ink/40 truncate mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          {hasVisibility && (
            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {visible ? (
                <Eye className="h-3.5 w-3.5 text-emerald-deep" />
              ) : (
                <EyeOff className="h-3.5 w-3.5 text-ink/30" />
              )}
              <Toggle
                checked={visible}
                onChange={onVisibilityChange}
                label={`${visible ? "Hide" : "Show"} ${title} section`}
              />
            </div>
          )}
          <ChevronDown
            className={`h-5 w-5 text-ink/40 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      {open && (
        <div className="px-5 pb-6 pt-2 border-t border-cream-muted space-y-5">
          {children}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

export function ContentEditor({
  initialContent,
}: {
  initialContent: SiteContent;
}) {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [logoError, setLogoError] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Deep setter helper — restricted to object-valued sections
  type ObjectKeys = {
    [K in keyof SiteContent]: SiteContent[K] extends object ? K : never;
  }[keyof SiteContent];

  const set = useCallback(
    <K extends ObjectKeys>(
      section: K,
      patch: Partial<SiteContent[K]>
    ) => {
      setContent((prev) => ({
        ...prev,
        [section]: { ...(prev[section] as object), ...(patch as object) },
      }));
      setDirty(true);
    },
    []
  );

  const setVis = useCallback(
    (key: keyof SectionVisibility, val: boolean) => {
      setContent((prev) => ({
        ...prev,
        visibility: { ...prev.visibility, [key]: val },
      }));
      setDirty(true);
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    const result = await updateContent(JSON.stringify(content));
    setSaving(false);
    if (result.ok) {
      setDirty(false);
      toast.success("Content saved. Changes are live.");
    } else {
      toast.error(result.error ?? "Save failed.");
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Reset ALL content to defaults? This cannot be undone. Any custom edits will be lost."
      )
    )
      return;
    setResetting(true);
    const result = await resetToDefaults();
    setResetting(false);
    if (result.ok) {
      // Reload to get fresh defaults
      window.location.reload();
    } else {
      toast.error(result.error ?? "Reset failed.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-40 bg-cream/90 backdrop-blur-lg border-b border-cream-muted -mx-4 px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {dirty && (
            <span className="inline-flex items-center gap-1.5 text-xs text-gold-antique font-medium">
              <span className="h-2 w-2 rounded-full bg-gold-antique animate-pulse" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="btn-ghost !py-2 !px-4 text-xs"
          >
            {resetting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RotateCcw className="h-3.5 w-3.5" />
            )}
            Reset to defaults
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

      {/* ─── Logo ─── */}
      <Section title="Logo" icon="🖼️" defaultOpen>
        <div className="space-y-4">
          <Field label="Logo Preview">
            <div className="flex items-center gap-4">
              {content.customLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={content.customLogo}
                  alt="Custom logo"
                  className="h-12 w-12 object-contain rounded border border-cream-muted bg-white p-1"
                />
              ) : (
                <span className="text-sm text-ink/50 italic">
                  Using default SVG logo
                </span>
              )}
            </div>
          </Field>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            className="hidden"
            onChange={(e) => {
              setLogoError("");
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 200 * 1024) {
                setLogoError(
                  `File is ${(file.size / 1024).toFixed(0)} KB — maximum is 200 KB.`
                );
                e.target.value = "";
                return;
              }
              const reader = new FileReader();
              reader.onload = () => {
                setContent((prev) => ({
                  ...prev,
                  customLogo: reader.result as string,
                }));
                setDirty(true);
              };
              reader.readAsDataURL(file);
              e.target.value = "";
            }}
          />

          {logoError && (
            <p className="text-xs text-red-500 font-medium">{logoError}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="btn-ghost !py-2 !px-4 text-xs flex items-center gap-1.5"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Logo
            </button>
            {content.customLogo && (
              <button
                type="button"
                onClick={() => {
                  setContent((prev) => ({ ...prev, customLogo: "" }));
                  setDirty(true);
                  setLogoError("");
                }}
                className="btn-ghost !py-2 !px-4 text-xs flex items-center gap-1.5 text-red-500 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" />
                Remove Custom Logo
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ─── Navigation ─── */}
      <Section title="Navigation" icon="🧭" defaultOpen={true}>
        <Field label="CTA Button Label" help="The primary button in the navbar">
          <TextInput
            value={content.nav.ctaLabel}
            onChange={(v) => set("nav", { ctaLabel: v })}
          />
        </Field>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-2">
            Nav Items
          </p>
          {content.nav.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <TextInput
                value={item.label}
                onChange={(v) => {
                  const items = [...content.nav.items];
                  items[i] = { ...items[i], label: v };
                  set("nav", { items });
                }}
                placeholder="Label"
              />
              <TextInput
                value={item.href}
                onChange={(v) => {
                  const items = [...content.nav.items];
                  items[i] = { ...items[i], href: v };
                  set("nav", { items });
                }}
                placeholder="href"
              />
              <button
                type="button"
                onClick={() => {
                  const items = content.nav.items.filter((_, idx) => idx !== i);
                  set("nav", { items });
                }}
                className="p-2 text-red-400 hover:text-red-600 transition shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              set("nav", {
                items: [...content.nav.items, { label: "", href: "/" }],
              });
            }}
            className="text-xs text-emerald-deep hover:underline flex items-center gap-1 mt-1"
          >
            <Plus className="h-3 w-3" /> Add nav item
          </button>
        </div>
      </Section>

      {/* ─── Hero ─── */}
      <Section
        title="Hero"
        subtitle={content.hero.englishTitle}
        icon="🏠"
        defaultOpen={true}
        visible={content.visibility.hero}
        onVisibilityChange={(v) => setVis("hero", v)}
      >
        <Field label="Eyebrow">
          <TextInput
            value={content.hero.eyebrow}
            onChange={(v) => set("hero", { eyebrow: v })}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Arabic Title">
            <TextInput
              value={content.hero.arabicTitle}
              onChange={(v) => set("hero", { arabicTitle: v })}
            />
          </Field>
          <Field label="English Title">
            <TextInput
              value={content.hero.englishTitle}
              onChange={(v) => set("hero", { englishTitle: v })}
            />
          </Field>
        </div>
        <Field label="Tagline">
          <TextInput
            value={content.hero.tagline}
            onChange={(v) => set("hero", { tagline: v })}
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={content.hero.description}
            onChange={(v) => set("hero", { description: v })}
            rows={4}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Primary CTA Label">
            <TextInput
              value={content.hero.primaryCtaLabel}
              onChange={(v) => set("hero", { primaryCtaLabel: v })}
            />
          </Field>
          <Field label="Secondary CTA Label">
            <TextInput
              value={content.hero.secondaryCtaLabel}
              onChange={(v) => set("hero", { secondaryCtaLabel: v })}
            />
          </Field>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-2">
            Stats
          </p>
          {content.hero.stats.map((stat, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                className="input-field !w-20"
                value={stat.value}
                onChange={(e) => {
                  const stats = [...content.hero.stats];
                  stats[i] = { ...stats[i], value: e.target.value };
                  set("hero", { stats });
                }}
                placeholder="Value"
              />
              <TextInput
                value={stat.label}
                onChange={(v) => {
                  const stats = [...content.hero.stats];
                  stats[i] = { ...stats[i], label: v };
                  set("hero", { stats });
                }}
                placeholder="Label"
              />
              <button
                type="button"
                onClick={() => {
                  const stats = content.hero.stats.filter((_, idx) => idx !== i);
                  set("hero", { stats });
                }}
                className="p-2 text-red-400 hover:text-red-600 transition shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              set("hero", {
                stats: [...content.hero.stats, { value: "", label: "" }],
              });
            }}
            className="text-xs text-emerald-deep hover:underline flex items-center gap-1 mt-1"
          >
            <Plus className="h-3 w-3" /> Add stat
          </button>
        </div>
      </Section>

      {/* ─── About ─── */}
      <Section
        title="About / Vision & Mission"
        subtitle={content.about.heading}
        icon="📖"
        defaultOpen={true}
        visible={content.visibility.about}
        onVisibilityChange={(v) => setVis("about", v)}
      >
        <Field label="Eyebrow">
          <TextInput
            value={content.about.eyebrow}
            onChange={(v) => set("about", { eyebrow: v })}
          />
        </Field>
        <Field label="Heading">
          <TextInput
            value={content.about.heading}
            onChange={(v) => set("about", { heading: v })}
          />
        </Field>
        <Field label="Lead Paragraph">
          <TextArea
            value={content.about.lead}
            onChange={(v) => set("about", { lead: v })}
            rows={4}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Vision Arabic">
            <TextInput
              value={content.about.visionArabic}
              onChange={(v) => set("about", { visionArabic: v })}
            />
          </Field>
          <Field label="Vision Title">
            <TextInput
              value={content.about.visionTitle}
              onChange={(v) => set("about", { visionTitle: v })}
            />
          </Field>
        </div>
        <Field label="Vision Body">
          <TextArea
            value={content.about.visionBody}
            onChange={(v) => set("about", { visionBody: v })}
            rows={4}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mission Arabic">
            <TextInput
              value={content.about.missionArabic}
              onChange={(v) => set("about", { missionArabic: v })}
            />
          </Field>
          <Field label="Mission Title">
            <TextInput
              value={content.about.missionTitle}
              onChange={(v) => set("about", { missionTitle: v })}
            />
          </Field>
        </div>
        <Field label="Mission Body">
          <TextArea
            value={content.about.missionBody}
            onChange={(v) => set("about", { missionBody: v })}
            rows={4}
          />
        </Field>
        <Field label="Values Heading">
          <TextInput
            value={content.about.valuesHeading}
            onChange={(v) => set("about", { valuesHeading: v })}
          />
        </Field>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-2">
            Values
          </p>
          {content.about.values.map((val, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-cream-muted mb-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-deep">
                  Value {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const values = content.about.values.filter(
                      (_, idx) => idx !== i
                    );
                    set("about", { values });
                  }}
                  className="p-1 text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <TextInput
                  value={val.icon}
                  onChange={(v) => {
                    const values = [...content.about.values];
                    values[i] = { ...values[i], icon: v };
                    set("about", { values });
                  }}
                  placeholder="Icon name"
                />
                <TextInput
                  value={val.arabic}
                  onChange={(v) => {
                    const values = [...content.about.values];
                    values[i] = { ...values[i], arabic: v };
                    set("about", { values });
                  }}
                  placeholder="Arabic"
                />
                <TextInput
                  value={val.title}
                  onChange={(v) => {
                    const values = [...content.about.values];
                    values[i] = { ...values[i], title: v };
                    set("about", { values });
                  }}
                  placeholder="Title"
                />
              </div>
              <TextArea
                value={val.text}
                onChange={(v) => {
                  const values = [...content.about.values];
                  values[i] = { ...values[i], text: v };
                  set("about", { values });
                }}
                rows={2}
                placeholder="Description"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              set("about", {
                values: [
                  ...content.about.values,
                  { icon: "Heart", arabic: "", title: "", text: "" },
                ],
              });
            }}
            className="text-xs text-emerald-deep hover:underline flex items-center gap-1 mt-1"
          >
            <Plus className="h-3 w-3" /> Add value
          </button>
        </div>
      </Section>

      {/* ─── Structure ─── */}
      <Section
        title="Organizational Model"
        subtitle={content.structure.heading}
        icon="🏛️"
        defaultOpen={true}
        visible={content.visibility.structure}
        onVisibilityChange={(v) => setVis("structure", v)}
      >
        <Field label="Eyebrow">
          <TextInput
            value={content.structure.eyebrow}
            onChange={(v) => set("structure", { eyebrow: v })}
          />
        </Field>
        <Field label="Heading">
          <TextInput
            value={content.structure.heading}
            onChange={(v) => set("structure", { heading: v })}
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={content.structure.description}
            onChange={(v) => set("structure", { description: v })}
            rows={4}
          />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Advisor Label">
            <TextInput
              value={content.structure.advisorLabel}
              onChange={(v) => set("structure", { advisorLabel: v })}
            />
          </Field>
          <Field label="Advisor Arabic">
            <TextInput
              value={content.structure.advisorArabic}
              onChange={(v) => set("structure", { advisorArabic: v })}
            />
          </Field>
          <Field label="Advisor Tagline">
            <TextInput
              value={content.structure.advisorTagline}
              onChange={(v) => set("structure", { advisorTagline: v })}
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-emerald-deep font-medium">
              Brothers&apos; Cohort
            </h4>
            <Field label="Label">
              <TextInput
                value={content.structure.maleWingLabel}
                onChange={(v) => set("structure", { maleWingLabel: v })}
              />
            </Field>
            <Field label="Arabic">
              <TextInput
                value={content.structure.maleWingArabic}
                onChange={(v) => set("structure", { maleWingArabic: v })}
              />
            </Field>
            <Field label="Head Role Title">
              <TextInput
                value={content.structure.maleWingRoleTitle}
                onChange={(v) => set("structure", { maleWingRoleTitle: v })}
              />
            </Field>
            <Field label="Roles (one per line)">
              <TextArea
                value={content.structure.maleWingRoles.join("\n")}
                onChange={(v) =>
                  set("structure", {
                    maleWingRoles: v.split("\n").filter(Boolean),
                  })
                }
                rows={5}
              />
            </Field>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs uppercase tracking-wider text-gold-antique font-medium">
              Sisters&apos; Cohort
            </h4>
            <Field label="Label">
              <TextInput
                value={content.structure.femaleWingLabel}
                onChange={(v) => set("structure", { femaleWingLabel: v })}
              />
            </Field>
            <Field label="Arabic">
              <TextInput
                value={content.structure.femaleWingArabic}
                onChange={(v) => set("structure", { femaleWingArabic: v })}
              />
            </Field>
            <Field label="Head Role Title">
              <TextInput
                value={content.structure.femaleWingRoleTitle}
                onChange={(v) =>
                  set("structure", { femaleWingRoleTitle: v })
                }
              />
            </Field>
            <Field label="Roles (one per line)">
              <TextArea
                value={content.structure.femaleWingRoles.join("\n")}
                onChange={(v) =>
                  set("structure", {
                    femaleWingRoles: v.split("\n").filter(Boolean),
                  })
                }
                rows={5}
              />
            </Field>
          </div>
        </div>
        <Field label="Why This Model Works — Heading">
          <TextInput
            value={content.structure.whyWorksHeading}
            onChange={(v) => set("structure", { whyWorksHeading: v })}
          />
        </Field>
        <Field label="Why This Model Works — Items (one per line)">
          <TextArea
            value={content.structure.whyWorksItems.join("\n\n")}
            onChange={(v) =>
              set("structure", {
                whyWorksItems: v
                  .split("\n\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            rows={10}
          />
        </Field>
      </Section>

      {/* ─── Roadmap ─── */}
      <Section
        title="Roadmap"
        subtitle={content.roadmap.heading}
        icon="🗓️"
        defaultOpen={true}
        visible={content.visibility.roadmap}
        onVisibilityChange={(v) => setVis("roadmap", v)}
      >
        <Field label="Eyebrow">
          <TextInput
            value={content.roadmap.eyebrow}
            onChange={(v) => set("roadmap", { eyebrow: v })}
          />
        </Field>
        <Field label="Heading">
          <TextInput
            value={content.roadmap.heading}
            onChange={(v) => set("roadmap", { heading: v })}
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={content.roadmap.description}
            onChange={(v) => set("roadmap", { description: v })}
            rows={3}
          />
        </Field>
        <div>
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-2">
            Phases
          </p>
          {content.roadmap.phases.map((phase, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-cream-muted mb-3 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-emerald-deep">
                  {phase.phase || `Phase ${i + 1}`}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const phases = content.roadmap.phases.filter(
                      (_, idx) => idx !== i
                    );
                    set("roadmap", { phases });
                  }}
                  className="p-1 text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <TextInput
                  value={phase.phase}
                  onChange={(v) => {
                    const phases = [...content.roadmap.phases];
                    phases[i] = { ...phases[i], phase: v };
                    set("roadmap", { phases });
                  }}
                  placeholder="Phase #"
                />
                <TextInput
                  value={phase.timeframe}
                  onChange={(v) => {
                    const phases = [...content.roadmap.phases];
                    phases[i] = { ...phases[i], timeframe: v };
                    set("roadmap", { phases });
                  }}
                  placeholder="Timeframe"
                />
                <TextInput
                  value={phase.title}
                  onChange={(v) => {
                    const phases = [...content.roadmap.phases];
                    phases[i] = { ...phases[i], title: v };
                    set("roadmap", { phases });
                  }}
                  placeholder="Title"
                />
              </div>
              <TextArea
                value={phase.description}
                onChange={(v) => {
                  const phases = [...content.roadmap.phases];
                  phases[i] = { ...phases[i], description: v };
                  set("roadmap", { phases });
                }}
                rows={3}
                placeholder="Description"
              />
              <TextInput
                value={phase.metric}
                onChange={(v) => {
                  const phases = [...content.roadmap.phases];
                  phases[i] = { ...phases[i], metric: v };
                  set("roadmap", { phases });
                }}
                placeholder="Success metric"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              set("roadmap", {
                phases: [
                  ...content.roadmap.phases,
                  {
                    phase: `Phase ${content.roadmap.phases.length + 1}`,
                    timeframe: "",
                    title: "",
                    description: "",
                    metric: "",
                  },
                ],
              });
            }}
            className="text-xs text-emerald-deep hover:underline flex items-center gap-1 mt-1"
          >
            <Plus className="h-3 w-3" /> Add phase
          </button>
        </div>
      </Section>

      {/* ─── CTA ─── */}
      <Section
        title="Call to Action"
        subtitle={content.cta.heading}
        icon="📢"
        defaultOpen={true}
        visible={content.visibility.cta}
        onVisibilityChange={(v) => setVis("cta", v)}
      >
        <Field label="Arabic Title">
          <TextInput
            value={content.cta.arabicTitle}
            onChange={(v) => set("cta", { arabicTitle: v })}
          />
        </Field>
        <Field label="Heading">
          <TextInput
            value={content.cta.heading}
            onChange={(v) => set("cta", { heading: v })}
          />
        </Field>
        <Field label="Description">
          <TextArea
            value={content.cta.description}
            onChange={(v) => set("cta", { description: v })}
            rows={4}
          />
        </Field>
        <Field label="Button Label">
          <TextInput
            value={content.cta.buttonLabel}
            onChange={(v) => set("cta", { buttonLabel: v })}
          />
        </Field>
      </Section>

      {/* ─── Footer ─── */}
      <Section title="Footer" subtitle="Always visible" icon="📋" defaultOpen={true}>
        <Field label="Tagline">
          <TextArea
            value={content.footer.tagline}
            onChange={(v) => set("footer", { tagline: v })}
            rows={3}
          />
        </Field>
        <Field label="Quote">
          <TextArea
            value={content.footer.quote}
            onChange={(v) => set("footer", { quote: v })}
            rows={2}
          />
        </Field>
        <Field label="Quote Attribution">
          <TextInput
            value={content.footer.quoteAttribution}
            onChange={(v) => set("footer", { quoteAttribution: v })}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Explore Heading">
            <TextInput
              value={content.footer.exploreHeading}
              onChange={(v) => set("footer", { exploreHeading: v })}
            />
          </Field>
          <Field label="Structure Heading">
            <TextInput
              value={content.footer.structureHeading}
              onChange={(v) => set("footer", { structureHeading: v })}
            />
          </Field>
        </div>
        <Field label="Structure Items (one per line)">
          <TextArea
            value={content.footer.structureItems.join("\n")}
            onChange={(v) =>
              set("footer", {
                structureItems: v.split("\n").filter(Boolean),
              })
            }
            rows={4}
          />
        </Field>
        <Field label="Small Print (bottom right)">
          <TextInput
            value={content.footer.smallPrint}
            onChange={(v) => set("footer", { smallPrint: v })}
          />
        </Field>
      </Section>

      {/* ─── Application Forms ─── */}
      <Section
        title="Application Forms"
        subtitle="Manage form fields for each position"
        icon="📝"
        defaultOpen={false}
      >
        <FormConfigEditor
          formConfig={content.formConfig}
          onChange={(fc) => {
            setContent((prev) => ({ ...prev, formConfig: fc }));
            setDirty(true);
          }}
        />
      </Section>
    </div>
  );
}

// ===========================================================================
// Application Forms Editor
// ===========================================================================

const FIELD_TYPES: Array<{ value: FormField["type"]; label: string }> = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "url", label: "URL" },
];

const POSITION_TABS = [
  { slug: "male-head", label: "Male Head" },
  { slug: "female-head", label: "Female Head" },
];

function FormConfigEditor({
  formConfig,
  onChange,
}: {
  formConfig: FormConfig;
  onChange: (fc: FormConfig) => void;
}) {
  const [activeTab, setActiveTab] = useState(POSITION_TABS[0].slug);

  const activeQs = formConfig[activeTab];

  function updateQs(slug: string, qs: FormQuestionSet) {
    onChange({ ...formConfig, [slug]: qs });
  }

  function handleCopyToOther() {
    const otherSlug = activeTab === "male-head" ? "female-head" : "male-head";
    const otherLabel = activeTab === "male-head" ? "Female Head" : "Male Head";
    if (
      !confirm(
        `Copy all sections and fields from this form to the ${otherLabel} form? This will overwrite the ${otherLabel} form entirely.`
      )
    )
      return;
    if (!activeQs) return;
    const copied: FormQuestionSet = {
      ...JSON.parse(JSON.stringify(activeQs)),
      id: otherSlug,
      name: otherSlug === "male-head" ? "Male Head Application" : "Female Head Application",
    };
    onChange({ ...formConfig, [otherSlug]: copied });
    toast.success(`Form copied to ${otherLabel}.`);
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-ink/50 leading-relaxed">
        Customize the application form for each position. Changes here override the static defaults.
        Sections and fields can be added, removed, reordered, and edited.
      </p>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-cream-muted pb-0">
        {POSITION_TABS.map((tab) => (
          <button
            key={tab.slug}
            type="button"
            onClick={() => setActiveTab(tab.slug)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.slug
                ? "border-emerald-deep text-emerald-deep"
                : "border-transparent text-ink/50 hover:text-ink/70 hover:border-cream-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleCopyToOther}
          className="text-xs text-ink/50 hover:text-emerald-deep flex items-center gap-1 transition px-2 py-1"
          title={`Copy this form to the other position`}
        >
          <Copy className="h-3 w-3" />
          Copy to {activeTab === "male-head" ? "Female" : "Male"} Head
        </button>
      </div>

      {activeQs ? (
        <FormQuestionSetEditor
          qs={activeQs}
          onChange={(qs) => updateQs(activeTab, qs)}
        />
      ) : (
        <div className="text-center py-8 text-ink/40 text-sm">
          <p>No form configured for this position.</p>
          <button
            type="button"
            onClick={() => {
              const newQs: FormQuestionSet = {
                id: activeTab,
                name: `${POSITION_TABS.find((t) => t.slug === activeTab)?.label ?? ""} Application`,
                description: "",
                sections: [],
              };
              updateQs(activeTab, newQs);
            }}
            className="mt-3 text-xs text-emerald-deep hover:underline flex items-center gap-1 mx-auto"
          >
            <Plus className="h-3 w-3" />
            Create form
          </button>
        </div>
      )}
    </div>
  );
}

function FormQuestionSetEditor({
  qs,
  onChange,
}: {
  qs: FormQuestionSet;
  onChange: (qs: FormQuestionSet) => void;
}) {
  function updateSection(idx: number, section: FormSection) {
    const sections = [...qs.sections];
    sections[idx] = section;
    onChange({ ...qs, sections });
  }

  function removeSection(idx: number) {
    if (!confirm(`Remove the section "${qs.sections[idx].title}"? All fields inside it will be deleted.`))
      return;
    onChange({ ...qs, sections: qs.sections.filter((_, i) => i !== idx) });
  }

  function moveSection(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= qs.sections.length) return;
    const sections = [...qs.sections];
    [sections[idx], sections[target]] = [sections[target], sections[idx]];
    onChange({ ...qs, sections });
  }

  function addSection() {
    const newId = `section-${Date.now()}`;
    const newSection: FormSection = {
      id: newId,
      title: "New Section",
      description: "",
      arabicTitle: "",
      fields: [],
    };
    onChange({ ...qs, sections: [...qs.sections, newSection] });
  }

  return (
    <div className="space-y-4">
      {/* Form-level metadata */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Form Name">
          <TextInput
            value={qs.name}
            onChange={(v) => onChange({ ...qs, name: v })}
            placeholder="e.g., Head Application"
          />
        </Field>
        <Field label="Form Description">
          <TextInput
            value={qs.description}
            onChange={(v) => onChange({ ...qs, description: v })}
            placeholder="Brief description of this form"
          />
        </Field>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
          Sections ({qs.sections.length})
        </p>
        {qs.sections.map((section, sIdx) => (
          <FormSectionEditor
            key={section.id}
            section={section}
            sectionIndex={sIdx}
            totalSections={qs.sections.length}
            onChange={(s) => updateSection(sIdx, s)}
            onRemove={() => removeSection(sIdx)}
            onMove={(dir) => moveSection(sIdx, dir)}
          />
        ))}
        <button
          type="button"
          onClick={addSection}
          className="text-xs text-emerald-deep hover:underline flex items-center gap-1 mt-2"
        >
          <Plus className="h-3 w-3" />
          Add section
        </button>
      </div>
    </div>
  );
}

function FormSectionEditor({
  section,
  sectionIndex,
  totalSections,
  onChange,
  onRemove,
  onMove,
}: {
  section: FormSection;
  sectionIndex: number;
  totalSections: number;
  onChange: (s: FormSection) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  function updateField(idx: number, field: FormField) {
    const fields = [...section.fields];
    fields[idx] = field;
    onChange({ ...section, fields });
  }

  function removeField(idx: number) {
    onChange({ ...section, fields: section.fields.filter((_, i) => i !== idx) });
  }

  function moveField(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= section.fields.length) return;
    const fields = [...section.fields];
    [fields[idx], fields[target]] = [fields[target], fields[idx]];
    onChange({ ...section, fields });
  }

  function addField() {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: "text",
      label: "New Field",
      required: false,
    };
    onChange({ ...section, fields: [...section.fields, newField] });
  }

  return (
    <div className="rounded-lg border border-cream-muted overflow-hidden bg-white">
      {/* Section header bar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex items-center gap-2 px-4 py-3 bg-cream-warm/40 hover:bg-cream-warm/60 transition cursor-pointer select-none"
      >
        <FileText className="h-4 w-4 text-emerald-deep/60 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-emerald-deep truncate">
            {section.title || "Untitled Section"}
          </span>
          <span className="text-xs text-ink/40 ml-2">
            ({section.fields.length} field{section.fields.length !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={sectionIndex === 0}
            className="p-1 text-ink/40 hover:text-emerald-deep disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Move up"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={sectionIndex === totalSections - 1}
            className="p-1 text-ink/40 hover:text-emerald-deep disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Move down"
          >
            <ArrowDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600 transition ml-1"
            title="Remove section"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-ink/40 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="px-4 py-4 space-y-4 border-t border-cream-muted">
          {/* Section metadata */}
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Section Title">
              <TextInput
                value={section.title}
                onChange={(v) => onChange({ ...section, title: v })}
                placeholder="e.g., Basic Information"
              />
            </Field>
            <Field label="Arabic Title (optional)">
              <TextInput
                value={section.arabicTitle ?? ""}
                onChange={(v) => onChange({ ...section, arabicTitle: v || undefined })}
                placeholder="e.g., المعلومات الأساسية"
              />
            </Field>
            <Field label="Section ID">
              <TextInput
                value={section.id}
                onChange={(v) => onChange({ ...section, id: v })}
                placeholder="unique-id"
              />
            </Field>
          </div>
          <Field label="Section Description (optional)">
            <TextArea
              value={section.description ?? ""}
              onChange={(v) => onChange({ ...section, description: v || undefined })}
              rows={2}
              placeholder="Brief instructions shown at the top of this section"
            />
          </Field>

          {/* Fields */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
              Fields ({section.fields.length})
            </p>
            {section.fields.map((field, fIdx) => (
              <FormFieldEditor
                key={field.id}
                field={field}
                fieldIndex={fIdx}
                totalFields={section.fields.length}
                onChange={(f) => updateField(fIdx, f)}
                onRemove={() => removeField(fIdx)}
                onMove={(dir) => moveField(fIdx, dir)}
              />
            ))}
            <button
              type="button"
              onClick={addField}
              className="text-xs text-emerald-deep hover:underline flex items-center gap-1 mt-2"
            >
              <Plus className="h-3 w-3" />
              Add field
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FormFieldEditor({
  field,
  fieldIndex,
  totalFields,
  onChange,
  onRemove,
  onMove,
}: {
  field: FormField;
  fieldIndex: number;
  totalFields: number;
  onChange: (f: FormField) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const hasOptions = field.type === "select" || field.type === "radio" || field.type === "checkbox";

  return (
    <div className="rounded-lg border border-cream-muted/80 bg-cream-warm/20 overflow-hidden">
      {/* Field header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="flex items-center gap-2 px-3 py-2 hover:bg-cream-warm/40 transition cursor-pointer select-none"
      >
        <GripVertical className="h-3.5 w-3.5 text-ink/25 shrink-0" />
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs text-ink/70 truncate">
            {field.label || "Untitled"}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-ink/5 text-ink/40 shrink-0">
            {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
          </span>
          {field.required && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-antique/10 text-gold-antique shrink-0">
              required
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={fieldIndex === 0}
            className="p-1 text-ink/30 hover:text-emerald-deep disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Move up"
          >
            <ArrowUp className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={fieldIndex === totalFields - 1}
            className="p-1 text-ink/30 hover:text-emerald-deep disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Move down"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-red-400 hover:text-red-600 transition ml-0.5"
            title="Remove field"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-ink/30 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {expanded && (
        <div className="px-3 py-3 space-y-3 border-t border-cream-muted/60">
          {/* Row 1: label + type + required */}
          <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
            <Field label="Label">
              <TextInput
                value={field.label}
                onChange={(v) => onChange({ ...field, label: v })}
                placeholder="Field label shown to applicant"
              />
            </Field>
            <Field label="Type">
              <select
                className="input-field appearance-none bg-white pr-8 min-w-[120px]"
                value={field.type}
                onChange={(e) =>
                  onChange({ ...field, type: e.target.value as FormField["type"] })
                }
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Required">
              <div className="pt-1">
                <Toggle
                  checked={!!field.required}
                  onChange={(v) => onChange({ ...field, required: v })}
                  label="Required"
                />
              </div>
            </Field>
          </div>

          {/* Row 2: ID + placeholder */}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Field ID" help="Unique key for form data">
              <TextInput
                value={field.id}
                onChange={(v) => onChange({ ...field, id: v })}
                placeholder="e.g., fullName"
              />
            </Field>
            <Field label="Placeholder (optional)">
              <TextInput
                value={field.placeholder ?? ""}
                onChange={(v) => onChange({ ...field, placeholder: v || undefined })}
                placeholder="Placeholder text"
              />
            </Field>
          </div>

          {/* Row 3: help text */}
          <Field label="Help Text (optional)">
            <TextInput
              value={field.help ?? ""}
              onChange={(v) => onChange({ ...field, help: v || undefined })}
              placeholder="Additional guidance shown below the field"
            />
          </Field>

          {/* Row 4: validation constraints (contextual) */}
          {(field.type === "text" || field.type === "textarea") && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Min Length">
                <input
                  type="number"
                  className="input-field"
                  value={field.minLength ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      minLength: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={0}
                  placeholder="No minimum"
                />
              </Field>
              <Field label="Max Length">
                <input
                  type="number"
                  className="input-field"
                  value={field.maxLength ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      maxLength: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  min={0}
                  placeholder="No maximum"
                />
              </Field>
            </div>
          )}

          {field.type === "number" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Min Value">
                <input
                  type="number"
                  className="input-field"
                  value={field.min ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="No minimum"
                />
              </Field>
              <Field label="Max Value">
                <input
                  type="number"
                  className="input-field"
                  value={field.max ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...field,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="No maximum"
                />
              </Field>
            </div>
          )}

          {field.type === "checkbox" && (
            <Field label="Min Selections Required">
              <input
                type="number"
                className="input-field !w-24"
                value={field.minSelected ?? ""}
                onChange={(e) =>
                  onChange({
                    ...field,
                    minSelected: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                min={0}
                placeholder="1"
              />
            </Field>
          )}

          {/* Options editor for select/radio/checkbox */}
          {hasOptions && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
                Options
              </p>
              {(field.options ?? []).map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <TextInput
                    value={opt.label}
                    onChange={(v) => {
                      const options = [...(field.options ?? [])];
                      options[oIdx] = { ...options[oIdx], label: v };
                      onChange({ ...field, options });
                    }}
                    placeholder="Label"
                  />
                  <TextInput
                    value={opt.value}
                    onChange={(v) => {
                      const options = [...(field.options ?? [])];
                      options[oIdx] = { ...options[oIdx], value: v };
                      onChange({ ...field, options });
                    }}
                    placeholder="Value"
                  />
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (oIdx === 0) return;
                        const options = [...(field.options ?? [])];
                        [options[oIdx], options[oIdx - 1]] = [options[oIdx - 1], options[oIdx]];
                        onChange({ ...field, options });
                      }}
                      disabled={oIdx === 0}
                      className="p-1 text-ink/30 hover:text-emerald-deep disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move option up"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const options = field.options ?? [];
                        if (oIdx === options.length - 1) return;
                        const copy = [...options];
                        [copy[oIdx], copy[oIdx + 1]] = [copy[oIdx + 1], copy[oIdx]];
                        onChange({ ...field, options: copy });
                      }}
                      disabled={oIdx === (field.options ?? []).length - 1}
                      className="p-1 text-ink/30 hover:text-emerald-deep disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move option down"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const options = (field.options ?? []).filter((_, i) => i !== oIdx);
                        onChange({ ...field, options });
                      }}
                      className="p-1 text-red-400 hover:text-red-600 transition"
                      title="Remove option"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const options = [...(field.options ?? []), { label: "", value: "" }];
                  onChange({ ...field, options });
                }}
                className="text-xs text-emerald-deep hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add option
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
