import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Clock3, PackageCheck, MapPin, CalendarDays } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getContent } from "@/lib/content-store";
import { getApplication, getDrive, getDriveItem } from "@/lib/drive-store";
import { formatDate } from "@/lib/utils";
import { TicketQr } from "./TicketQr";

export const metadata: Metadata = {
  title: "Your Pickup Ticket — Qur'an & Seerah Drive",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_CONFIG = {
  "pending-review": {
    label: "Pending review",
    className: "bg-sapphire/15 text-sapphire",
    icon: Clock3,
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-emerald-deep/15 text-emerald-deep",
    icon: CheckCircle2,
  },
  waitlisted: {
    label: "Waitlisted",
    className: "bg-amber/15 text-amber",
    icon: Clock3,
  },
  "picked-up": {
    label: "Picked up",
    className: "bg-ink/15 text-ink/70",
    icon: PackageCheck,
  },
};

export default async function DriveApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [content, application] = await Promise.all([getContent(), getApplication(id)]);
  if (!application) notFound();

  const [drive, item] = await Promise.all([
    getDrive(application.driveId),
    getDriveItem(application.itemId),
  ]);

  const status = STATUS_CONFIG[application.status];
  const StatusIcon = status.icon;

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

          <div className="ornate-card p-8 text-center">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full mb-5 ${status.className}`}
            >
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </span>

            <h1 className="heading-serif text-3xl font-semibold text-emerald-deep">
              {item?.name ?? "Reserved item"}
            </h1>
            <p className="mt-1 text-sm text-ink/60">{drive?.name}</p>

            {drive && (
              <div className="inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-3 text-xs text-ink/55">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-deep" />
                  {drive.pickupLocation}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-emerald-deep" />
                  {formatDate(drive.startDate)} – {formatDate(drive.endDate)}
                </span>
              </div>
            )}
            {drive?.pickupNote && (
              <p className="mt-2 text-xs text-ink/50">{drive.pickupNote}</p>
            )}

            <div className="gold-divider" />

            <div className="flex flex-col items-center gap-4">
              <TicketQr value={application.pickupCode} />
              <p className="font-mono text-lg tracking-wide text-emerald-deep">
                {application.pickupCode}
              </p>
              <p className="text-sm text-ink/60 max-w-xs">
                Download this QR code and make sure to bring it with you —
                printed or on your phone — on the Drive Day. The pickup table
                will scan it to hand over your copy.
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ink/45">
            Applied under {application.applicantName} ·{" "}
            <Link href="/drive/me" className="text-emerald-deep hover:underline">
              View all your Drive records
            </Link>
          </p>
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
