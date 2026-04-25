import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Phone, Clock, MessageCircle, Reply } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { isAuthenticated } from "@/app/admin/actions";
import { LoginForm } from "@/app/admin/LoginForm";
import { login } from "@/app/admin/actions";
import { listMessages, ROLE_LABELS } from "@/lib/message-store";
import type { AdvisorMessage } from "@/lib/message-store";
import { formatDate } from "@/lib/utils";
import { ReplyBox, DeleteButton, MarkReadButton } from "./MessageActions";

export const metadata: Metadata = {
  title: "Advisor Inbox — Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  unread: { label: "Unread", className: "bg-gold-antique text-white" },
  read: { label: "Read", className: "bg-ink/20 text-ink/70" },
  replied: { label: "Replied", className: "bg-emerald-deep/20 text-emerald-deep" },
};

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const authed = await isAuthenticated();

  if (!authed) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-md mx-auto">
            <div className="ornate-card p-8">
              <div className="text-center mb-6">
                <span className="arabic-text text-gold-antique">لوحة الإدارة</span>
                <h1 className="heading-serif text-3xl font-semibold text-emerald-deep mt-1">Admin Access</h1>
              </div>
              <LoginForm action={login} />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const messages = await listMessages();
  const { id: selectedId } = await searchParams;
  const selected = selectedId ? messages.find((m) => m.id === selectedId) : null;
  const unreadCount = messages.filter((m) => m.status === "unread").length;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container-prose">

          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <Link href="/admin" className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-2 transition">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Applications
              </Link>
              <span className="arabic-text block text-gold-antique">صندوق الوارد</span>
              <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
                Advisor Inbox
              </h1>
              <p className="text-sm text-ink/60 mt-1">
                {messages.length} message{messages.length !== 1 ? "s" : ""}
                {unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-gold-antique text-white text-xs font-medium">
                    {unreadCount} unread
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.5fr] gap-6">
            {/* Message list */}
            <div className="ornate-card p-2 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="p-10 text-center">
                  <MessageCircle className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                  <p className="text-sm text-ink/60">No messages yet.</p>
                  <p className="text-xs text-ink/40 mt-1">
                    Share <code className="font-mono bg-cream-muted px-1 rounded">/ask-advisor</code> with department heads.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-cream-muted">
                  {messages.map((msg) => {
                    const status = STATUS_CONFIG[msg.status];
                    const isSelected = msg.id === selectedId;
                    return (
                      <li key={msg.id}>
                        <Link
                          href={`/admin/messages?id=${msg.id}`}
                          className={`block p-4 rounded-xl transition ${
                            isSelected ? "bg-emerald-deep/5" : "hover:bg-cream-warm/40"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className={`font-medium text-sm truncate ${
                              msg.status === "unread" ? "text-ink" : "text-ink/70"
                            }`}>
                              {msg.senderName}
                            </span>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.className}`}>
                              {status.label}
                            </span>
                          </div>
                          <p className="text-xs text-ink/70 font-medium truncate">{msg.subject}</p>
                          <p className="text-xs text-ink/50 mt-0.5">{ROLE_LABELS[msg.role]}</p>
                          <p className="text-[11px] text-ink/40 mt-1">{formatDate(msg.submittedAt)}</p>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Detail panel */}
            <div className="ornate-card p-6 sm:p-8">
              {selected ? (
                <MessageDetail message={selected} />
              ) : (
                <div className="h-full flex items-center justify-center py-20 text-center">
                  <div>
                    <MessageCircle className="h-10 w-10 text-ink/20 mx-auto mb-3" />
                    <p className="text-sm text-ink/60">Select a message to view it.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function MessageDetail({ message }: { message: AdvisorMessage }) {
  const status = STATUS_CONFIG[message.status];

  return (
    <article className="space-y-6">
      {/* Header */}
      <header className="pb-5 border-b border-cream-muted">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${status.className}`}>
              {status.label}
            </span>
            <h2 className="heading-serif text-2xl font-semibold text-emerald-deep leading-tight">
              {message.subject}
            </h2>
            <p className="text-sm text-gold-antique font-medium mt-1">
              {ROLE_LABELS[message.role]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {message.status === "unread" && <MarkReadButton messageId={message.id} />}
            <DeleteButton messageId={message.id} />
          </div>
        </div>

        {/* Sender info */}
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm p-3 bg-cream-warm rounded-xl border border-cream-muted">
            <div className="h-8 w-8 rounded-full bg-emerald-deep/10 flex items-center justify-center shrink-0">
              <span className="text-emerald-deep font-semibold text-sm">
                {message.senderName.charAt(0)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ink/40">Sender</p>
              <p className="text-sm font-medium text-ink truncate">{message.senderName}</p>
            </div>
          </div>
          <a
            href={`https://wa.me/${message.whatsapp.replace(/[^\d]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm p-3 bg-emerald-deep/5 rounded-xl border border-emerald-deep/15 hover:bg-emerald-deep/10 transition"
          >
            <Phone className="h-4 w-4 text-emerald-deep shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-ink/40">WhatsApp</p>
              <p className="text-sm font-medium text-emerald-deep truncate">{message.whatsapp}</p>
            </div>
          </a>
        </div>

        <div className="flex items-center gap-1.5 mt-3 text-xs text-ink/40">
          <Clock className="h-3.5 w-3.5" />
          {formatDate(message.submittedAt)}
          {" · "}
          <code className="font-mono text-[10px] bg-cream-muted px-1.5 py-0.5 rounded">
            {message.id}
          </code>
        </div>
      </header>

      {/* Message body */}
      <div>
        <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-3">Message</p>
        <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap bg-cream-warm rounded-xl p-4 border border-cream-muted">
          {message.body}
        </p>
      </div>

      {/* Existing reply */}
      {message.reply && (
        <div className="bg-emerald-deep/5 rounded-xl p-4 border border-emerald-deep/15">
          <div className="flex items-center gap-2 mb-2">
            <Reply className="h-4 w-4 text-emerald-deep" />
            <span className="text-xs uppercase tracking-wider text-emerald-deep font-medium">
              Your Reply
            </span>
            {message.repliedAt && (
              <span className="text-xs text-ink/40 ml-auto">{formatDate(message.repliedAt)}</span>
            )}
          </div>
          <p className="text-sm text-ink/85 leading-relaxed whitespace-pre-wrap">
            {message.reply}
          </p>
        </div>
      )}

      {/* Reply box */}
      <div className="pt-2 border-t border-cream-muted">
        <ReplyBox messageId={message.id} hasReply={!!message.reply} />
      </div>
    </article>
  );
}
