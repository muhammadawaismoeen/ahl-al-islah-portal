"use client";

import { motion } from "framer-motion";
import type { ModelContent } from "@/lib/content-types";

export function Model({ content }: { content: ModelContent }) {
  return (
    <div className="container-prose max-w-3xl mx-auto">
      <div className="text-center">
        <span className="section-eyebrow">{content.eyebrow}</span>
        <h1 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
          {content.heading}
        </h1>
        <div className="gold-divider" />
        <p className="mt-4 text-lg text-ink/70 leading-relaxed">{content.lead}</p>
      </div>

      <div className="index-list mt-16">
        {content.stages.map((stage, i) => (
          <motion.div
            key={stage.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="index-row"
          >
            <h3 className="heading-serif text-xl font-semibold text-emerald-deep">
              {stage.title}
            </h3>
            <p className="mt-2 text-ink/70 leading-relaxed">{stage.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
