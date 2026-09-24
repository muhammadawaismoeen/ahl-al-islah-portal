import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Team } from "@/components/sections/Team";
import { getContent } from "@/lib/content-store";
import { DEFAULT_CONTENT } from "@/lib/content-defaults";

export const metadata: Metadata = {
  title: "Team — Ahl Al-Islah",
  description:
    "The Advisor and the Brothers' and Sisters' cohort leadership of Ahl Al-Islah.",
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const content = await getContent();
  const teamContent = content.team ?? DEFAULT_CONTENT.team;
  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <Team content={teamContent} />
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
