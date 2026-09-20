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
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import type { Drive, DriveApplication, DriveItem, Donation } from "@/lib/drive-types";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  createDriveAction,
  setDriveStatusAction,
  setApplicationsOpenAction,
  updateDriveGoalAction,
  deleteDriveAction,
  createDriveItemAction,
  updateDriveItemAction,
  deleteDriveItemAction,
  checkInByCodeAction,
  confirmApplicationAction,
  reviewDonationAction,
  deleteDonationAction,
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-ink">Accepting donations</p>
        <p className="text-xs text-ink/50">
          {isOpen ? "This drive is open and visible for giving." : "Paused — donations are closed."}
        </p>
      </div>
      <SwitchControl checked={isOpen} pending={pending} onClick={handle} srLabel="Toggle donations open for this drive" />
    </div>
  );
}

export function ApplicationsToggle({ drive }: { drive: Drive }) {
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
      <SwitchControl checked={isOpen} pending={pending} onClick={handle} srLabel="Toggle applications open for this drive" />
    </div>
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
  waitlisted: "bg-amber/15 text-amber",
  "picked-up": "bg-ink/15 text-ink/70",
};

const APP_STATUS_LABEL: Record<DriveApplication["status"], string> = {
  "pending-review": "Pending review",
  confirmed: "Confirmed",
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
}: {
  applications: DriveApplication[];
  items: DriveItem[];
  driveNameById: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const q = query.trim().toLowerCase();
  const filtered = q
    ? applications.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(q) ||
          a.applicantContact.toLowerCase().includes(q)
      )
    : applications;

  return (
    <div className="ornate-card p-2">
      <div className="p-3 pb-1">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="input-field !pl-9 text-sm"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <p className="p-10 text-sm text-ink/60 text-center">
          {applications.length === 0
            ? "No applications yet."
            : "No applicants match that search."}
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
                  {wasSwapped && (
                    <p className="text-[11px] text-amber mt-0.5">
                      Originally requested {itemById.get(a.requestedItemId)?.name ?? "a different item"}
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
                  {a.status === "pending-review" && (
                    <ConfirmApplicationButton application={a} items={itemsForDrive} />
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

export function CheckInForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [result, setResult] = useState<{ name: string; item: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function submitCode(raw: string) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setError(null);
    setResult(null);
    const res = await checkInByCodeAction(raw);
    pendingRef.current = false;
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) return;
    submitCode(code);
  }

  return (
    <div className="ornate-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="flex items-center gap-2 text-sm font-medium text-ink/75">
          <ScanLine className="h-4 w-4 text-emerald-deep" />
          Check in a pickup code
        </p>
        <button
          type="button"
          onClick={() => setScanning((s) => !s)}
          className="btn-ghost !py-1 !px-2.5 text-xs text-emerald-deep"
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
  driveNameById,
}: {
  donations: Donation[];
  driveNameById: Record<string, string>;
}) {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      <div className="p-3 pb-1">
        <div className="relative">
          <Search className="h-3.5 w-3.5 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by donor name, email, contact, or ref code"
            className="input-field !pl-9 text-sm"
          />
        </div>
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
                      <a
                        href={d.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-emerald-deep hover:underline"
                      >
                        View proof
                      </a>
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
                    {d.status === "pending" && <DonationReviewButtons donation={d} />}
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
