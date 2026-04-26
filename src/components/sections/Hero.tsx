"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { HeroContent } from "@/lib/content-types";

export function Hero({ content, customLogo }: { content: HeroContent; customLogo?: string }) {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-24 pb-20">
      <div className="absolute inset-0 geometric-bg opacity-40" />
      <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-emerald-deep/5 blur-3xl" />
      <div className="absolute bottom-20 -left-20 w-96 h-96 rounded-full bg-gold-warm/5 blur-3xl" />

      <div className="container-prose relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-gold-antique/20 text-xs font-medium text-emerald-deep tracking-wider uppercase mb-8"
          >
            <Sparkles className="h-3.5 w-3.5 text-gold-antique" />
            <span>{content.eyebrow}</span>
          </motion.div>

          {customLogo && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex items-center justify-center mb-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={customLogo} alt="" className="h-20 w-20 sm:h-24 sm:w-24 object-contain animate-float" />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p className="arabic-text text-3xl sm:text-4xl font-semibold text-gold-antique mb-3">
              {content.arabicTitle}
            </p>
            <h1 className="heading-serif text-5xl sm:text-7xl font-semibold text-emerald-deep text-balance leading-[1.05]">
              {content.englishTitle}
            </h1>
            <p className="mt-3 font-serif italic text-xl sm:text-2xl text-ink/60">
              {content.tagline}
            </p>
          </motion.div>

          <div className="gold-divider" />

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-4 text-lg sm:text-xl text-ink/75 leading-relaxed text-pretty max-w-2xl mx-auto"
          >
            {content.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/apply/core-member"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-gold-gradient text-ink font-semibold tracking-wide shadow-lg hover:shadow-gold-warm/30 hover:scale-[1.02] transition-all group"
            >
              <Sparkles className="h-4 w-4" />
              Become a Core Member
            </Link>
            <Link href="/positions" className="btn-primary group">
              {content.primaryCtaLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="#about" className="btn-secondary">
              {content.secondaryCtaLabel}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto"
          >
            {content.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-4xl sm:text-5xl font-semibold text-emerald-deep">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs sm:text-sm text-ink/60 uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
