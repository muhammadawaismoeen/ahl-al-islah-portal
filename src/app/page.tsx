import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Structure } from "@/components/sections/Structure";
import { Roadmap } from "@/components/sections/Roadmap";
import { CTA } from "@/components/sections/CTA";
import { getContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getContent();
  return (
    <>
      <Navbar content={content.nav} />
      <main>
        <Hero content={content.hero} />
        <About content={content.about} />
        <Structure content={content.structure} />
        <Roadmap content={content.roadmap} />
        <CTA content={content.cta} />
      </main>
      <Footer content={content.footer} />
    </>
  );
}
