import type { StoredSubmission } from "./storage";

/**
 * Optional email notification via Resend. Only fires if both
 * RESEND_API_KEY and NOTIFICATION_EMAIL env vars are set, so the
 * portal works out-of-the-box without any third-party account.
 */
export async function notifyNewSubmission(record: StoredSubmission) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.NOTIFICATION_EMAIL;
  if (!apiKey || !to) return { skipped: true as const };

  const html = `
    <div style="font-family: Georgia, serif; color: #0f1a17; max-width: 640px;">
      <h2 style="color: #0a4d3c;">New application — ${escape(
        record.positionTitle
      )}</h2>
      <p style="color: #555;">Wing: ${escape(record.wing)} · Received: ${new Date(
    record.submittedAt
  ).toUTCString()}</p>
      <hr style="border: 0; border-top: 1px solid #e5c16f;" />
      <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
        ${Object.entries(record.data)
          .map(
            ([k, v]) => `
          <tr>
            <td style="padding: 8px; vertical-align: top; font-weight: 600; width: 30%; border-bottom: 1px solid #f0e8d0;">${escape(
              k
            )}</td>
            <td style="padding: 8px; vertical-align: top; border-bottom: 1px solid #f0e8d0;">${escape(
              formatValue(v)
            )}</td>
          </tr>`
          )
          .join("")}
      </table>
      <p style="margin-top: 24px; color: #888; font-size: 12px;">
        Submission ID: ${record.id}
      </p>
    </div>
  `;

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
        subject: `[Ahl Al-Islah] New application — ${record.positionTitle}`,
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
