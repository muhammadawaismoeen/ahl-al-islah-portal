import type { StoredSubmission } from "./storage";
import type { DriveApplication, Donation } from "./drive-types";

/**
 * Shared Resend sender. Only fires if both RESEND_API_KEY and
 * NOTIFICATION_EMAIL env vars are set, so the portal works out-of-the-box
 * without any third-party account.
 */
async function sendNotificationEmail(subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) return { skipped: true as const };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Ahl Al-Islah <noreply@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { skipped: false as const, ok: false, error: text };
    }
    return { skipped: false as const, ok: true };
  } catch (error) {
    return {
      skipped: false as const,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function notifyNewSubmission(record: StoredSubmission) {
  const html = `
    <div style="font-family: Georgia, serif; color: #1C2333; max-width: 640px;">
      <h2 style="color: #1F5A3B;">New application — ${escape(
        record.positionTitle
      )}</h2>
      <p style="color: #5c6478;">Wing: ${escape(record.wing)} · Received: ${new Date(
    record.submittedAt
  ).toUTCString()}</p>
      <hr style="border: 0; border-top: 1px solid #E7E0D2;" />
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        ${Object.entries(record.data)
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding: 8px; vertical-align: top; font-weight: 600; width: 30%; border-bottom: 1px solid #E7E0D2;">${escape(
              k
            )}</td>
            <td style="padding: 8px; vertical-align: top; border-bottom: 1px solid #E7E0D2;">${escape(
              formatValue(v)
            )}</td>
          </tr>`
          )
          .join("")}
      </table>
      <p style="margin-top: 24px; color: #8991a3; font-size: 12px;">
        Submission ID: ${record.id}
      </p>
    </div>
  `;
  return sendNotificationEmail(
    `[Ahl Al-Islah] New application — ${record.positionTitle}`,
    html
  );
}

export async function notifyNewBookApplication(record: DriveApplication) {
  const html = `
    <div style="font-family: Georgia, serif; color: #1C2333; max-width: 640px;">
      <h2 style="color: #1F5A3B;">New Drive book reservation</h2>
      <p style="color: #5c6478;">${escape(record.applicantName)} · ${escape(
    record.applicantContact
  )}</p>
      <hr style="border: 0; border-top: 1px solid #E7E0D2;" />
      <p style="margin-top: 16px;">Status: <strong>${escape(record.status)}</strong></p>
      <p style="margin-top: 24px; color: #8991a3; font-size: 12px;">
        Pickup code: ${escape(record.pickupCode)} · Application ID: ${record.id}
      </p>
    </div>
  `;
  return sendNotificationEmail(
    `[Ahl Al-Islah] Book reservation — ${record.status}`,
    html
  );
}

export async function notifyNewDonation(record: Donation) {
  const html = `
    <div style="font-family: Georgia, serif; color: #1C2333; max-width: 640px;">
      <h2 style="color: #1F5A3B;">New Drive donation submitted</h2>
      <p style="color: #5c6478;">${escape(
        record.donorName ?? "Anonymous donor"
      )} · ${escape(record.donorContact ?? "no contact given")}</p>
      <hr style="border: 0; border-top: 1px solid #E7E0D2;" />
      <p style="margin-top: 16px;">Amount: <strong>${record.amount}</strong></p>
      <p style="margin-top: 24px; color: #8991a3; font-size: 12px;">
        Reference: ${escape(record.refCode)} · Donation ID: ${record.id} · Pending review.
      </p>
    </div>
  `;
  return sendNotificationEmail(
    `[Ahl Al-Islah] New donation pending review — ${record.refCode}`,
    html
  );
}

function escape(input: string) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (v === null || v === undefined) return "—";
  return String(v);
}
