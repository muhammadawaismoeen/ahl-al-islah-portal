"use client";

import { motion } from "framer-motion";
import { Shield, User, Users } from "lucide-react";
import type { StructureContent } from "@/lib/content-types";

export function Structure({ content }: { content: StructureContent }) {
  return (
    <section
      id="structure"
      className="relative py-24 sm:py-32 bg-gradient-to-b from-transparent via-cream-warm/30 to-transparent"
    >
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
            {content.description}
          </p>
        </motion.div>

        <div className="mt-16 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-gold-warm/10 blur-xl" />
              <div className="relative ornate-card p-6 text-center min-w-[260px]">
                <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-gold-antique to-gold-warm flex items-center justify-center mb-3">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <div className="arabic-text text-sm text-gold-antique">
                  {content.advisorArabic}
                </div>
                <h3 className="heading-serif text-xl font-semibold text-emerald-deep">
                  {content.advisorLabel}
                </h3>
                <p className="text-xs text-ink/60 mt-1">
                  {content.advisorTagline}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="relative h-20 flex items-center justify-center">
            <svg
              viewBox="0 0 400 80"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <motion.path
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.3 }}
                d="M200 0 L200 40 L80 40 L80 80 M200 40 L320 40 L320 80"
                stroke="#b8892b"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
              />
            </svg>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Brothers' cohort */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3"
            >
              <div className="ornate-card p-5 border-2 border-emerald-deep/15">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-emerald-deep text-cream flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="arabic-text text-xs text-gold-antique">
                      {content.maleWingArabic}
                    </div>
                    <h4 className="heading-serif text-lg font-semibold text-emerald-deep">
                      {content.maleWingRoleTitle}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="pl-6 border-l-2 border-dashed border-emerald-deep/20 ml-5 space-y-2">
                {content.maleWingRoles.map((role, i) => (
                  <motion.div
                    key={role + i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                    className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-cream-muted text-sm text-ink/75"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-deep" />
                    {role}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Sisters' cohort */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-3"
            >
              <div className="ornate-card p-5 border-2 border-gold-antique/30">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-gold-antique to-gold-warm text-white flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="arabic-text text-xs text-gold-antique">
                      {content.femaleWingArabic}
                    </div>
                    <h4 className="heading-serif text-lg font-semibold text-emerald-deep">
                      {content.femaleWingRoleTitle}
                    </h4>
                  </div>
                </div>
              </div>
              <div className="pl-6 border-l-2 border-dashed border-gold-antique/30 ml-5 space-y-2">
                {content.femaleWingRoles.map((role, i) => (
                  <motion.div
                    key={role + i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.4 + i * 0.06 }}
                    className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-lg border border-cream-muted text-sm text-ink/75"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-gold-antique" />
                    {role}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-20 max-w-4xl mx-auto"
        >
          <div className="ornate-card p-8 sm:p-10 bg-emerald-deep text-cream border-0">
            <h3 className="heading-serif text-2xl sm:text-3xl font-semibold mb-6">
              {content.whyWorksHeading}
            </h3>
            <div className="grid sm:grid-cols-2 gap-x-10 gap-y-4 text-sm leading-relaxed">
              {content.whyWorksItems.map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-gold-warm" />
                  <p className="text-cream/85">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
