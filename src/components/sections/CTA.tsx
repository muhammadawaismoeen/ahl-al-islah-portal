"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTA() {
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
              انضم إلى العمل
            </div>
            <h2 className="heading-serif text-4xl sm:text-5xl font-semibold text-balance">
              Plant this seed with sincerity
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-cream/80 leading-relaxed">
              The Prophet <span className="text-gold-soft">ﷺ</span> spent 13
              years in Makkah building a community under far more difficult
              circumstances. He started with individuals — one conversation,
              one relationship, one heart at a time. If you feel called to
              carry a piece of this work, apply below.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/positions"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gold-gradient text-ink font-semibold tracking-wide shadow-xl hover:shadow-gold-warm/30 hover:scale-[1.02] transition-all group"
              >
                View Open Positions
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
