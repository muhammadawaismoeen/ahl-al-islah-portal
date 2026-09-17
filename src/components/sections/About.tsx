"use client";

import { motion } from "framer-motion";
import type { AboutContent } from "@/lib/content-types";

export function About({ content }: { content: AboutContent }) {
  return (
    <div className="container-prose max-w-3xl mx-auto text-center">
      <span className="section-eyebrow">{content.eyebrow}</span>
      <h1 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
        {content.heading}
      </h1>
      <div className="gold-divider" />
      <p className="mt-4 text-lg text-ink/70 leading-relaxed">{content.lead}</p>

      <div className="mt-16 grid sm:grid-cols-3 gap-6 text-left">
        {content.pillars.map((pillar, i) => (
          <motion.div
            key={pillar.title + i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="ornate-card p-6"
          >
            <h3 className="heading-serif text-lg font-semibold text-emerald-deep">
              {pillar.title}
            </h3>
            <p className="mt-2 text-sm text-ink/65 leading-relaxed">{pillar.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
