"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import {
  Loader2,
  Plus,
  ScanLine,
  Camera,
  CameraOff,
  Check,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Pencil,
  PackageCheck,
  ArrowRight,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import type { Drive, DriveApplication, DriveItem, Donation } from "@/lib/drive-types";
import type { DeskScanResult, DeskSearchHit } from "./actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  createDriveAction,
  setDriveStatusAction,
  setApplicationsOpenAction,
  updateDriveGoalAction,
  updateDriveDetailsAction,
  deleteDriveAction,
  createDriveItemAction,
  updateDriveItemAction,
  updateDriveItemNameAction,
  deleteDriveItemAction,
  registerAtDeskAction,
  handOverAtDeskAction,
  searchApplicationsForDeskAction,
  confirmApplicationAction,
  deleteApplicationAction,
  reviewDonationAction,
  deleteDonationAction,
  recordCashDonationAction,
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
          <label htmlFor="startDate" className="label-field">Donations open</label>
          <input id="startDate" name="startDate" type="date" required className="input-field" />
        </div>
        <div>
          <label htmlFor="endDate" className="label-field">Donations close</label>
          <input id="endDate" name="endDate" type="date" required className="input-field" />
        </div>
      </div>
      <div>
        <label htmlFor="pickupDate" className="label-field">Drive Day (pickup date)</label>
        <input id="pickupDate" name="pickupDate" type="date" required className="input-field" />
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

function SwitchControl({
  checked,
  pending,
  onClick,
  srLabel,
}: {
  checked: boolean;
  pending: boolean;
  onClick: () => void;
  srLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink/40" />}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={srLabel}
        onClick={onClick}
        disabled={pending}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-deep/50 disabled:opacity-60 ${
          checked ? "bg-emerald-deep" : "bg-ink/20"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </span>
  );
}

export function DriveStatusToggle({ drive, canEdit }: { drive: Drive; canEdit: boolean }) {
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-ink">Accepting donations</p>
        <p className="text-xs text-ink/50">
          {isOpen ? "This drive is open and visible for giving." : "Paused — donations are closed."}
        </p>
      </div>
      <SwitchControl
        checked={isOpen}
        pending={pending || !canEdit}
        onClick={handle}
        srLabel="Toggle donations open for this drive"
      />
    </div>
  );
}

