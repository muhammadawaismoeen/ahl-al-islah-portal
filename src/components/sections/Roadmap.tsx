"use client";

import { motion } from "framer-motion";

const PHASES = [
  {
    phase: "Phase 1",
    weeks: "Weeks 1–4",
    title: "Foundation",
    description:
      "Appoint Male and Female Heads. Build each wing's core team independently. Draft the charter. Establish separate communication channels and Advisor meeting cadence.",
    metric: "Both wings have appointed leadership · Zero cross-gender team interaction from day one",
  },
  {
    phase: "Phase 2",
    weeks: "Weeks 5–8",
    title: "Soft Launch",
    description:
      "First brotherhood and sisterhood gatherings. Weekly halaqahs per wing. One universally appealing event per wing.",
    metric: "Weekly attendance of 8+ per wing · Zero complaints · Both Heads leading confidently",
  },
  {
    phase: "Phase 3",
    weeks: "Months 3–4",
    title: "Credibility",
    description:
      "Host a partitioned flagship event. Structured Seerah circles. Engage faculty allies per wing. Begin monthly reporting rhythm.",
    metric: "50+ attendees at flagship · Faculty engaged per wing · HSE leadership satisfied",
  },
  {
    phase: "Phase 4",
    weeks: "Months 5–8",
    title: "Expand",
    description:
      "Launch signature recurring programs per wing. Same-gender peer mentorship. Community service with parallel teams. Cross-events with other societies.",
    metric: "25+ consistent members per wing · Members showing personal growth",
  },
  {
    phase: "Phase 5",
    weeks: "Months 9–12",
    title: "Legacy",
    description:
      "Document all SOPs per wing. Each Head trains their own successor. Create annual calendar template. Establish Ahl Al-Islah as a campus brand.",
    metric: "Both wings self-sustaining · Successors identified and trained",
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="relative py-24 sm:py-32">
      <div className="container-prose">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="section-eyebrow">12-Month Roadmap</span>
          <h2 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
            Patient, Prophetic, Phased
          </h2>
          <div className="gold-divider" />
          <p className="mt-4 text-lg text-ink/70 leading-relaxed">
            Both wings develop in parallel. Each phase builds trust, competence,
            and credibility. The zero-interaction principle is maintained from
            day one — it is not something introduced later.
          </p>
        </motion.div>

        <div className="mt-16 max-w-4xl mx-auto">
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-antique/40 to-transparent"
              aria-hidden
            />

            <div className="space-y-8">
              {PHASES.map((phase, i) => (
                <motion.div
                  key={phase.phase}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className={`relative flex flex-col sm:flex-row gap-6 ${
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div className="absolute left-6 sm:left-1/2 top-6 -translate-x-1/2 z-10">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full bg-gold-warm animate-ping opacity-20" />
                      <div className="relative h-4 w-4 rounded-full bg-gradient-to-br from-gold-antique to-gold-warm border-2 border-cream" />
                    </div>
                  </div>

                  {/* Card */}
                  <div
                    className={`pl-16 sm:pl-0 sm:w-1/2 ${
                      i % 2 === 0 ? "sm:pr-12 sm:text-right" : "sm:pl-12 sm:text-left"
                    }`}
                  >
                    <div className="ornate-card p-6">
                      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold-antique font-medium mb-2 justify-start">
                        <span>{phase.phase}</span>
                        <span className="text-ink/30">·</span>
                        <span>{phase.weeks}</span>
                      </div>
                      <h3 className="heading-serif text-2xl font-semibold text-emerald-deep mb-2">
                        {phase.title}
                      </h3>
                      <p className="text-sm text-ink/70 leading-relaxed mb-3 text-left">
                        {phase.description}
                      </p>
                      <p className="text-xs text-emerald-rich italic leading-relaxed text-left">
                        {phase.metric}
                      </p>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:w-1/2" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
