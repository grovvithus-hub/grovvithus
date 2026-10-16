import nodemailer, { type Transporter } from "nodemailer";

export interface MailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface MailResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

let transporter: Transporter | null = null;

const smtpConfigured = () => !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const getTransporter = () => {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
  }
  return transporter;
};

/** Email delivery is switched off when DISABLE_EMAILS=true or SMTP is not configured. */
export const emailsEnabled = () => process.env.DISABLE_EMAILS !== "true" && smtpConfigured();

export async function sendMail(
  to: string,
  subject: string,
  html: string,
  attachments: MailAttachment[] = [],
  options: { cc?: string[]; fromName?: string; replyTo?: string } = {},
): Promise<MailResult> {
  if (!emailsEnabled()) {
    console.info(`[mail] Not sent (emails disabled or SMTP not set): "${subject}" to ${to}`);
    return { success: false, skipped: true };
  }
  try {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER!;
    await getTransporter().sendMail({
      from: options.fromName ? `"${options.fromName.replace(/"/g, "")}" <${fromAddress}>` : fromAddress,
      to,
      cc: options.cc?.length ? options.cc : undefined,
      replyTo: options.replyTo,
      subject,
      html,
      attachments,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Email could not be delivered" };
  }
}