export function ApplicationsToggle({ drive, canEdit }: { drive: Drive; canEdit: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isOpen = drive.applicationsOpen;

  async function handle() {
    setPending(true);
    const res = await setApplicationsOpenAction(drive.id, !isOpen);
    setPending(false);
    if (res.ok) {
      toast.success(isOpen ? "Applications closed." : "Applications opened.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update applications.");
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-ink">Accepting new applications</p>
        <p className="text-xs text-ink/50">
          {isOpen ? "Applicants can apply for this drive." : "Paused — the application form is closed."}
        </p>
      </div>
      <SwitchControl
        checked={isOpen}
        pending={pending || !canEdit}
        onClick={handle}
        srLabel="Toggle applications open for this drive"
      />
    </div>
  );
}

export function DriveGoalForm({ drive, canEdit }: { drive: Drive; canEdit: boolean }) {
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

  if (!canEdit) return null;

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

export function DriveDetailsForm({ drive, canEdit }: { drive: Drive; canEdit: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(drive.name);
  const [startDate, setStartDate] = useState(drive.startDate);
  const [endDate, setEndDate] = useState(drive.endDate);
  const [pickupDate, setPickupDate] = useState(drive.pickupDate ?? "");
  const [pickupLocation, setPickupLocation] = useState(drive.pickupLocation);
  const [pickupNote, setPickupNote] = useState(drive.pickupNote ?? "");

  if (!canEdit) return null;

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="btn-ghost !py-1.5 !px-3 text-xs"
      >
        Edit details
      </button>
    );
  }

  async function handle() {
    setError(null);
    setPending(true);
    const res = await updateDriveDetailsAction(drive.id, {
      name,
      startDate,
      endDate,
      pickupDate,
      pickupLocation,
      pickupNote: pickupNote || undefined,
    });
    setPending(false);
    if (res.ok) {
      toast.success("Drive details updated.");
      setEditing(false);
      router.refresh();
    } else {
      setError(res.error ?? "Failed to update drive details.");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-2/60 p-3 space-y-3">
      <div>
        <label className="label-field">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-field !py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label-field">Donations open</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="label-field">Donations close</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field !py-1.5 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="label-field">Drive Day (pickup date)</label>
        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="input-field !py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="label-field">Pickup location</label>
        <input
          value={pickupLocation}
          onChange={(e) => setPickupLocation(e.target.value)}
          className="input-field !py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="label-field">Pickup note (optional)</label>
        <input
          value={pickupNote}
          onChange={(e) => setPickupNote(e.target.value)}
          className="input-field !py-1.5 text-sm"
        />
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handle}
          disabled={pending}
          className="btn-primary !py-1.5 !px-3 text-xs"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save details
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={pending}
          className="btn-ghost !py-1.5 !px-3 text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function DeleteDriveButton({ driveId, driveName }: { driveId: string; driveName: string }) {
  return (
    <DeleteButton
      title={`Delete "${driveName}"?`}
      description="This permanently removes the drive and its catalog items. Applications and donations already tied to it are kept as historical records. This cannot be undone."
      successMessage="Drive deleted."
      action={() => deleteDriveAction(driveId)}
      iconOnly
    />
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

/**
 * Inline rename for a catalog item. Same shape as the Ambassador name editor
 * in AmbassadorPaymentPanels — pencil to open, tick to save, cross to back
 * out — so the two consoles behave the same way.
 */
export function ItemNameForm({
  itemId,
  name,
  canEdit,
}: {
  itemId: string;
  name: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, setPending] = useState(false);

  function cancel() {
    setValue(name);
    setEditing(false);
  }

  async function save() {
    if (value.trim() === name) {
      setEditing(false);
      return;
    }
    setPending(true);
    const res = await updateDriveItemNameAction(itemId, value);
    setPending(false);
    if (res.ok) {
      if (res.name) setValue(res.name);
      setEditing(false);
      toast.success("Item renamed.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to rename item.");
    }
  }

  if (!editing) {
    return (
      <p className="font-medium text-ink flex items-center gap-1.5">
        {name}
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setValue(name);
              setEditing(true);
            }}
            className="text-ink/30 hover:text-emerald-deep transition"
            aria-label={`Rename ${name}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void save();
          } else if (e.key === "Escape") {
            cancel();
          }
        }}
        className="input-field !py-1 text-sm max-w-xs"
        autoFocus
      />
      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep"
        aria-label="Save name"
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className="btn-ghost !py-1 !px-2.5 text-xs text-danger"
        aria-label="Cancel rename"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ItemStockForm({
  itemId,
  totalStock,
  remainingStock,
  perStudentLimit,
  canEdit,
}: {
  itemId: string;
  totalStock: number;
  remainingStock: number;
  perStudentLimit: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  // Baseline = what the server last confirmed, which is what Total and Left
  // are measured against. Kept in state rather than read from props so a
  // successful save re-bases without the component remounting.
  const [baseTotal, setBaseTotal] = useState(totalStock);
  const [baseRemaining, setBaseRemaining] = useState(remainingStock);
  const [total, setTotal] = useState(String(totalStock));
  const [remaining, setRemaining] = useState(String(remainingStock));
  const [limit, setLimit] = useState(String(perStudentLimit));
  // Set once the Advisor types in the Left box: from then on Left is an
  // explicit override and stops trailing Total.
  const [remainingEdited, setRemainingEdited] = useState(false);
  const [pending, setPending] = useState(false);

  /** Adding 10 to Total means 10 more copies to give out, so Left moves with
   *  it and the copies already claimed stay claimed. Cutting Total below
   *  what's gone floors Left at 0. */
  function handleTotalChange(next: string) {
    setTotal(next);
    if (remainingEdited) return;
    const parsed = Number(next);
    if (next.trim() === "" || !Number.isFinite(parsed)) return;
    setRemaining(String(Math.max(0, baseRemaining + (parsed - baseTotal))));
  }

  async function handle() {
    // Guard before sending: an empty box reads as Number("") === 0, which
    // would otherwise submit a Total of 0 and take Left down with it.
    const nextTotal = Number(total);
    const nextLimit = Number(limit);
    const nextRemaining = Number(remaining);
    const blank = (v: string) => v.trim() === "";
    if (
      blank(total) ||
      !Number.isInteger(nextTotal) ||
      nextTotal < 0 ||
      blank(limit) ||
      !Number.isInteger(nextLimit) ||
      nextLimit < 1 ||
      (remainingEdited &&
        (blank(remaining) || !Number.isInteger(nextRemaining) || nextRemaining < 0))
    ) {
      toast.error("Please enter valid numbers.");
      return;
    }

    setPending(true);
    const delta = nextTotal - baseTotal;
    const res = await updateDriveItemAction(itemId, {
      totalStock: nextTotal,
      perStudentLimit: nextLimit,
      // An explicit Left edit wins. Otherwise send the Total change as a
      // relative nudge, so a reservation made while this page was open is
      // not rolled back — and send nothing at all when Total didn't move.
      ...(remainingEdited
        ? { remainingStock: nextRemaining }
        : delta !== 0
          ? { remainingDelta: delta }
          : {}),
    });
    setPending(false);
    if (res.ok) {
      if (res.item) {
        setBaseTotal(res.item.totalStock);
        setBaseRemaining(res.item.remainingStock);
        setTotal(String(res.item.totalStock));
        setRemaining(String(res.item.remainingStock));
        setLimit(String(res.item.perStudentLimit));
      }
      setRemainingEdited(false);
      toast.success("Item updated.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to update item.");
    }
  }

  if (!canEdit) {
    return (
      <p className="text-[11px] text-ink/50">
        Total {totalStock} · Left {remainingStock} · Limit {perStudentLimit}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="text-[11px] text-ink/50">
        Total
        <input type="number" min={0} value={total} onChange={(e) => handleTotalChange(e.target.value)} className="input-field !py-1 !px-2 text-xs w-16 ml-1" />
      </label>
      <label className="text-[11px] text-ink/50">
        Left
        <input
          type="number"
          min={0}
          value={remaining}
          onChange={(e) => {
            setRemainingEdited(true);
            setRemaining(e.target.value);
          }}
          className="input-field !py-1 !px-2 text-xs w-16 ml-1"
        />
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

export function DeleteDriveItemButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  return (
    <DeleteButton
      title={`Delete "${itemName}"?`}
      description="This permanently removes the catalog item. Applications already made for it are kept as historical records. This cannot be undone."
      successMessage="Item deleted."
      action={() => deleteDriveItemAction(itemId)}
      iconOnly
    />
  );
}

export const APP_STATUS_STYLE: Record<DriveApplication["status"], string> = {
  "pending-review": "bg-sapphire/15 text-sapphire",
  confirmed: "bg-emerald-deep/15 text-emerald-deep",
  "checked-in": "bg-gold/20 text-amber",
  waitlisted: "bg-amber/15 text-amber",
  "picked-up": "bg-ink/15 text-ink/70",
};

const APP_STATUS_LABEL: Record<DriveApplication["status"], string> = {
  "pending-review": "Pending review",
  confirmed: "Confirmed",
  "checked-in": "Registered",
  waitlisted: "Waitlisted",
  "picked-up": "Picked up",
};

function ConfirmApplicationDialog({
  open,
  application,
  items,
  onClose,
}: {
  open: boolean;
  application: DriveApplication;
  items: DriveItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [itemId, setItemId] = useState(application.itemId);
  const [pending, setPending] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setItemId(application.itemId);
  }, [open, application.itemId]);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open || typeof document === "undefined") return null;

  const requestedItem = items.find((i) => i.id === application.requestedItemId);
  const selectedItem = items.find((i) => i.id === itemId);
  const changed = itemId !== application.requestedItemId;

  async function handleConfirm() {
    setPending(true);
    const res = await confirmApplicationAction(
      application.id,
      itemId !== application.itemId ? itemId : undefined
    );
    setPending(false);
    if (res.ok) {
      toast.success("Applicant confirmed.");
      onClose();
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to confirm applicant.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-application-title"
        className="ornate-card relative w-full max-w-md p-6 animate-in"
      >
        <button
          type="button"
          onClick={() => !pending && onClose()}
          className="absolute top-4 right-4 text-ink/40 hover:text-ink/70 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="confirm-application-title" className="heading-serif text-lg font-semibold text-ink">
          Confirm {application.applicantName}
        </h2>
        <p className="mt-1 text-sm text-ink/60">
          Requested <strong>{requestedItem?.name ?? "an item"}</strong>. Change the item below if
          the Advisor is confirming something different.
        </p>

        <label className="block mt-4 text-xs font-medium text-ink/60 mb-1">Confirmed item</label>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          disabled={pending}
          className="input-field text-sm"
        >
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>

        {changed && (
          <div className="mt-4 flex gap-2.5 rounded-xl bg-amber/10 border border-amber/25 p-3">
            <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-amber leading-relaxed">
              {application.applicantName} requested{" "}
              <strong>{requestedItem?.name ?? "a different item"}</strong> — you&apos;re confirming{" "}
              <strong>{selectedItem?.name ?? "this item"}</strong> instead. Both will be kept on
              record.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="btn-ghost !py-2 !px-4 text-sm"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-deep text-white font-medium text-sm tracking-wide transition-all duration-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function ConfirmApplicationButton({
  application,
  items,
}: {
  application: DriveApplication;
  items: DriveItem[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep"
      >
        <Check className="h-3.5 w-3.5" />
        Confirm
      </button>
      <ConfirmApplicationDialog
        open={open}
        application={application}
        items={items}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

export function ApplicantsPanel({
  applications,
  items,
  driveNameById,
  canEdit,
  canDelete,
}: {
  applications: DriveApplication[];
  items: DriveItem[];
  driveNameById: Record<string, string>;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("all");
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  // Items sharing a name across different drives get the drive name
  // appended to their tab label so the two don't look like one tab.
  const nameCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of items) counts.set(i.name, (counts.get(i.name) ?? 0) + 1);
    return counts;
  }, [items]);

  const applicantCountByItem = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of applications) counts.set(a.itemId, (counts.get(a.itemId) ?? 0) + 1);
    return counts;
  }, [applications]);

  const q = query.trim().toLowerCase();
  const bySearch = q
    ? applications.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(q) ||
          a.applicantContact.toLowerCase().includes(q)
      )
    : applications;
  const filtered =
    selectedItemId === "all"
      ? bySearch
      : bySearch.filter((a) => a.itemId === selectedItemId);

  return (
    <div className="ornate-card p-2">
      <div className="px-3 pt-3">
        <div className="flex items-end gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-border">
          <button
            type="button"
            onClick={() => setSelectedItemId("all")}
            className={`shrink-0 -mb-px pb-2.5 border-b-2 text-sm font-medium tracking-wide transition whitespace-nowrap ${
              selectedItemId === "all"
                ? "border-emerald-deep text-emerald-deep"
                : "border-transparent text-ink/45 hover:text-ink/70"
            }`}
          >
            All
            <span className="ml-1.5 text-xs tabular-nums text-ink/35">{applications.length}</span>
          </button>
          {items.map((item) => {
            const label =
              (nameCounts.get(item.name) ?? 0) > 1
                ? `${item.name} · ${driveNameById[item.driveId] ?? "Drive"}`
                : item.name;
            const active = selectedItemId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedItemId(item.id)}
                className={`shrink-0 -mb-px pb-2.5 border-b-2 text-sm font-medium tracking-wide transition whitespace-nowrap ${
                  active
                    ? "border-emerald-deep text-emerald-deep"
                    : "border-transparent text-ink/45 hover:text-ink/70"
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs tabular-nums text-ink/35">
                  {applicantCountByItem.get(item.id) ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-3 pb-1">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone"
            className="input-field !pl-9 text-sm"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="p-10 text-sm text-ink/60 text-center">
          {applications.length === 0
            ? "No applications yet."
            : q
              ? "No applicants match that search."
              : "No applicants for this item yet."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((a) => {
            const itemsForDrive = items.filter((i) => i.driveId === a.driveId);
            const wasSwapped = a.requestedItemId !== a.itemId;
            return (
              <li key={a.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-ink">{a.applicantName}</p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {itemById.get(a.itemId)?.name ?? "Item"} · {driveNameById[a.driveId] ?? "Drive"} ·{" "}
                    {a.applicantContact}
                  </p>
                  {(a.applicantDepartment || a.applicantYearOfStudy) && (
                    <p className="text-[11px] text-ink/40 mt-0.5">
                      {[a.applicantDepartment, a.applicantYearOfStudy].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {wasSwapped && (
                    <p className="text-[11px] text-amber mt-0.5">
                      Originally requested {itemById.get(a.requestedItemId)?.name ?? "a different item"}
                    </p>
                  )}
                  {a.flaggedReason && (
                    <p
                      className="inline-flex items-center gap-1 text-[11px] text-amber mt-0.5"
                      title={a.flaggedReason}
                    >
                      <AlertTriangle className="h-3 w-3 shrink-0" /> Possible duplicate
                    </p>
                  )}
                  <p className="text-[11px] text-ink/40 mt-0.5">
                    Code <code className="font-mono">{a.pickupCode}</code> · Applied{" "}
                    {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${APP_STATUS_STYLE[a.status]}`}
                  >
                    {APP_STATUS_LABEL[a.status]}
                  </span>
                  {canEdit && a.status === "pending-review" && (
                    <ConfirmApplicationButton application={a} items={itemsForDrive} />
                  )}
                  {canDelete && (
                    <DeleteButton
                      title="Delete this application?"
                      description={
                        a.status === "pending-review" ||
                        a.status === "confirmed" ||
                        a.status === "checked-in"
                          ? `This permanently removes ${a.applicantName}'s application and returns their reserved copy of ${
                              itemById.get(a.itemId)?.name ?? "the item"
                            } back to stock. This cannot be undone.`
                          : `This permanently removes ${a.applicantName}'s application. This cannot be undone.`
                      }
                      successMessage="Application deleted."
                      action={() => deleteApplicationAction(a.id)}
                      iconOnly
                      ariaLabel={`Delete application from ${a.applicantName}`}
                      className="btn-ghost !py-1.5 !px-2.5 text-xs text-danger hover:text-danger-700"
                    />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function QrCameraScanner({
  onDetect,
  paused,
}: {
  onDetect: (value: string) => void;
  paused: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const lastValueRef = useRef<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      } catch {
        setCameraError(
          "Couldn't access the camera — check browser permissions and try again."
        );
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(frame.data, frame.width, frame.height);
          if (code?.data && code.data !== lastValueRef.current) {
            lastValueRef.current = code.data;
            onDetect(code.data);
          }
        }
      }
      frameRef.current = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paused) lastValueRef.current = null;
  }, [paused]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full aspect-square object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      <div className="pointer-events-none absolute inset-8 rounded-xl border-2 border-white/70" />
      {cameraError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
          <p className="text-xs text-white text-center">{cameraError}</p>
        </div>
      )}
    </div>
  );
}

type DeskMode = "registration" | "handover";

const DESK_COPY: Record<
  DeskMode,
  { title: string; hint: string; verb: string; icon: typeof ScanLine }
> = {
  registration: {
    title: "Registration Desk — scan 1 of 2",
    hint: "Scan the applicant's ticket to check them in. They then move to the Book Handover desk for the second scan.",
    verb: "Register",
    icon: ScanLine,
  },
  handover: {
    title: "Book Handover — scan 2 of 2",
    hint: "Scan the same ticket again to hand the book over. The applicant must already have been scanned at the Registration Desk.",
    verb: "Hand over",
    icon: PackageCheck,
  },
};

/** Turns one scan into the two lines the volunteer reads off the screen:
 *  what just happened, and where the person goes next. Both desks share this
 *  so the wording can never drift apart between them. */
function describeScan(
  mode: DeskMode,
  res: DeskScanResult
): { tone: "ok" | "warn"; headline: string; next: string } {
  const at = res.at ? ` at ${formatClock(res.at)}` : "";
  switch (res.outcome) {
    case "registered":
      return {
        tone: "ok",
        headline: "Scan 1 of 2 done — registered.",
        next: "Next: send them to the Book Handover desk to scan this same ticket again.",
      };
    case "already-registered":
      return {
        tone: "warn",
        headline: `Already registered${at} — this is a repeat scan.`,
        next:
          mode === "registration"
            ? "Nothing more to do here. Send them to the Book Handover desk."
            : "Scan 2 of 2 hasn't gone through — try the scan again.",
      };
    case "handed-over":
      return {
        tone: "ok",
        headline: "Scan 2 of 2 done — book handed over.",
        next: "This ticket is complete. Nothing further.",
      };
    case "already-handed-over":
      return {
        tone: "warn",
        headline: `Book was already handed over${at}.`,
        next: "Both scans are done — do not hand over a second copy.",
      };
    default:
      return { tone: "ok", headline: "Scan recorded.", next: "" };
  }
}

/** Local wall-clock time, e.g. "11:04 am" — the volunteer only ever needs to
 *  compare it against "a minute ago", never a date. */
function formatClock(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/**
 * The Drive Day desk scanner, shared by both desks. `mode` picks which of the
 * two scans this screen performs; the server action behind it enforces the
 * order, so a ticket can't reach Handover without passing Registration first.
 */
export function DeskScanner({
  mode,
  canEdit,
}: {
  mode: DeskMode;
  canEdit: boolean;
}) {
  const router = useRouter();
  const copy = DESK_COPY[mode];
  const DeskIcon = copy.icon;

  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [result, setResult] = useState<DeskScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const [lookup, setLookup] = useState("");
  const [hits, setHits] = useState<DeskSearchHit[] | null>(null);
  const [searching, startSearch] = useTransition();

  async function submitCode(raw: string) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    setResult(null);
    const res =
      mode === "registration"
        ? await registerAtDeskAction(raw)
        : await handOverAtDeskAction(raw);
    pendingRef.current = false;
    setPending(false);
    if (res.ok) {
      setResult(res);
      setCode("");
      setHits(null);
      const { tone, headline } = describeScan(mode, res);
      if (tone === "ok") toast.success(headline);
      else toast.warning(headline);
      router.refresh();
    } else {
      const message = res.error ?? `Couldn't ${copy.verb.toLowerCase()} that code.`;
      setError(message);
      toast.error(message);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) return;
    submitCode(code);
  }

  function runLookup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = lookup.trim();
    if (q.length < 2) return;
    startSearch(async () => {
      setHits(await searchApplicationsForDeskAction(q));
    });
  }

  if (!canEdit) {
    return (
      <div className="ornate-card p-5 sm:p-6">
        <p className="text-sm text-ink/60">
          You have read-only access to this desk — scanning is unavailable.
        </p>
      </div>
    );
  }

  const described = result ? describeScan(mode, result) : null;

  return (
    <div className="space-y-4">
      <div className="ornate-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="flex items-center gap-2 text-sm font-medium text-ink/75">
            <DeskIcon className="h-4 w-4 text-emerald-deep" />
            {copy.title}
          </p>
          <button
            type="button"
            onClick={() => setScanning((v) => !v)}
            className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep shrink-0"
          >
            {scanning ? (
              <>
                <CameraOff className="h-3.5 w-3.5" />
                Stop scanning
              </>
            ) : (
              <>
                <Camera className="h-3.5 w-3.5" />
                Scan QR
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-ink/50 leading-relaxed mb-4">{copy.hint}</p>

        {scanning && (
          <div className="mb-4 max-w-xs mx-auto">
            <QrCameraScanner onDetect={submitCode} paused={pending} />
            <p className="text-[11px] text-ink/45 text-center mt-2">
              Point the camera at the applicant&apos;s ticket QR code.
            </p>
          </div>
        )}

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
          <button
            type="submit"
            disabled={pending || !code.trim()}
            className="btn-primary !px-5 shrink-0"
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {copy.verb}
          </button>
        </form>

        {error && <p className="error-text mt-3">{error}</p>}

        {result && described && (
          <div
            className={`mt-4 rounded-xl p-4 border ${
              described.tone === "ok"
                ? "bg-emerald-deep/5 border-emerald-deep/20"
                : "bg-amber/10 border-amber/30"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                described.tone === "ok" ? "text-emerald-deep" : "text-amber"
              }`}
            >
              {described.headline}
            </p>
            <p className="text-sm text-ink mt-1">
              <strong>{result.applicantName}</strong> — {result.itemName}
              {result.pickupCode && (
                <span className="font-mono text-xs text-ink/50"> · {result.pickupCode}</span>
              )}
            </p>
            {described.next && (
              <p className="flex items-start gap-1.5 text-xs text-ink/60 mt-2">
                <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-px" />
                {described.next}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="ornate-card p-5 sm:p-6">
        <p className="flex items-center gap-2 text-sm font-medium text-ink/75 mb-1">
          <Search className="h-4 w-4 text-emerald-deep" />
          Can&apos;t scan the ticket?
        </p>
        <p className="text-xs text-ink/50 leading-relaxed mb-3">
          Look the applicant up by name or phone number, then pick them from the
          results to record the scan.
        </p>
        <form onSubmit={runLookup} className="flex gap-2">
          <input
            type="text"
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="Name or phone number"
            className="input-field"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={searching || lookup.trim().length < 2}
            className="btn-secondary !px-5 shrink-0"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Find
          </button>
        </form>

        {hits !== null && hits.length === 0 && (
          <p className="flex items-center gap-1.5 text-xs text-ink/50 mt-3">
            <Info className="h-3.5 w-3.5" />
            No ticket matches that. Only applicants who booked online have one.
          </p>
        )}

        {hits !== null && hits.length > 0 && (
          <ul className="mt-3 space-y-2">
            {hits.map((hit) => (
              <li
                key={hit.pickupCode}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink truncate">
                    {hit.applicantName}
                    <span
                      className={`ml-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full align-middle ${
                        APP_STATUS_STYLE[hit.status]
                      }`}
                    >
                      {APP_STATUS_LABEL[hit.status]}
                    </span>
                  </p>
                  <p className="text-xs text-ink/50 truncate">
                    {hit.itemName} · {hit.applicantContact} ·{" "}
                    <span className="font-mono">{hit.pickupCode}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => submitCode(hit.pickupCode)}
                  className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep shrink-0"
                >
                  {copy.verb}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export const DONATION_STATUS_STYLE: Record<Donation["status"], string> = {
  pending: "bg-amber/15 text-amber",
  verified: "bg-emerald-deep/15 text-emerald-deep",
  rejected: "bg-danger-100 text-danger-700",
};

function VerifyDonationDialog({
  open,
  donation,
  onClose,
}: {
  open: boolean;
  donation: Donation;
  onClose: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(donation.amount));
  const [pending, setPending] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    setAmount(String(donation.amount));
  }, [open, donation.amount]);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onClose]);

  if (!open || typeof document === "undefined") return null;

  const parsedAmount = Number(amount);
  const validAmount = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const changed = validAmount && parsedAmount !== donation.donorSubmittedAmount;

  async function handleConfirm() {
    if (!validAmount) return;
    setPending(true);
    const res = await reviewDonationAction(
      donation.id,
      "verified",
      parsedAmount !== donation.donorSubmittedAmount ? parsedAmount : undefined
    );
    setPending(false);
    if (res.ok) {
      toast.success("Donation verified.");
      onClose();
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to review donation.");
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={() => !pending && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-donation-title"
        className="ornate-card relative w-full max-w-md p-6 animate-in"
      >
        <button
          type="button"
          onClick={() => !pending && onClose()}
          className="absolute top-4 right-4 text-ink/40 hover:text-ink/70 transition"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="verify-donation-title" className="heading-serif text-lg font-semibold text-ink">
          Verify donation from {donation.donorName ?? "this donor"}
        </h2>

        <a
          href={donation.proofUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4 rounded-xl overflow-hidden border border-border"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={donation.proofUrl} alt="Payment proof" className="w-full max-h-64 object-contain bg-surface-2" />
        </a>
        <p className="mt-1 text-[11px] text-ink/40">Click the image to open it full size.</p>

        <label className="block mt-4 text-xs font-medium text-ink/60 mb-1">
          Amount ({DRIVE_CURRENCY})
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={pending}
          min={1}
          className="input-field text-sm"
        />

        {changed && (
          <div className="mt-4 flex gap-2.5 rounded-xl bg-amber/10 border border-amber/25 p-3">
            <AlertTriangle className="h-4 w-4 text-amber shrink-0 mt-0.5" />
            <p className="text-xs text-amber leading-relaxed">
              Donor entered {DRIVE_CURRENCY} {donation.donorSubmittedAmount.toLocaleString()} —
              you&apos;re recording {DRIVE_CURRENCY} {parsedAmount.toLocaleString()} instead. Both
              will be kept on record.
            </p>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="btn-ghost !py-2 !px-4 text-sm"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={handleConfirm}
            disabled={pending || !validAmount}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-deep text-white font-medium text-sm tracking-wide transition-all duration-200 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Verify
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function DonationReviewButtons({ donation }: { donation: Donation }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [confirmingReject, setConfirmingReject] = useState(false);

  async function handleReject() {
    setPending(true);
    const res = await reviewDonationAction(donation.id, "rejected");
    setPending(false);
    setConfirmingReject(false);
    if (res.ok) {
      toast.success("Donation rejected.");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to review donation.");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setVerifying(true)}
        disabled={pending}
        className="btn-ghost !py-1.5 !px-3 text-xs text-emerald-deep"
      >
        <Check className="h-3.5 w-3.5" />
        Verify
      </button>
      <button
        type="button"
        onClick={() => setConfirmingReject(true)}
        disabled={pending}
        className="btn-ghost !py-1.5 !px-3 text-xs text-danger hover:text-danger-700"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
        Reject
      </button>
      <VerifyDonationDialog
        open={verifying}
        donation={donation}
        onClose={() => setVerifying(false)}
      />
      <ConfirmDialog
        open={confirmingReject}
        title="Reject this donation proof?"
        confirmLabel="Reject"
        pending={pending}
        onConfirm={handleReject}
        onCancel={() => setConfirmingReject(false)}
      />
    </div>
  );
}

export function DonationsPanel({
  donations,
  drives,
  driveNameById,
  canEdit,
  canDelete,
}: {
  donations: Donation[];
  drives: Drive[];
  driveNameById: Record<string, string>;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [addingCash, setAddingCash] = useState(false);
  const [cashDriveId, setCashDriveId] = useState("");
  const [cashDonorName, setCashDonorName] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [savingCash, setSavingCash] = useState(false);

  async function saveCashDonation() {
    const amount = Number(cashAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount.");
      return;
    }
    setSavingCash(true);
    const res = await recordCashDonationAction(
      cashDriveId || null,
      amount,
      cashDonorName.trim() || undefined,
      cashNote.trim() || undefined
    );
    setSavingCash(false);
    if (res.ok) {
      toast.success(`${DRIVE_CURRENCY} ${amount.toLocaleString()} cash donation recorded.`);
      setAddingCash(false);
      setCashDriveId("");
      setCashDonorName("");
      setCashAmount("");
      setCashNote("");
      router.refresh();
    } else {
      toast.error(res.error ?? "Failed to record donation.");
    }
  }

  const donationsByEmail = useMemo(() => {
    const map = new Map<string, Donation[]>();
    for (const d of donations) {
      if (!d.donorEmail) continue;
      const list = map.get(d.donorEmail) ?? [];
      list.push(d);
      map.set(d.donorEmail, list);
    }
    return map;
  }, [donations]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? donations.filter(
        (d) =>
          (d.donorName ?? "").toLowerCase().includes(q) ||
          (d.donorEmail ?? "").toLowerCase().includes(q) ||
          (d.donorContact ?? "").toLowerCase().includes(q) ||
          d.refCode.toLowerCase().includes(q)
      )
    : donations;

  return (
    <div className="ornate-card p-2">
      <div className="p-3 pb-1 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by donor name, email, contact, or ref code"
              className="input-field !pl-9 text-sm"
            />
          </div>
          {canEdit && !addingCash && (
            <button
              type="button"
              onClick={() => setAddingCash(true)}
              className="btn-ghost !py-2 !px-3 text-xs shrink-0 inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Cash Donation
            </button>
          )}
        </div>

        {addingCash && (
          <div className="rounded-xl border border-border bg-bg p-3 space-y-2.5">
            <p className="text-xs font-medium text-ink/70">
              Record cash or in-person payment received directly (no proof upload needed —
              saved as verified immediately).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                value={cashDriveId}
                onChange={(e) => setCashDriveId(e.target.value)}
                className="input-field text-sm"
              >
                <option value="">General fund</option>
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder={`Amount (${DRIVE_CURRENCY})`}
                className="input-field text-sm"
              />
              <input
                type="text"
                value={cashDonorName}
                onChange={(e) => setCashDonorName(e.target.value)}
                placeholder="Donor name (optional)"
                className="input-field text-sm"
              />
              <input
                type="text"
                value={cashNote}
                onChange={(e) => setCashNote(e.target.value)}
                placeholder="Note (optional)"
                className="input-field text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={saveCashDonation}
                disabled={savingCash}
                className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1.5"
              >
                {savingCash && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save donation
              </button>
              <button
                type="button"
                onClick={() => setAddingCash(false)}
                disabled={savingCash}
                className="btn-ghost !py-1.5 !px-3 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      {filtered.length === 0 ? (
        <p className="p-10 text-sm text-ink/60 text-center">
          {donations.length === 0 ? "No donations yet." : "No donations match that search."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((d) => {
            const history = d.donorEmail
              ? (donationsByEmail.get(d.donorEmail) ?? []).filter((h) => h.id !== d.id)
              : [];
            const expanded = expandedId === d.id;
            return (
              <li key={d.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-ink">
                      {DRIVE_CURRENCY} {d.amount.toLocaleString()} — {d.donorName ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {d.driveId ? driveNameById[d.driveId] ?? "Drive" : "General fund"}
                      {" · "}
                      {d.donorEmail ?? "no email on file"} · {d.donorContact ?? "no contact"} · Ref{" "}
                      <code className="font-mono">{d.refCode}</code>
                    </p>
                    {d.amount !== d.donorSubmittedAmount && (
                      <p className="text-[11px] text-amber mt-0.5">
                        Corrected from {DRIVE_CURRENCY} {d.donorSubmittedAmount.toLocaleString()}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {d.proofUrl === "manual-entry" ? (
                        <span className="text-[11px] text-ink/50">Manual entry — no proof upload</span>
                      ) : (
                        <a
                          href={d.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-deep hover:underline"
                        >
                          View proof
                        </a>
                      )}
                      {history.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : d.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-sapphire hover:underline"
                        >
                          {expanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                          {history.length} other donation{history.length === 1 ? "" : "s"} from this donor
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${DONATION_STATUS_STYLE[d.status]}`}
                    >
                      {d.status}
                    </span>
                    {canEdit && d.status === "pending" && <DonationReviewButtons donation={d} />}
                    {canDelete && (
                      <DeleteButton
                        title="Delete this donation?"
                        description={
                          d.status === "verified"
                            ? `This will permanently remove the record of ${DRIVE_CURRENCY} ${d.amount.toLocaleString()} from ${
                                d.donorName ?? "this donor"
                              } and reduce the raised total it counted toward. This cannot be undone.`
                            : "This permanently removes the donation record. This cannot be undone."
                        }
                        successMessage="Donation deleted."
                        action={() => deleteDonationAction(d.id)}
                        iconOnly
                        ariaLabel={`Delete donation of ${DRIVE_CURRENCY} ${d.amount.toLocaleString()} from ${d.donorName ?? "donor"}`}
                        className="btn-ghost !py-1.5 !px-2.5 text-xs text-danger hover:text-danger-700"
                      />
                    )}
                  </div>
                </div>
                {expanded && history.length > 0 && (
                  <div className="mt-3 ml-1 pl-3 border-l-2 border-border space-y-1.5">
                    {history
                      .slice()
                      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                      .map((h) => (
                        <div
                          key={h.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink/60"
                        >
                          <span>
                            {DRIVE_CURRENCY} {h.amount.toLocaleString()} ·{" "}
                            {h.driveId ? driveNameById[h.driveId] ?? "Drive" : "General fund"} ·{" "}
                            {formatDate(h.createdAt)}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${DONATION_STATUS_STYLE[h.status]}`}
                          >
                            {h.status}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
