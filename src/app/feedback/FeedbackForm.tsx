"use client";

import { useState, useRef } from "react";
import { Send, Loader2, CheckCircle, Shield } from "lucide-react";
import { submitFeedback } from "./actions";
import {
  RESPONSE_CHANNEL_LABELS,
  RATING_LABELS,
  type ResponseChannel,
} from "@/lib/feedback-types";

const CHANNEL_ORDER: ResponseChannel[] = [
  "none",
  "whatsapp",
  "next-gathering",
  "in-person",
  "other",
];

const RATING_ORDER: Array<keyof typeof RATING_LABELS> = [
  "excellent",
  "good",
  "average",
  "needs-improvement",
];

export function FeedbackForm() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; id?: string; error?: string } | null>(null);
  const [channel, setChannel] = useState<ResponseChannel | "">("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    const data = new FormData(e.currentTarget);
    const res = await submitFeedback(data);
    setPending(false);
    setResult(res);
    if (res.ok) {
      formRef.current?.reset();
      setChannel("");
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
            Feedback Received
          </h2>
          <p className="mt-2 text-sm text-ink/70 max-w-md mx-auto">
            JazakAllāhu khayran for taking the time to share your thoughts. Your
            words help Ahl Al-Islah grow with sincerity and excellence.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setResult(null)}
          className="btn-ghost text-sm"
        >
          Share more feedback
        </button>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="ornate-card p-6 sm:p-8 space-y-8">

      {/* Anonymity banner */}
      <div className="flex items-start gap-3 p-4 bg-emerald-deep/5 rounded-xl border border-emerald-deep/15">
        <Shield className="h-5 w-5 text-emerald-deep shrink-0 mt-0.5" />
        <div className="text-xs text-ink/75 leading-relaxed">
          <p className="font-semibold text-emerald-deep">This form is anonymous.</p>
          <p className="mt-0.5">
            Your name and WhatsApp number below are optional. Leave them blank to
            stay fully anonymous. Share them only if you would like a direct response.
          </p>
        </div>
      </div>

      {/* ── Optional Identity ─────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            About You <span className="text-xs font-normal text-ink/40">(optional)</span>
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            Skip to stay anonymous. If you choose WhatsApp as the response
            channel below, a number field will appear there.
          </p>
        </div>

        <div>
          <label className="label-field">Your name</label>
          <input
            type="text"
            name="name"
            className="input-field"
            placeholder="Optional"
            maxLength={100}
          />
        </div>
      </section>

      {/* ── First Gathering ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            The First Gathering
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            What did the opening session feel like? What stayed with you?
          </p>
        </div>

        <div>
          <label className="label-field">How was the first gathering for you?</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {RATING_ORDER.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cream-muted bg-cream-warm/40 cursor-pointer hover:bg-emerald-deep/5 hover:border-emerald-deep/30 transition has-[:checked]:bg-emerald-deep has-[:checked]:text-white has-[:checked]:border-emerald-deep"
              >
                <input
                  type="radio"
                  name="gatheringRating"
                  value={r}
                  className="sr-only"
                />
                <span className="text-xs font-medium">{RATING_LABELS[r]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label-field">
            Your reflections on the gathering
          </label>
          <textarea
            name="gatheringReflection"
            rows={4}
            className="input-field resize-y"
            placeholder="What you appreciated, what could improve, what touched you…"
            maxLength={3000}
          />
        </div>
      </section>

      {/* ── Advisor Session ─────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            The Advisor Session
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            How is the Advisor Session landing with you? Be honest — it
            helps the work mature.
          </p>
        </div>

        <div>
          <label className="label-field">
            How would you rate the Advisor Session so far?
          </label>
          <div className="flex flex-wrap gap-2 mt-1">
            {RATING_ORDER.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-cream-muted bg-cream-warm/40 cursor-pointer hover:bg-emerald-deep/5 hover:border-emerald-deep/30 transition has-[:checked]:bg-emerald-deep has-[:checked]:text-white has-[:checked]:border-emerald-deep"
              >
                <input
                  type="radio"
                  name="advisorRating"
                  value={r}
                  className="sr-only"
                />
                <span className="text-xs font-medium">{RATING_LABELS[r]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label-field">
            Your thoughts on the Advisor Session
          </label>
          <textarea
            name="advisorReflection"
            rows={4}
            className="input-field resize-y"
            placeholder="What is working, what feels unclear, what you would like more of…"
            maxLength={3000}
          />
        </div>

        <div>
          <label className="label-field">
            The line that struck you most deeply from the session
          </label>
          <textarea
            name="deepestLine"
            rows={3}
            className="input-field resize-y"
            placeholder="A sentence, a phrase, an āyah, a story — whatever pierced your heart."
            maxLength={1000}
          />
          <p className="help-text">
            Even a single line is enough. Quote it as best you remember.
          </p>
        </div>
      </section>

      {/* ── Questions ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            Questions & Concerns
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            Anything you would like answered — about the department, the model,
            expectations, or anything else.
          </p>
        </div>

        <div>
          <label className="label-field">Your questions</label>
          <textarea
            name="questions"
            rows={4}
            className="input-field resize-y"
            placeholder="Ask anything. No question is too small."
            maxLength={3000}
          />
        </div>

        <div>
          <label className="label-field">
            How would you prefer to receive a response?
          </label>
          <div className="grid sm:grid-cols-2 gap-2 mt-1">
            {CHANNEL_ORDER.map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-cream-muted bg-cream-warm/40 cursor-pointer hover:bg-emerald-deep/5 hover:border-emerald-deep/30 transition has-[:checked]:bg-emerald-deep/10 has-[:checked]:border-emerald-deep"
              >
                <input
                  type="radio"
                  name="preferredChannel"
                  value={c}
                  checked={channel === c}
                  onChange={() => setChannel(c)}
                  className="h-4 w-4 accent-emerald-deep"
                />
                <span className="text-sm">{RESPONSE_CHANNEL_LABELS[c]}</span>
              </label>
            ))}
          </div>
          {channel === "whatsapp" && (
            <div className="mt-3 p-4 bg-emerald-deep/5 rounded-xl border border-emerald-deep/15 space-y-2">
              <label className="label-field !mb-1">
                WhatsApp number for the response *
              </label>
              <input
                type="tel"
                name="whatsapp"
                required
                className="input-field"
                placeholder="+92 3XX XXXXXXX"
                maxLength={30}
              />
              <p className="help-text !mt-1">
                The Advisor will reply privately on this number.
              </p>
            </div>
          )}
          {channel === "in-person" && (
            <p className="help-text text-gold-antique mt-3">
              Reminder: leave your name above so the Advisor can recognise you.
            </p>
          )}
          {channel === "other" && (
            <input
              type="text"
              name="channelOther"
              className="input-field mt-3"
              placeholder="Specify how you'd like to be contacted…"
              maxLength={200}
            />
          )}
        </div>
      </section>

      {/* ── Additional ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <label className="label-field">
            Anything else you would like to share?
          </label>
          <textarea
            name="additionalNotes"
            rows={3}
            className="input-field resize-y"
            placeholder="Suggestions, du'ās, encouragement, concerns — anything."
            maxLength={3000}
          />
        </div>
      </section>

      {/* Errors */}
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
            Submit Feedback
          </>
        )}
      </button>

      <p className="text-center text-xs text-ink/40">
        Your feedback goes directly and privately to the Advisor.
      </p>
    </form>
  );
}
