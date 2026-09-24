"use client";

import { motion } from "framer-motion";
import { UserRound, UserRoundCog } from "lucide-react";
import type { TeamContent, TeamBranch } from "@/lib/content-types";

// Faceless headscarf silhouette — lucide has no hijab icon, so this is a
// small hand-drawn one matching lucide's stroke conventions (24x24,
// currentColor, strokeWidth 2, round caps) to sit consistently next to
// UserRound/UserRoundCog.
function HijabIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M19 21v-1.5a4 4 0 0 0-4-4h-6a4 4 0 0 0-4 4V21" />
      <path d="M8 10.5V9a4 4 0 0 1 8 0v1.5" />
      <path d="M6.5 11c-1 .7-1.5 1.8-1.5 3v1.5" />
      <path d="M17.5 11c1 .7 1.5 1.8 1.5 3v1.5" />
      <path d="M9 10a3 3 0 0 0 6 0" />
    </svg>
  );
}

function BranchStream({ branch, i }: { branch: TeamBranch; i: number }) {
  const isSisters = branch.label.trim().toLowerCase().startsWith("sister");
  const BranchIcon = isSisters ? HijabIcon : UserRound;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
      className="flex-1 flex flex-col items-center"
    >
      <span className="inline-flex items-center gap-1.5 section-eyebrow">
        <BranchIcon className="h-4 w-4" aria-hidden="true" />
        {branch.label}
      </span>

      <div className="mt-4 w-full max-w-xs ornate-card p-5 text-center">
        <BranchIcon
          className="h-6 w-6 mx-auto mb-2 text-emerald-deep/50"
          aria-hidden="true"
        />
        <p className="text-xs uppercase tracking-wider text-emerald-deep/70 font-medium">
          {branch.head.role}
        </p>
        <p className="mt-1 heading-serif text-lg font-semibold text-emerald-deep">
          {branch.head.name}
        </p>
      </div>

      <div className="h-6 w-px bg-emerald-deep/25" />

      <div className="w-full max-w-xs ornate-card p-5 text-center">
        <BranchIcon
          className="h-6 w-6 mx-auto mb-2 text-ink/30"
          aria-hidden="true"
        />
        <p className="text-xs uppercase tracking-wider text-ink/50 font-medium">
          {branch.deputy.role}
        </p>
        <p className="mt-1 heading-serif text-lg font-semibold text-emerald-deep">
          {branch.deputy.name}
        </p>
      </div>
    </motion.div>
  );
}

export function Team({ content }: { content: TeamContent }) {
  return (
    <div className="container-prose max-w-4xl mx-auto text-center">
      <span className="section-eyebrow">{content.eyebrow}</span>
      <h1 className="mt-6 heading-serif text-4xl sm:text-5xl font-semibold text-emerald-deep text-balance">
        {content.heading}
      </h1>
      <div className="gold-divider" />
      <p className="mt-4 text-lg text-ink/70 leading-relaxed">{content.lead}</p>

      {/* Org chart */}
      <div className="mt-16">
        {/* Root node */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block ornate-card px-8 py-5"
        >
          <UserRoundCog
            className="h-7 w-7 mx-auto mb-2 text-emerald-deep/60"
            aria-hidden="true"
          />
          <p className="text-xs uppercase tracking-wider text-emerald-deep/70 font-medium">
            {content.root.role}
          </p>
          <p className="mt-1 heading-serif text-xl font-semibold text-emerald-deep">
            {content.root.name}
          </p>
        </motion.div>

        {/* Trunk line down from root */}
        <div className="h-8 w-px bg-emerald-deep/25 mx-auto" />

        {/* Horizontal connector spanning the two branches */}
        <div className="hidden sm:block h-px bg-emerald-deep/25 max-w-md mx-auto" />

        <div className="flex flex-col sm:flex-row gap-10 sm:gap-6 mt-0 sm:mt-8 items-stretch">
          {content.branches.map((branch, i) => (
            <BranchStream key={branch.label} branch={branch} i={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
