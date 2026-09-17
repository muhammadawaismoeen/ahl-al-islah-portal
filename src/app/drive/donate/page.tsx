import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, HandCoins } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { auth } from "@/lib/auth";
import { listDrives } from "@/lib/drive-store";
import { DonateForm } from "./DonateForm";

export const metadata: Metadata = {
  title: "Donate — Qur'an & Seerah Drive",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DriveDonatePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect(`/drive/signin?callbackUrl=${encodeURIComponent("/drive/donate")}`);
  }

  const [content, drives] = await Promise.all([getContent(), listDrives()]);
  const openDrives = drives.filter((d) => d.status === "open");

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20">
        <div className="container-prose max-w-xl mx-auto">
          <Link
            href="/drive"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to the Drive
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4">
              <HandCoins className="h-7 w-7 text-emerald-deep" />
            </div>
            <h1 className="heading-serif text-4xl font-semibold text-emerald-deep">
              Donate
            </h1>
            <p className="mt-3 text-ink/65 leading-relaxed max-w-lg mx-auto">
              Fund a specific drive or the general Qur&apos;an &amp; Seerah
              fund. Transfer to the account below, then attach your receipt.
            </p>
          </div>

          <DonateForm
            drives={openDrives}
            donateCtaLabel={content.drive.donateCtaLabel}
          />
        </div>
      </main>
      <Footer
        content={content.footer}
        navContent={content.nav}
        customLogo={content.customLogo}
      />
    </>
  );
}
