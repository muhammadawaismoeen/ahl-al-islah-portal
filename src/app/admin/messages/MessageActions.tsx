"use client";

import { useState } from "react";
import { Send, Trash2, Loader2 } from "lucide-react";
import { replyToMessage, markAsRead, removeMessage } from "./actions";
import { toast } from "sonner";

export function ReplyBox({ messageId, hasReply }: { messageId: string; hasReply: boolean }) {
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);

  async function handleReply() {
    if (!reply.trim()) return;
    setPending(true);
    const res = await replyToMessage(messageId, reply);
    setPending(false);
    if (res.ok) {
      toast.success("Reply saved. Contact the sender on WhatsApp.");
      setReply("");
    } else {
      toast.error(res.error ?? "Failed to save reply.");
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
        {hasReply ? "Update Reply" : "Add Reply"}
      </p>
      <textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        rows={4}
        className="input-field resize-y"
        placeholder="Write your reply here. Then contact the sender on their WhatsApp number."
      />
      <button
        type="button"
        onClick={handleReply}
        disabled={pending || !reply.trim()}
        className="btn-primary !py-2 !px-5 text-sm"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {hasReply ? "Update Reply" : "Save Reply"}
      </button>
    </div>
  );
}

export function DeleteButton({ messageId }: { messageId: string }) {
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this message permanently?")) return;
    setPending(true);
    const res = await removeMessage(messageId);
    setPending(false);
    if (!res.ok) toast.error("Failed to delete.");
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs text-red-500 hover:text-red-700"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      Delete
    </button>
  );
}

export function MarkReadButton({ messageId }: { messageId: string }) {
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    await markAsRead(messageId);
    setPending(false);
  }

  return (
    <button
      type="button"
      onClick={handle}
      disabled={pending}
      className="btn-ghost !py-1.5 !px-3 text-xs"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      Mark as read
    </button>
  );
}
