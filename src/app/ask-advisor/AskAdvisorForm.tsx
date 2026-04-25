"use client";

import { useState, useRef } from "react";
import { Send, Loader2, CheckCircle, Copy, Check } from "lucide-react";
import { submitMessage } from "./actions";
import { ROLE_LABELS } from "@/lib/message-types";

const requiresCode = !!process.env.NEXT_PUBLIC_ASK_ADVISOR_REQUIRES_CODE;

export function AskAdvisorForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    const data = new FormData(e.currentTarget);
    const res = await submitMessage(data);
    setPending(false);
    setResult(res);
    if (res.ok) formRef.current?.reset();
  }

  function copyId() {
    if (result?.id) {
      navigator.clipboard.writeText(result.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (result?.ok) {
    return (
      <div className="ornate-card p-8 text-center space-y-5">
        <div className="flex justify-center">
          <CheckCircle className="h-14 w-14 text-emerald-deep" />
        </div>
        <div>
          <h2 className="heading-serif text-2xl font-semibold text-emerald-deep">
            Message Sent
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            Your message has been delivered privately to the Advisor. You will be contacted on the WhatsApp number you provided.
          </p>
        </div>

        <div className="bg-cream-warm rounded-xl p-4 border border-cream-muted">
          <p className="text-xs uppercase tracking-wider text-ink/50 font-medium mb-2">
            Your Reference ID
          </p>
          <div className="flex items-center justify-center gap-2">
            <code className="font-mono text-sm text-emerald-deep bg-white px-3 py-1.5 rounded-lg border border-cream-muted">
              {result.id}
            </code>
            <button
              type="button"
              onClick={copyId}
              className="p-1.5 hover:bg-cream-muted rounded-lg transition text-ink/50 hover:text-emerald-deep"
              aria-label="Copy reference ID"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-deep" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-ink/50 mt-2">
            Save this — you may need it for follow-up correspondence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setResult(null)}
          className="btn-ghost text-sm"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="ornate-card p-8 space-y-6">
      {/* Role */}
      <div>
        <label className="label-field">Your Role *</label>
        <select name="role" required className="input-field">
          <option value="">Select your role…</option>
          {(Object.entries(ROLE_LABELS) as [string, string][])
            .filter(([k]) => k.startsWith("female"))
            .map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
        </select>
      </div>

      {/* Name */}
      <div>
        <label className="label-field">Your Name *</label>
        <input
          type="text"
          name="senderName"
          required
          className="input-field"
          placeholder="Your full name"
          minLength={2}
          maxLength={100}
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className="label-field">WhatsApp Number *</label>
        <input
          type="tel"
          name="whatsapp"
          required
          className="input-field"
          placeholder="+92 3XX XXXXXXX"
        />
        <p className="help-text">The Advisor will respond on this number.</p>
      </div>

      {/* Subject */}
      <div>
        <label className="label-field">Subject *</label>
        <input
          type="text"
          name="subject"
          required
          className="input-field"
          placeholder="Brief subject of your message"
          maxLength={150}
        />
      </div>

      {/* Message */}
      <div>
        <label className="label-field">Message *</label>
        <textarea
          name="body"
          required
          rows={6}
          className="input-field resize-y"
          placeholder="Write your message here. Be as detailed as you need — this is a private channel."
          minLength={10}
          maxLength={3000}
        />
      </div>

      {/* Optional passcode */}
      {requiresCode && (
        <div>
          <label className="label-field">Access Code *</label>
          <input
            type="password"
            name="passcode"
            required
            className="input-field"
            placeholder="Enter the code shared by the Advisor"
          />
        </div>
      )}

      {result?.error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {result.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send Message to Advisor
          </>
        )}
      </button>

      <p className="text-center text-xs text-ink/40">
        This message is private and visible only to the Advisor.
      </p>
    </form>
  );
}
