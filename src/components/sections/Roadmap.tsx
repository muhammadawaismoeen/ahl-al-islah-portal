"use client";

import { motion } from "framer-motion";
import type { RoadmapContent, RoadmapPhase } from "@/lib/content-types";

const STATUS_LABEL: Record<RoadmapPhase["status"], string> = {
  done: "Done",
  active: "Active",
  planned: "Planned",
};

const STATUS_PILL: Record<RoadmapPhase["status"], string> = {
  done: "pill-ok",
  active: "pill-info",
  planned: "pill-pending",
};

export function Roadmap({ content }: { content: RoadmapContent }) {
  return (
    <div className="container-prose max-w-3xl mx-auto">
      <div className="text-center">
        <span className="section-eyebrow">{content.eyebrow}</span>
        <h1 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
          {content.heading}
        </h1>
        <div className="gold-divider" />
        {content.description && (
          <p className="mt-4 text-lg text-ink/70 leading-relaxed">{content.description}</p>
        )}
      </div>

      <div className="row-list mt-12">
        {content.phases.map((phase, i) => (
          <motion.div
            key={phase.phase + i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="row-item"
          >
            <div>
              <div className="heading-serif text-lg font-semibold text-emerald-deep">
                {phase.title}
              </div>
              <div className="mt-1 text-xs text-ink/50">{phase.timeframe}</div>
            </div>
            <span className={STATUS_PILL[phase.status]}>
              <span className="pill-dot" />
              {STATUS_LABEL[phase.status]}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
