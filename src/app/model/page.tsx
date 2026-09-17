import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Model } from "@/components/sections/Model";
import { getContent } from "@/lib/content-store";

export const metadata: Metadata = {
  title: "The Model — Ahl Al-Islah",
  description:
    "Rijal Al-Huda: the four stages every Ahl Al-Islah cohort member moves through, in order — Tazkiyah, Ta'lim, Tarbiyah, Khidmah.",
};

export const dynamic = "force-dynamic";

export default async function ModelPage() {
  const content = await getContent();
  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <Model content={content.model} />
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}
