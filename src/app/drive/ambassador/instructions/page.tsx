import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Award, HandCoins, Share2, MessageCircleHeart } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { auth } from "@/lib/auth";
import { listAmbassadorsByEmail, getDrive } from "@/lib/drive-store";
import { DRIVE_CURRENCY } from "@/lib/drive-config";
import { PrintButton } from "../PrintButton";

export const metadata: Metadata = {
  title: "Ambassador Instructions — Ahl Al-Islah",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AmbassadorInstructionsPage() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) {
    redirect(`/drive/signin?callbackUrl=${encodeURIComponent("/drive/ambassador/instructions")}`);
  }

  const content = await getContent();
  const registrations = await listAmbassadorsByEmail(email);
  const ambassador = registrations.find((a) => a.status === "approved");

  if (!ambassador) {
    return (
      <>
        <Navbar content={content.nav} customLogo={content.customLogo} />
        <main className="pt-32 pb-20">
          <div className="container-prose max-w-lg mx-auto text-center">
            <div className="ornate-card p-8">
              <p className="text-sm text-ink/60">
                Sharing instructions unlock once your Ambassador registration is approved.
              </p>
              <Link href="/drive/ambassador" className="btn-secondary inline-flex mt-4">
                Back to Ambassador page
              </Link>
            </div>
          </div>
        </main>
        <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
      </>
    );
  }

  const drive = await getDrive(ambassador.driveId);

  return (
    <>
      <Navbar content={content.nav} customLogo={content.customLogo} />
      <main className="pt-32 pb-20 print:pt-0">
        <div className="container-prose max-w-2xl mx-auto">
          <Link
            href="/drive/ambassador"
            className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-emerald-deep mb-6 transition print:hidden"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Ambassador page
          </Link>

          <div className="ornate-card p-8 print:border-0 print:shadow-none">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-emerald-deep/10 mb-4 print:hidden">
                <Award className="h-7 w-7 text-emerald-deep" />
              </div>
              <h1 className="heading-serif text-3xl font-semibold text-emerald-deep">
                Ambassador Sharing Instructions
              </h1>
              <p className="mt-2 text-sm text-ink/60">
                {ambassador.name} · {drive?.name ?? "Qur'an & Seerah Drive"} · Target{" "}
                {DRIVE_CURRENCY} {ambassador.chosenTarget.toLocaleString()}
              </p>
            </div>

            <ol className="space-y-6">
              <Step
                icon={<Share2 className="h-4 w-4" />}
                title="Share the Drive"
                text={`Tell your family, friends, and classmates about the ${
                  drive?.name ?? "Qur'an & Seerah Drive"
                }. Explain why it matters and what their donation funds.`}
              />
              <Step
                icon={<HandCoins className="h-4 w-4" />}
                title="Send them to the donate page"
                text="Direct donors to the Drive's donate page. When they fill out the donation form, ask them to select your name from the 'Select Ambassador' dropdown so it counts toward your target."
              />
              <Step
                icon={<MessageCircleHeart className="h-4 w-4" />}
                title="Follow up with gratitude"
                text="Thank every donor personally — a short message goes a long way, and keeps them engaged for future drives."
              />
              <Step
                icon={<Award className="h-4 w-4" />}
                title="Reach your target"
                text="Once verified donations attributed to you reach your committed target, your certificate is issued automatically — you'll be able to download it from your Ambassador page."
              />
            </ol>

            <div className="mt-8 flex justify-center">
              <PrintButton label="Save instructions as PDF" />
            </div>
          </div>
        </div>
      </main>
      <Footer content={content.footer} navContent={content.nav} customLogo={content.customLogo} />
    </>
  );
}

function Step({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-emerald-deep/10 text-emerald-deep shrink-0">
        {icon}
      </span>
      <div>
        <p className="font-medium text-sm text-ink">{title}</p>
        <p className="mt-1 text-sm text-ink/65 leading-relaxed">{text}</p>
      </div>
    </li>
  );
}
