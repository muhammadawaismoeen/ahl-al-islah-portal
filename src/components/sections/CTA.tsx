"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { CtaContent } from "@/lib/content-types";

export function CTA({ content }: { content: CtaContent }) {
  return (
    <section className="relative py-24 sm:py-32">
      <div className="container-prose">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-gradient" />
          <div className="absolute inset-0 geometric-bg opacity-30" />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-gold-warm/10 blur-3xl" />

          <div className="relative p-10 sm:p-16 text-center text-cream">
            <div className="arabic-text text-xl text-gold-soft mb-3">
              {content.arabicTitle}
            </div>
            <h2 className="heading-serif text-4xl sm:text-5xl font-semibold text-balance">
              {content.heading}
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-cream/80 leading-relaxed">
              {content.description}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/apply/core-member"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold-gradient text-ink font-semibold tracking-wide shadow-xl hover:shadow-gold-warm/30 hover:scale-[1.02] transition-all group"
              >
                <Sparkles className="h-4 w-4" />
                Become a Core Member
              </Link>
              <Link
                href="/positions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-white/10 text-cream border border-cream/20 font-semibold tracking-wide hover:bg-white/20 transition-all group"
              >
                {content.buttonLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
