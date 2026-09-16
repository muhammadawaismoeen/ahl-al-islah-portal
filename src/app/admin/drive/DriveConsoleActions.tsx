"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Lock, Unlock, ScanLine, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Drive } from "@/lib/drive-types";
import {
  createDriveAction,
  setDriveStatusAction,
  updateDriveGoalAction,
  createDriveItemAction,
  updateDriveItemAction,
  checkInByCodeAction,
  reviewDonationAction,
} from "./actions";

export function CreateDriveForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createDriveAction(formData);
      if (res.ok) {
        toast.success("Drive created.");
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(res.error ?? "Couldn't create the drive.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="ornate-card p-5 sm:p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
        New drive
      </p>
      <div>
        <label htmlFor="name" className="label-field">Name</label>
        <input id="name" name="name" required className="input-field" placeholder="Qur'an & Seerah Drive — Spring 2026" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startDate" className="label-field">Start date</label>
          <input id="startDate" name="startDate" type="date" required className="input-field" />
        </div>
        <div>
          <label htmlFor="endDate" className="label-field">End date</label>
          <input id="endDate" name="endDate" type="date" required className="input-field" />
        </div>
      </div>
      <div>
        <label htmlFor="goalAmount" className="label-field">Fundraising goal</label>
        <input id="goalAmount" name="goalAmount" type="number" min={0} step="1" required className="input-field" placeholder="500000" />
      </div>
      <div>
        <label htmlFor="pickupLocation" className="label-field">Pickup location</label>
        <input id="pickupLocation" name="pickupLocation" required className="input-field" placeholder="Masjid Ahl Al-Islah, after Jumu'ah" />
      </div>
      <div>
        <label htmlFor="pickupNote" className="label-field">Pickup note (optional)</label>
        <input id="pickupNote" name="pickupNote" className="input-field" placeholder="Bring your pickup code" />
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Create drive
      </button>
    </form>
  );
}

export function DriveStatusToggle({ drive }: { drive: Drive }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isOpen = drive.status === "open";

  async function handle() {
    setPending(true);
    const res = await setDriveStatusAction(drive.id, isOpen ? "closed" : "open");
    setPending(false);
    if (res.ok) {
      toast.success(isOpen ? "Drive closed." : "Drive reopened.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update drive.");
    }
  }

  return (
    <button type="button" onClick={handle} disabled={pending} className="btn-ghost !py-1.5 !px-3 text-xs">
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isOpen ? (
        <Lock className="h-3.5 w-3.5" />
      ) : (
        <Unlock className="h-3.5 w-3.5" />
      )}
      {isOpen ? "Close" : "Reopen"}
    </button>
  );
}

