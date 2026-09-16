"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
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

          <div className="relative p-10 sm:p-16 text-center text-bg">
            <div className="arabic-text text-xl text-bg/80 mb-3">
              {content.arabicTitle}
            </div>
            <h2 className="heading-serif text-4xl sm:text-5xl font-semibold text-balance">
              {content.heading}
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-bg/80 leading-relaxed">
              {content.description}
            </p>

            <div className="mt-10 flex items-center justify-center">
              <Link
                href="/become-a-member"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-bg text-emerald-deep font-semibold tracking-wide shadow-xl hover:bg-bg/90 hover:scale-[1.02] transition-all"
              >
                <Sparkles className="h-4 w-4" />
                Become a Member
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
