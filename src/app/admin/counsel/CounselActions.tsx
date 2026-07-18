"use client";

import { useState } from "react";
import { Send, Trash2, Loader2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import {
  replyToThread,
  markThreadRead,
  closeThread,
  reopenThread,
  removeThread,
} from "./actions";

export function ReplyBox({
  threadId,
  disabled,
}: {
  threadId: string;
  disabled?: boolean;
}) {
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);

  async function handleReply() {
    if (!reply.trim()) return;
    setPending(true);
    const res = await replyToThread(threadId, reply);
    setPending(false);
    if (res.ok) {
      toast.success("Reply sent.");
      setReply("");
    } else {
      toast.error(res.error ?? "Failed to send reply.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
        Reply as Advisor
      </p>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        className="input-field resize-y"
        placeholder={
          disabled
            ? "Thread is closed. Reopen to reply."
            : "Write your reply — the seeker will see it in their private thread."
        }
        disabled={disabled}
        maxLength={5000}
      />
      <button
        type="button"
        onClick={handleReply}
        disabled={pending || !reply.trim() || disabled}
        className="btn-primary !py-2 !px-5 text-sm"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send reply
      </button>
    </div>
  );
}

export function MarkReadButton({ threadId }: { threadId: string }) {
  const [pending, setPending] = useState(false);
  async function handle() {
    setPending(true);
    await markThreadRead(threadId);
    setPending(false);
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs"
    >
      {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      Mark as read
    </button>
  );
}

export function CloseThreadButton({
  threadId,
  isClosed,
}: {
  threadId: string;
  isClosed: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    if (isClosed) {
      await reopenThread(threadId);
      toast.success("Thread reopened.");
    } else {
      if (
        !confirm(
          "Close this thread? The seeker will still be able to read it but not send new messages."
        )
      ) {
        setPending(false);
        return;
      }
      await closeThread(threadId);
      toast.success("Thread closed.");
    }
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isClosed ? (
        <Unlock className="h-3.5 w-3.5" />
      ) : (
        <Lock className="h-3.5 w-3.5" />
      )}
      {isClosed ? "Reopen" : "Close"}
    </button>
  );
}

export function DeleteThreadButton({ threadId }: { threadId: string }) {
  const [pending, setPending] = useState(false);
  async function handle() {
    if (
      !confirm(
        "Delete this thread permanently? The seeker will lose access too."
      )
    )
      return;
    setPending(true);
    const res = await removeThread(threadId);
    setPending(false);
    if (!res.ok) toast.error("Failed to delete.");
  }
  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs text-red-500 hover:text-red-700"
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
      Delete
    </button>
  );
}
