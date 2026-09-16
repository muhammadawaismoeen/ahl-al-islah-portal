"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { DriveItem } from "@/lib/drive-types";
import { reserveBookAction } from "./actions";

export function ApplyForm({
  driveId,
  items,
  reserveButtonLabel,
}: {
  driveId: string;
  items: DriveItem[];
  reserveButtonLabel: string;
}) {
  const router = useRouter();
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedItemId) {
      setError("Please choose an item first.");
      return;
    }
    setPending(true);
    setError(null);
    const res = await reserveBookAction({
      driveId,
      itemId: selectedItemId,
      applicantName: name,
      applicantContact: contact,
    });
    setPending(false);
    if (res.ok && res.applicationId) {
      toast.success("Reserved — check your ticket.");
      router.push(`/drive/applications/${res.applicationId}`);
    } else {
      setError(res.error ?? "Couldn't reserve your copy.");
      toast.error(res.error ?? "Couldn't reserve your copy.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        {items.map((item) => {
          const isWaitlist = item.remainingStock <= 0;
          const selected = selectedItemId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedItemId(item.id)}
              className={`ornate-card p-5 text-left transition ${
                selected
                  ? "ring-2 ring-emerald-deep border-emerald-deep/40"
                  : "hover:border-emerald-deep/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-emerald-deep/10 shrink-0">
                  <BookOpen className="h-4.5 w-4.5 text-emerald-deep" />
                </div>
                {isWaitlist ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber/15 text-amber">
                    Waitlist
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-deep/15 text-emerald-deep">
                    {item.remainingStock} left
                  </span>
                )}
              </div>
              <p className="font-medium text-sm text-ink">{item.name}</p>
              <p className="mt-1 text-xs text-ink/50">
                Limit {item.perStudentLimit} per student
              </p>
              {selected && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-deep font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Selected
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="applicantName" className="label-field">
            Full name
          </label>
          <input
            id="applicantName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Your full name"
            required
          />
        </div>
        <div>
          <label htmlFor="applicantContact" className="label-field">
            Email or phone
          </label>
          <input
            id="applicantContact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="input-field"
            placeholder="you@example.com"
            required
          />
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button
        type="submit"
        disabled={pending || !selectedItemId}
        className="btn-primary w-full"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <BookOpen className="h-4 w-4" />
        )}
        {reserveButtonLabel}
      </button>
    </form>
  );
}
