"use client";

import { motion } from "framer-motion";
import { BookOpen, Heart, Shield, Sparkles, Users, Sun } from "lucide-react";

const VALUES = [
  {
    icon: Heart,
    arabic: "الإخلاص",
    title: "Ikhlas",
    text: "Sincerity. Everything we do is for the sake of Allah alone.",
  },
  {
    icon: BookOpen,
    arabic: "الحكمة",
    title: "Hikmah",
    text: "Wisdom. We operate with strategic patience and contextual intelligence.",
  },
  {
    icon: Users,
    arabic: "الأخوة",
    title: "Ukhuwwah",
    text: "Genuine same-gender brotherhood and sisterhood as the foundation of community.",
  },
  {
    icon: Sun,
    arabic: "الإحسان",
    title: "Ihsan",
    text: "Excellence. Every event, every interaction reflects our best effort.",
  },
  {
    icon: Sparkles,
    arabic: "الخدمة",
    title: "Khidmah",
    text: "Service. We serve the campus and community, earning respect through action.",
  },
  {
    icon: Shield,
    arabic: "الحياء",
    title: "Haya'",
    text: "Modesty and dignity. Our identity and our strength — not a limitation.",
  },
];

export function About() {
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
          <span className="section-eyebrow">Vision &amp; Mission</span>
          <h2 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
            A seed planted with <span className="shimmer-text">sincerity</span>
          </h2>
          <div className="gold-divider" />
          <p className="mt-4 text-lg text-ink/70 leading-relaxed">
            Ahl Al-Islah exists to provide a safe, welcoming, Shariah-compliant
            space for Muslim medical students to strengthen their faith, build
            meaningful same-gender bonds, develop holistic life skills rooted
            in the Sunnah, and serve their community — while maintaining the
            highest standards of Islamic conduct between genders.
          </p>
        </motion.div>

        {/* Vision / Mission cards */}
        <div className="mt-16 grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="ornate-card p-8"
          >
            <div className="arabic-text text-lg text-gold-antique mb-2">الرؤية</div>
            <h3 className="heading-serif text-2xl font-semibold text-emerald-deep mb-4">
              Vision
            </h3>
            <p className="text-ink/75 leading-relaxed">
              To revive the Prophetic spirit of guidance and service within the
              medical college — creating a generation of Muslim medical
              professionals, both men and women, as strong in their Deen as in
              their profession.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="ornate-card p-8"
          >
            <div className="arabic-text text-lg text-gold-antique mb-2">الرسالة</div>
            <h3 className="heading-serif text-2xl font-semibold text-emerald-deep mb-4">
              Mission
            </h3>
            <p className="text-ink/75 leading-relaxed">
              Provide a welcoming space for Muslim medical students to
              strengthen their faith, build meaningful bonds within their
              respective wings, develop life skills rooted in the Sunnah, and
              serve their community — with uncompromising Islamic conduct.
            </p>
          </motion.div>
        </div>

        {/* Core values */}
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
              Six pillars that shape every decision
            </h3>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {VALUES.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="ornate-card p-6 group"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-xl bg-emerald-deep/5 border border-emerald-deep/10 flex items-center justify-center group-hover:bg-emerald-deep group-hover:text-cream transition-colors">
                    <value.icon className="h-5 w-5 text-emerald-deep group-hover:text-cream transition-colors" />
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
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
