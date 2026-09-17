"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { HeroContent } from "@/lib/content-types";

export function Hero({ content, customLogo }: { content: HeroContent; customLogo?: string }) {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40">
      <div className="container-prose">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {customLogo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={customLogo} alt="" className="h-16 w-16 object-contain mb-6" />
            )}
            <span className="section-eyebrow">{content.eyebrow}</span>
            <h1 className="mt-4 heading-serif text-5xl sm:text-6xl lg:text-7xl font-semibold text-emerald-deep text-balance leading-[1.05]">
              {content.headingLine1}
              <br />
              {content.headingLine2}
            </h1>
            <p className="mt-5 text-lg text-ink/75 leading-relaxed max-w-xl">
              {content.lede}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/become-a-member" className="btn-primary">
                {content.primaryCtaLabel}
              </Link>
              <Link href="/model" className="btn-secondary">
                {content.secondaryCtaLabel}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="ornate-card p-8"
          >
            <p className="heading-serif text-xl sm:text-2xl text-emerald-deep leading-snug">
              &ldquo;{content.quoteText}&rdquo;
            </p>
            <p className="mt-4 text-sm text-ink/60">{content.quoteCitation}</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-5 gap-6 sm:gap-8"
        >
          {content.stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <div className="font-serif text-3xl sm:text-4xl font-semibold text-emerald-deep">
                {stat.value}
              </div>
              <div className="mt-1 text-xs sm:text-sm text-ink/60 uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        <div className="mt-16 grid sm:grid-cols-2 gap-8 border-t border-border pt-12">
          {content.cohorts.map((cohort) => (
            <div key={cohort.label}>
              <span className="section-eyebrow">{cohort.label}</span>
              <h3 className="mt-3 heading-serif text-xl font-semibold text-emerald-deep">
                {cohort.title}
              </h3>
              <p className="mt-2 text-sm text-ink/70 leading-relaxed">{cohort.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
