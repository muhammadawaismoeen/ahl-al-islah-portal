"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Trash2,
  Sparkles,
  UserRound,
  LogOut,
  Ban,
} from "lucide-react";
import type { CounselThread, CounselMessage } from "@/lib/counsel-types";
import {
  postSeekerMessage,
  endMyThread,
  forgetThreadOnThisDevice,
} from "./actions";

function formatShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type OptimisticMessage = CounselMessage & { pending?: boolean };

export function ThreadView({ thread }: { thread: CounselThread }) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimistic, setOptimistic] = useState<OptimisticMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = useMemo<OptimisticMessage[]>(() => {
    const serverIds = new Set(thread.messages.map((m) => m.body + m.from));
    const stillPending = optimistic.filter(
      (m) => !serverIds.has(m.body + m.from)
    );
    return [...thread.messages, ...stillPending];
  }, [thread.messages, optimistic]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (optimistic.length > 0 && optimistic.every((m) =>
      thread.messages.some((s) => s.body === m.body && s.from === m.from)
    )) {
      setOptimistic([]);
    }
  }, [thread.messages, optimistic]);

  function handleSend() {
    const trimmed = reply.trim();
    if (!trimmed) return;
    const optimisticMsg: OptimisticMessage = {
      id: `pending-${Date.now()}`,
      from: "seeker",
      body: trimmed,
      submittedAt: new Date().toISOString(),
      pending: true,
    };
    setOptimistic((prev) => [...prev, optimisticMsg]);
    setReply("");
    setError(null);
    void postSeekerMessage(trimmed).then((res) => {
      if (res.ok) {
        router.refresh();
      } else {
        setOptimistic((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        setReply((cur) => cur || trimmed);
        setError(res.error ?? "Couldn't send.");
      }
    });
  }

  async function handleEnd() {
    if (
      !confirm(
        "Delete this thread permanently? The Advisor will lose access too."
      )
    )
      return;
    setPending(true);
    await endMyThread();
    setPending(false);
    router.refresh();
  }

  async function handleForget() {
    if (
      !confirm(
        "Sign out on this device? The thread stays — reach it again with your claim code."
      )
    )
      return;
    await forgetThreadOnThisDevice();
    router.refresh();
  }

  const isClosed = thread.status === "closed";

  return (
    <div className="space-y-6">
      {/* Thread meta bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink/60">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-deep/10 text-emerald-deep font-medium">
            <Sparkles className="h-3 w-3" />
            {isClosed ? "Thread closed" : "Thread open"}
          </span>
          <span>
            {thread.messages.length} message
            {thread.messages.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleForget}
            className="btn-ghost !py-1.5 !px-3 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out here
          </button>
          <button
            type="button"
            onClick={handleEnd}
            disabled={pending}
            className="btn-ghost !py-1.5 !px-3 text-xs text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete thread
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="ornate-card p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} pending={m.pending} />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      {isClosed ? (
        <div className="ornate-card p-6 text-center">
          <Ban className="h-8 w-8 text-ink/30 mx-auto mb-2" />
          <p className="text-sm text-ink/70">
            The Advisor has closed this thread. You can still read it, but no
            new replies can be sent.
          </p>
        </div>
      ) : (
        <div className="ornate-card p-4 sm:p-5 space-y-3">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            className="input-field resize-y"
            placeholder="Write to the Advisor…"
            maxLength={5000}
          />
          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={handleSend}
            disabled={!reply.trim()}
            className="btn-primary w-full sm:w-auto"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  pending,
}: {
  message: CounselMessage;
  pending?: boolean;
}) {
  const isSeeker = message.from === "seeker";
  return (
    <div
      className={`flex gap-3 ${isSeeker ? "flex-row" : "flex-row-reverse"} ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isSeeker
            ? "bg-cream-muted text-ink/60"
            : "bg-emerald-deep text-white"
        }`}
      >
        {isSeeker ? (
          <UserRound className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isSeeker
            ? "bg-cream-warm border border-cream-muted"
            : "bg-emerald-deep/10 border border-emerald-deep/20"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-[10px] uppercase tracking-wider font-semibold ${
              isSeeker ? "text-ink/50" : "text-emerald-deep"
            }`}
          >
            {isSeeker ? "You" : "Advisor"}
          </span>
          <span className="text-[10px] text-ink/40">
            {formatShort(message.submittedAt)}
          </span>
        </div>
        <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap">
          {message.body}
        </p>
      </div>
    </div>
  );
}
