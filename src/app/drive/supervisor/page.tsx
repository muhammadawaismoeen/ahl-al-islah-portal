import type { Metadata } from "next";
import { isAuthenticated } from "@/app/admin/actions";
import {
  getSupervisorBoard,
  supervisorPinIsSet,
  hasSupervisorPinCookie,
  type WingTotals,
  type SupervisorBoard,
} from "@/lib/drive-supervisor";
import { DRIVE_WINGS, DRIVE_WING_LABEL } from "@/lib/drive-types";
import { SupervisorPinGate, BoardAutoRefresh } from "./SupervisorBoardClient";

export const metadata: Metadata = {
  title: "Drive Day board",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Deep jewel ground rather than the portal's ivory: this page is meant to
 *  be projected or left on a laptop across a bright hall, where large light
 *  figures on a dark field read from the back of the room. */
const GROUND = "min-h-screen bg-[#0C1A14] text-white";

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
      <main className={`${GROUND} flex items-center justify-center p-6`}>
        <p className="text-center text-white/55 max-w-sm">
          The Drive Day board is switched off. An Owner can turn it on from
          Admin → Drive → Payment Settings.
        </p>
      </main>
    );
  }

  if (!signedIn && !hasCookie) {
    return (
      <main className={`${GROUND} flex items-center justify-center p-6`}>
        <SupervisorPinGate />
      </main>
    );
  }

  const board = await getSupervisorBoard();

  if (!board) {
    return (
      <main className={`${GROUND} flex items-center justify-center p-6`}>
        <p className="text-center text-white/55">No drive to report on yet.</p>
      </main>
    );
  }

  return (
    <main className={`${GROUND} px-5 py-7 sm:px-8 sm:py-10`}>
      <div className="max-w-6xl mx-auto">
        <Header board={board} />

        <div className="grid sm:grid-cols-2 gap-5 mb-8">
          {DRIVE_WINGS.map((wing) => (
            <WingCard
              key={wing}
              label={DRIVE_WING_LABEL[wing]}
              totals={board.wings[wing]}
            />
          ))}
        </div>

        {board.unassigned.booked > 0 && <UnassignedNotice board={board} />}

        <BookTable board={board} />
      </div>
    </main>
  );
}

function Header({ board }: { board: SupervisorBoard }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-7">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl text-white leading-tight">
          {board.driveName}
        </h1>
        <p className="text-sm text-white/45 mt-1">{board.pickupLocation}</p>
      </div>
      <div className="flex items-center gap-5">
        <div className="text-right">
          <p className="text-[0.7rem] uppercase tracking-wider text-white/40">
            In the hall
          </p>
          <p className="text-2xl font-semibold tabular-nums text-white">
            {board.overall.registered - board.overall.handedOver}
          </p>
        </div>
        <BoardAutoRefresh generatedAt={board.generatedAt} />
      </div>
    </header>
  );
}

function WingCard({ label, totals }: { label: string; totals: WingTotals }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="font-serif text-xl text-gold">{label}</h2>
        <p className="text-sm text-white/40 tabular-nums">
          {totals.booked} booked
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-center">
        <Figure label="Registered" value={totals.registered} tone="bright" />
        <Figure label="Handed over" value={totals.handedOver} tone="gold" />
        <Figure label="Yet to arrive" value={totals.yetToArrive} tone="dim" />
      </dl>
    </section>
  );
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "bright" | "gold" | "dim";
}) {
  const color =
    tone === "gold"
      ? "text-gold"
      : tone === "dim"
        ? "text-white/45"
        : "text-white";
  return (
    <div>
      <dd
        className={`font-serif text-4xl sm:text-5xl tabular-nums leading-none ${color}`}
      >
        {value}
      </dd>
      <dt className="text-[0.7rem] uppercase tracking-wider text-white/40 mt-2">
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
    <p className="rounded-xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm text-gold mb-8">
      <strong className="font-semibold tabular-nums">{booked}</strong>{" "}
      {booked === 1 ? "applicant has" : "applicants have"} no wing recorded, so{" "}
      {booked === 1 ? "it isn't" : "they aren't"} counted above —{" "}
      <span className="tabular-nums">{registered}</span> registered,{" "}
      <span className="tabular-nums">{handedOver}</span> handed over. Set their
      wing in Admin → Drive → Applicants.
    </p>
  );
}

function BookTable({ board }: { board: SupervisorBoard }) {
  if (board.books.length === 0) return null;
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[0.7rem] uppercase tracking-wider text-white/40 border-b border-white/10">
              <th className="px-5 py-3 font-medium">Book</th>
              <th className="px-5 py-3 font-medium text-right">Booked</th>
              <th className="px-5 py-3 font-medium text-right">Given</th>
              <th className="px-5 py-3 font-medium text-right">Left</th>
            </tr>
          </thead>
          <tbody>
            {board.books.map((book) => (
              <tr
                key={book.id}
                className="border-b border-white/[0.07] last:border-0"
              >
                <td className="px-5 py-3.5 text-base sm:text-lg text-white">
                  {book.name}
                </td>
                <td className="px-5 py-3.5 text-right text-lg tabular-nums text-white/70">
                  {book.booked}
                </td>
                <td className="px-5 py-3.5 text-right text-lg tabular-nums text-gold">
                  {book.given}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {book.left === 0 ? (
                    <span className="inline-block rounded-md bg-danger/25 text-[#F3A49C] text-xs font-semibold uppercase tracking-wider px-2.5 py-1">
                      Out
                    </span>
                  ) : (
                    <span className="text-lg tabular-nums text-white">
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
