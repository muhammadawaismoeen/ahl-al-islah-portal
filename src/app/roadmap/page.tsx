import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Roadmap } from "@/components/sections/Roadmap";
import { getContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "Roadmap — Ahl Al-Islah",
  description: "Where Ahl Al-Islah is headed — milestones, in order, with status.",
};

export const dynamic = "force-dynamic";

export default async function RoadmapPage() {
  const content = await getContent();
  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <Roadmap content={content.roadmap} />
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
