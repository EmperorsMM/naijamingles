type EmailArgs = { to: string; subject: string; text: string };
type SmsArgs = { to: string; text: string };

const MODE = process.env.NOTIFY_MODE || "log"; // "log" by default

export async function sendEmail({ to, subject, text }: EmailArgs) {
  if (MODE === "log") {
    console.log("[notify/email]", { to, subject, text });
    return { ok: true };
  }
  // TODO: wire a real provider (Resend, SendGrid…) here.
  console.log("[notify/email:noop]", { to, subject });
  return { ok: true };
}

export async function sendSMS({ to, text }: SmsArgs) {
  if (MODE === "log") {
    console.log("[notify/sms]", { to, text });
    return { ok: true };
  }
  // TODO: wire a real provider (Twilio, Termii, etc.) here.
  console.log("[notify/sms:noop]", { to });
  return { ok: true };
}
