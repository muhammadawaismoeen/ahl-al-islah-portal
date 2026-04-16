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
  const v = content.visibility;
  return (
    <>
      <Navbar content={content.nav} />
      <main>
        {v.hero && <Hero content={content.hero} />}
        {v.about && <About content={content.about} />}
        {v.structure && <Structure content={content.structure} />}
        {v.roadmap && <Roadmap content={content.roadmap} />}
        {v.cta && <CTA content={content.cta} />}
      </main>
      <Footer content={content.footer} />
    </>
  );
}
