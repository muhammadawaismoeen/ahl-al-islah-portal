"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Heart,
  Shield,
  Sparkles,
  Users,
  Sun,
  type LucideIcon,
} from "lucide-react";
import type { AboutContent } from "@/lib/content-types";

const ICON_MAP: Record<string, LucideIcon> = {
  Heart,
  BookOpen,
  Users,
  Sun,
  Sparkles,
  Shield,
};

export function About({ content }: { content: AboutContent }) {
  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="container-prose">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <span className="section-eyebrow">{content.eyebrow}</span>
          <h2 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
            {content.heading}
          </h2>
          <div className="gold-divider" />
          <p className="mt-4 text-lg text-ink/70 leading-relaxed">
            {content.lead}
          </p>
        </motion.div>

        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="ornate-card p-8"
          >
            <div className="arabic-text text-lg text-gold-antique mb-2">
              {content.visionArabic}
            </div>
            <h3 className="heading-serif text-2xl font-semibold text-emerald-deep mb-4">
              {content.visionTitle}
            </h3>
            <p className="text-ink/75 leading-relaxed">{content.visionBody}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="ornate-card p-8"
          >
            <div className="arabic-text text-lg text-gold-antique mb-2">
              {content.missionArabic}
            </div>
            <h3 className="heading-serif text-2xl font-semibold text-emerald-deep mb-4">
              {content.missionTitle}
            </h3>
            <p className="text-ink/75 leading-relaxed">{content.missionBody}</p>
          </motion.div>
        </div>

        <div className="mt-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto text-center mb-12"
          >
            <span className="section-eyebrow">Core Values</span>
            <h3 className="mt-4 heading-serif text-3xl sm:text-4xl font-semibold text-emerald-deep">
              {content.valuesHeading}
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.values.map((value, i) => {
              const Icon = ICON_MAP[value.icon] ?? Sparkles;
              return (
                <motion.div
                  key={value.title + i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="ornate-card p-6 group"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-deep/5 border border-emerald-deep/10 flex items-center justify-center group-hover:bg-emerald-deep group-hover:text-cream transition-colors">
                      <Icon className="h-5 w-5 text-emerald-deep group-hover:text-cream transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <h4 className="heading-serif text-lg font-semibold text-ink">
                          {value.title}
                        </h4>
                        <span className="arabic-text text-sm text-gold-antique">
                          {value.arabic}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-ink/65 leading-relaxed">
                        {value.text}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