export function DriveGoalForm({ drive }: { drive: Drive }) {
  const router = useRouter();
  const [goal, setGoal] = useState(String(drive.goalAmount));
  const [pending, setPending] = useState(false);

  async function handle() {
    const amount = Number(goal);
    setPending(true);
    const res = await updateDriveGoalAction(drive.id, amount);
    setPending(false);
    if (res.ok) {
      toast.success("Goal updated.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update goal.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step="1"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="input-field !py-1.5 text-sm w-32"
      />
      <button type="button" onClick={handle} disabled={pending} className="btn-ghost !py-1.5 !px-3 text-xs">
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        Save goal
      </button>
    </div>
  );
}

export function CreateItemForm({ drives }: { drives: Drive[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createDriveItemAction(formData);
      if (res.ok) {
        toast.success("Item added.");
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(res.error ?? "Couldn't add the item.");
      }
    });
  }

  return (
    <form ref={formRef} action={handleSubmit} className="ornate-card p-5 sm:p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
        New catalog item
      </p>
      <div>
        <label htmlFor="driveId" className="label-field">Drive</label>
        <select id="driveId" name="driveId" required className="input-field">
          <option value="">Choose a drive…</option>
          {drives.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="itemName" className="label-field">Item name</label>
        <input id="itemName" name="name" required className="input-field" placeholder="Mushaf — Standard print" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="totalStock" className="label-field">Total stock</label>
          <input id="totalStock" name="totalStock" type="number" min={0} step="1" required className="input-field" />
        </div>
        <div>
          <label htmlFor="perStudentLimit" className="label-field">Per-student limit</label>
          <input id="perStudentLimit" name="perStudentLimit" type="number" min={1} step="1" required className="input-field" defaultValue={1} />
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add item
      </button>
    </form>
  );
}

export function ItemStockForm({
  itemId,
  totalStock,
  remainingStock,
  perStudentLimit,
}: {
  itemId: string;
  totalStock: number;
  remainingStock: number;
  perStudentLimit: number;
}) {
  const router = useRouter();
  const [total, setTotal] = useState(String(totalStock));
  const [remaining, setRemaining] = useState(String(remainingStock));
  const [limit, setLimit] = useState(String(perStudentLimit));
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    const res = await updateDriveItemAction(itemId, {
      totalStock: Number(total),
      remainingStock: Number(remaining),
      perStudentLimit: Number(limit),
    });
    setPending(false);
    if (res.ok) {
      toast.success("Item updated.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update item.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-[11px] text-ink/50">
        Total
        <input type="number" min={0} value={total} onChange={(e) => setTotal(e.target.value)} className="input-field !py-1 !px-2 text-xs w-16 ml-1" />
      </label>
      <label className="text-[11px] text-ink/50">
        Left
        <input type="number" min={0} value={remaining} onChange={(e) => setRemaining(e.target.value)} className="input-field !py-1 !px-2 text-xs w-16 ml-1" />
      </label>
      <label className="text-[11px] text-ink/50">
        Limit
        <input type="number" min={1} value={limit} onChange={(e) => setLimit(e.target.value)} className="input-field !py-1 !px-2 text-xs w-14 ml-1" />
      </label>
      <button type="button" onClick={handle} disabled={pending} className="btn-ghost !py-1 !px-2.5 text-xs">
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        Save
      </button>
    </div>
  );
}

export function CheckInForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ name: string; item: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const res = await checkInByCodeAction(code);
    setPending(false);
    if (res.ok) {
      setResult({ name: res.applicantName ?? "", item: res.itemName ?? "" });
      setCode("");
      toast.success("Checked in.");
      router.refresh();
    } else {
      setError(res.error ?? "Couldn't check in that code.");
      toast.error(res.error ?? "Couldn't check in that code.");
    }
  }

  return (
    <div className="ornate-card p-5 sm:p-6">
      <p className="flex items-center gap-2 text-sm font-medium text-ink/75 mb-4">
        <ScanLine className="h-4 w-4 text-emerald-deep" />
        Check in a pickup code
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="BK-XXXX-XXXX"
          className="input-field font-mono tracking-wide"
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={pending || !code.trim()} className="btn-primary !px-5 shrink-0">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Check in
        </button>
      </form>
      {error && <p className="error-text mt-3">{error}</p>}
      {result && (
        <p className="mt-3 text-sm text-emerald-deep">
          <strong>{result.name}</strong> picked up <strong>{result.item}</strong>.
        </p>
      )}
    </div>
  );
}

export function DonationReviewButtons({ donationId }: { donationId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<"verified" | "rejected" | null>(null);

  async function handle(decision: "verified" | "rejected") {
    if (decision === "rejected" && !confirm("Reject this donation proof?")) return;
    setPending(decision);
    const res = await reviewDonationAction(donationId, decision);
    setPending(null);
    if (res.ok) {
      toast.success(decision === "verified" ? "Donation verified." : "Donation rejected.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to review donation.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => handle("verified")}
        disabled={pending !== null}
        className="btn-ghost !py-1.5 !px-3 text-xs text-emerald-deep"
      >
        {pending === "verified" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
        Verify
      </button>
      <button
        type="button"
        onClick={() => handle("rejected")}
        disabled={pending !== null}
        className="btn-ghost !py-1.5 !px-3 text-xs text-danger hover:text-danger-700"
      >
        {pending === "rejected" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </button>
    </div>
  );
}
