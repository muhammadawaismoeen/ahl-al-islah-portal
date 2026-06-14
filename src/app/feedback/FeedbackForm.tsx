"use client";

import { useState, useRef } from "react";
import { Send, Loader2, CheckCircle, Shield, CalendarDays } from "lucide-react";
import { submitFeedback } from "./actions";
import {
  RESPONSE_CHANNEL_LABELS,
  RATING_LABELS,
  type ResponseChannel,
} from "@/lib/feedback-types";
import { formatDate } from "@/lib/utils";

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

interface SessionOption {
  id: string;
  title: string;
  date: string;
}

export function FeedbackForm({ sessions }: { sessions: SessionOption[] }) {
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

  // No sessions yet — show a friendly empty state instead of an unusable form
  if (sessions.length === 0) {
    return (
      <div className="ornate-card p-10 text-center">
        <CalendarDays className="h-10 w-10 text-ink/25 mx-auto mb-3" />
        <h2 className="heading-serif text-xl font-semibold text-emerald-deep mb-2">
          No sessions to reflect on yet
        </h2>
        <p className="text-sm text-ink/60 max-w-md mx-auto">
          Once a session is published, this form will let you share what stayed
          with you. Come back after the next gathering.
        </p>
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
            Only your <strong>name</strong> is optional — leave it blank to stay
            fully anonymous. The remaining questions are required so the Advisor
            receives complete reflections.
          </p>
        </div>
      </div>

      {/* ── Session selector ────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-gold-antique" />
            Which session is this feedback about?
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            Pick the gathering you&apos;re reflecting on.
          </p>
        </div>
        <select
          name="sessionId"
          required
          defaultValue=""
          className="input-field"
        >
          <option value="" disabled>
            Select a session…
          </option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {formatDate(s.date)} — {s.title}
            </option>
          ))}
        </select>
      </section>

      {/* ── Optional Identity ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            About You <span className="text-xs font-normal text-ink/40">(optional)</span>
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            Skip to stay anonymous.
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

      {/* ── The Session ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            The Session
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            How did this session land for you? What stayed with you?
          </p>
        </div>

        <div>
          <label className="label-field">How did this session land for you? *</label>
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
                  required
                  className="sr-only"
                />
                <span className="text-xs font-medium">{RATING_LABELS[r]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label-field">
            What stayed with you? *
          </label>
          <textarea
            name="gatheringReflection"
            required
            rows={4}
            className="input-field resize-y"
            placeholder="What touched, challenged, or shifted something inside you…"
            maxLength={3000}
          />
        </div>

        <div>
          <label className="label-field">
            The line that struck you most deeply *
          </label>
          <textarea
            name="deepestLine"
            required
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

      {/* ── The One Change ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            The One Change
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            ʿIlm without ʿamal stays as ink on paper. Name one thing you will
            actually do.
          </p>
        </div>

        <div>
          <label className="label-field">
            One concrete thing this session calls you to do this week *
          </label>
          <textarea
            name="oneChange"
            required
            rows={3}
            className="input-field resize-y"
            placeholder="An action, not a theme. e.g. 'Pray Fajr in the masjid for 7 days', not 'be more disciplined'."
            maxLength={1000}
          />
          <p className="help-text">
            One small, specific action — done before the next session.
          </p>
        </div>
      </section>

      {/* ── The Advisor's Delivery ─────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            The Advisor&apos;s Delivery
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            Be honest — it helps the work mature.
          </p>
        </div>

        <div>
          <label className="label-field">
            How was the Advisor in this session? *
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
                  required
                  className="sr-only"
                />
                <span className="text-xs font-medium">{RATING_LABELS[r]}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="label-field">
            What worked, what could mature, what you would like more of *
          </label>
          <textarea
            name="advisorReflection"
            required
            rows={4}
            className="input-field resize-y"
            placeholder="Clarity, pacing, presence, the way questions were held…"
            maxLength={3000}
          />
        </div>
      </section>

      {/* ── Questions ─────────────────────────────────── */}
      <section className="space-y-5 pt-2 border-t border-cream-muted">
        <div>
          <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
            Questions &amp; Concerns
          </h3>
          <p className="text-xs text-ink/55 mt-0.5">
            Anything you would like answered — about the department, the
            session content, expectations, anything.
          </p>
        </div>

        <div>
          <label className="label-field">Your questions *</label>
          <textarea
            name="questions"
            required
            rows={4}
            className="input-field resize-y"
            placeholder="Ask anything. No question is too small."
            maxLength={3000}
          />
        </div>

        <div>
          <label className="label-field">
            How would you prefer to receive a response? *
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
                  required
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
              required
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
            Anything else you would like to share? *
          </label>
          <textarea
            name="additionalNotes"
            required
            rows={3}
            className="input-field resize-y"
            placeholder="Suggestions, du'ās, encouragement, concerns — anything. Write 'nothing' if you have nothing to add."
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
