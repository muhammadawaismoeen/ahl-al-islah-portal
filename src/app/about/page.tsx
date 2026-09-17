import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { About } from "@/components/sections/About";
import { getContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "About — Ahl Al-Islah",
  description:
    "Ahl Al-Islah is a student-led community within Humanity Still Exists (HSE), built around the Rijal Al-Huda character model.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const content = await getContent();
  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <About content={content.about} />
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
