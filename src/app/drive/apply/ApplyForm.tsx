"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  DRIVE_DEPARTMENT_OPTIONS,
  DRIVE_YEAR_OF_STUDY_OPTIONS,
  DRIVE_WINGS,
  DRIVE_WING_SELF_LABEL,
  type DriveItem,
} from "@/lib/drive-types";
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
  const [department, setDepartment] = useState("");
  const [yearOfStudy, setYearOfStudy] = useState("");
  const [gender, setGender] = useState("");
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
      applicantDepartment: department,
      applicantYearOfStudy: yearOfStudy,
      applicantGender: gender,
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
          const outOfStock = item.remainingStock <= 0;
          const selected = selectedItemId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={outOfStock}
              aria-disabled={outOfStock}
              onClick={() => {
                if (outOfStock) return;
                setSelectedItemId(item.id);
              }}
              className={`ornate-card p-5 text-left transition ${
                outOfStock
                  ? "opacity-60 cursor-not-allowed"
                  : selected
                    ? "ring-2 ring-emerald-deep border-emerald-deep/40"
                    : "hover:border-emerald-deep/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div
                  className={`inline-flex items-center justify-center h-9 w-9 rounded-xl shrink-0 ${
                    outOfStock ? "bg-ink/10" : "bg-emerald-deep/10"
                  }`}
                >
                  <BookOpen
                    className={`h-4.5 w-4.5 ${
                      outOfStock ? "text-ink/40" : "text-emerald-deep"
                    }`}
                  />
                </div>
                {outOfStock ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-danger/10 text-danger">
                    Out of stock
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-deep/15 text-emerald-deep">
                    {item.remainingStock} left
                  </span>
                )}
              </div>
              <p className="font-medium text-sm text-ink">{item.name}</p>
              <p className="mt-1 text-xs text-ink/50">
                {outOfStock
                  ? "Every copy is booked — check back after the next restock."
                  : `Limit ${item.perStudentLimit} per student`}
              </p>
              {selected && !outOfStock && (
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
            Phone number
          </label>
          <input
            id="applicantContact"
            type="tel"
            inputMode="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="input-field"
            placeholder="03XX-XXXXXXX"
            required
          />
        </div>
        <div>
          <label htmlFor="applicantDepartment" className="label-field">
            Department
          </label>
          <select
            id="applicantDepartment"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="input-field"
            required
          >
            <option value="" disabled>
              Select your department
            </option>
            {DRIVE_DEPARTMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="applicantGender" className="label-field">
            Brother or Sister
          </label>
          <select
            id="applicantGender"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="input-field"
            required
          >
            <option value="" disabled>
              Select
            </option>
            {DRIVE_WINGS.map((wing) => (
              <option key={wing} value={wing}>
                {DRIVE_WING_SELF_LABEL[wing]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="applicantYearOfStudy" className="label-field">
            Year of study
          </label>
          <select
            id="applicantYearOfStudy"
            value={yearOfStudy}
            onChange={(e) => setYearOfStudy(e.target.value)}
            className="input-field"
            required
          >
            <option value="" disabled>
              Select your year of study
            </option>
            {DRIVE_YEAR_OF_STUDY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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
