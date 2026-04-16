"use client";

import { useState, useCallback } from "react";
import {
  Save,
  RotateCcw,
  ChevronDown,
  Plus,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { SiteContent } from "@/lib/content-types";
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
// Collapsible section wrapper
// ---------------------------------------------------------------------------

function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="ornate-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 hover:bg-cream-warm/30 transition"
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            {title}
          </h3>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-ink/40 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
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

  // Deep setter helper
  const set = useCallback(
    <K extends keyof SiteContent>(
      section: K,
      patch: Partial<SiteContent[K]>
    ) => {
      setContent((prev) => ({
        ...prev,
        [section]: { ...prev[section], ...patch },
      }));
      setDirty(true);
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    const result = await updateContent(content);
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

      {/* ─── Navigation ─── */}
      <Section title="Navigation" icon="🧭">
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
      <Section title="Hero" icon="🏠" defaultOpen>
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
      <Section title="About / Vision & Mission" icon="📖">
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
      <Section title="Organizational Model" icon="🏛️">
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
      <Section title="Roadmap" icon="🗓️">
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
      <Section title="Call to Action" icon="📢">
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
      <Section title="Footer" icon="📋">
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
    </div>
  );
}
