import type { Metadata } from "next";
import { isAuthenticated } from "@/app/admin/actions";
import {
  getSupervisorBoard,
  supervisorPinIsSet,
  hasSupervisorPinCookie,
  type WingTotals,
  type SupervisorBoard,
} from "@/lib/drive-supervisor";
import { DRIVE_WINGS, DRIVE_WING_LABEL, type DriveWing } from "@/lib/drive-types";
import { SupervisorPinGate, BoardAutoRefresh } from "./SupervisorBoardClient";

export const metadata: Metadata = {
  title: "Drive Day board",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SupervisorBoardPage() {
  // An admin already signed into the console never has to know the PIN —
  // the board shows them strictly less than the Drive console does.
  const [signedIn, pinSet, hasCookie] = await Promise.all([
    isAuthenticated(),
    supervisorPinIsSet(),
    hasSupervisorPinCookie(),
  ]);

  if (!signedIn && !pinSet) {
    return (
      <Centered>
        <p className="text-ink/55 max-w-sm">
          The Drive Day board is switched off. An Owner can turn it on from
          Admin → Drive → Payment Settings.
        </p>
      </Centered>
    );
  }

  if (!signedIn && !hasCookie) {
    return (
      <Centered>
        <SupervisorPinGate />
      </Centered>
    );
  }

  const board = await getSupervisorBoard();

  if (!board) {
    return (
      <Centered>
        <p className="text-ink/55">No drive to report on yet.</p>
      </Centered>
    );
  }

  /* The whole point of this screen is being glanceable from across a hall,
     so it is pinned to the viewport on anything laptop-sized: the header and
     the two wing cards never scroll away, and only the book table — the one
     section whose height depends on how many titles a drive carries — gets
     an inner scroll. Phones keep ordinary page scrolling. */
  return (
    <main className="min-h-screen bg-bg sm:h-screen sm:overflow-hidden">
      <div className="max-w-6xl h-full mx-auto px-5 py-6 sm:px-8 sm:py-7 flex flex-col gap-5 sm:gap-6">
        <Header board={board} />

        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 shrink-0">
          {DRIVE_WINGS.map((wing) => (
            <WingCard key={wing} wing={wing} totals={board.wings[wing]} />
          ))}
        </div>

        {board.unassigned.booked > 0 && <UnassignedNotice board={board} />}

        <BookTable board={board} />
      </div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
      {children}
    </main>
  );
}

function Header({ board }: { board: SupervisorBoard }) {
  const inHall = board.overall.registered - board.overall.handedOver;
  return (
    <header className="shrink-0 border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span className="section-eyebrow !py-0.5 !text-[0.65rem]">
              Drive Day
            </span>
            <BoardAutoRefresh generatedAt={board.generatedAt} />
          </div>
          <h1 className="heading-serif text-2xl sm:text-3xl text-ink leading-tight truncate">
            {board.driveName}
          </h1>
          <p className="text-sm text-ink/50 mt-0.5 truncate">
            {board.pickupLocation}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-[0.65rem] uppercase tracking-widest text-ink/45 mb-0.5">
            In the hall now
          </p>
          <p className="heading-serif text-4xl text-emerald-deep tabular-nums leading-none">
            {inHall}
          </p>
        </div>
      </div>
    </header>
  );
}

/** Brothers read emerald, Sisters gold — the portal's two jewel accents,
 *  so the two columns are told apart at a glance from across the hall
 *  without either reading as the "primary" one. */
const WING_ACCENT: Record<DriveWing, { bar: string; title: string }> = {
  male: { bar: "bg-emerald-deep", title: "text-emerald-deep" },
  female: { bar: "bg-amber", title: "text-amber" },
};

function WingCard({ wing, totals }: { wing: DriveWing; totals: WingTotals }) {
  const accent = WING_ACCENT[wing];
  const served = totals.booked
    ? Math.round((totals.handedOver / totals.booked) * 100)
    : 0;

  return (
    <section className="ornate-card overflow-hidden">
      <div className={`h-1 ${accent.bar}`} />
      <div className="px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className={`heading-serif text-xl sm:text-2xl ${accent.title}`}>
            {DRIVE_WING_LABEL[wing]}
          </h2>
          <p className="text-sm text-ink/45 tabular-nums">
            {totals.booked} booked
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-center mb-5">
          <Figure label="Registered" value={totals.registered} tone="ink" />
          <Figure
            label="Handed over"
            value={totals.handedOver}
            tone="accent"
            accent={accent.title}
          />
          <Figure label="Yet to arrive" value={totals.yetToArrive} tone="dim" />
        </dl>

        <div className="flex items-center gap-3">
          <div
            className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden"
            role="img"
            aria-label={`${served}% of ${DRIVE_WING_LABEL[wing]} served`}
          >
            <div
              className={`h-full rounded-full ${accent.bar} transition-[width] duration-500`}
              style={{ width: `${served}%` }}
            />
          </div>
          <span className="text-xs text-ink/40 tabular-nums shrink-0">
            {served}% served
          </span>
        </div>
      </div>
    </section>
  );
}

function Figure({
  label,
  value,
  tone,
  accent,
}: {
  label: string;
  value: number;
  tone: "ink" | "accent" | "dim";
  accent?: string;
}) {
  const color =
    tone === "accent"
      ? (accent ?? "text-ink")
      : tone === "dim"
        ? "text-ink/35"
        : "text-ink";
  return (
    <div>
      <dd
        className={`heading-serif text-3xl sm:text-4xl tabular-nums leading-none ${color}`}
      >
        {value}
      </dd>
      <dt className="text-[0.65rem] uppercase tracking-widest text-ink/45 mt-2">
        {label}
      </dt>
    </div>
  );
}

/** Applicants whose wing was never recorded sit in neither column. Saying so
 *  out loud keeps a half-finished backfill from being read as a real split. */
function UnassignedNotice({ board }: { board: SupervisorBoard }) {
  const { booked, registered, handedOver } = board.unassigned;
  return (
    <p className="shrink-0 rounded-xl border border-amber/30 bg-amber/[0.07] px-4 py-2.5 text-[0.82rem] text-amber leading-snug">
      <strong className="font-semibold tabular-nums">{booked}</strong>{" "}
      {booked === 1 ? "applicant has" : "applicants have"} no wing recorded, so{" "}
      {booked === 1 ? "it isn't" : "they aren't"} counted above —{" "}
      <span className="tabular-nums font-medium">{registered}</span> registered,{" "}
      <span className="tabular-nums font-medium">{handedOver}</span> handed
      over. Set their wing in Admin → Drive → Applicants.
    </p>
  );
}

function BookTable({ board }: { board: SupervisorBoard }) {
  if (board.books.length === 0) return null;
  return (
    <section className="ornate-card overflow-hidden flex-1 min-h-0 flex flex-col">
      <div className="overflow-auto">
        <table className="w-full text-left">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-2 text-[0.65rem] uppercase tracking-widest text-ink/45">
              <th className="px-5 sm:px-6 py-2.5 font-medium">Book</th>
              <th className="px-5 py-2.5 font-medium text-right">Booked</th>
              <th className="px-5 py-2.5 font-medium text-right">Given</th>
              <th className="px-5 sm:px-6 py-2.5 font-medium text-right">Left</th>
            </tr>
          </thead>
          <tbody>
            {board.books.map((book) => (
              <tr key={book.id} className="border-t border-border/70">
                <td className="px-5 sm:px-6 py-2.5 text-[0.95rem] sm:text-base text-ink font-medium">
                  {book.name}
                </td>
                <td className="px-5 py-2.5 text-right text-base tabular-nums text-ink/55">
                  {book.booked}
                </td>
                <td className="px-5 py-2.5 text-right text-base tabular-nums text-emerald-deep font-medium">
                  {book.given}
                </td>
                <td className="px-5 sm:px-6 py-2.5 text-right">
                  {book.left === 0 ? (
                    <span className="inline-block rounded-full border border-danger/30 bg-danger/10 text-danger text-[0.65rem] font-semibold uppercase tracking-widest px-2.5 py-0.5">
                      Out
                    </span>
                  ) : (
                    <span className="text-base tabular-nums text-ink">
                      {book.left}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
