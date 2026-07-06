import { createEmailTransport, getFromAddress } from "./client";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email, or logs and returns false if SMTP isn't configured yet —
 * a missing/misconfigured mailer shouldn't fail the document-generation or
 * signing flow that triggered it.
 */
export const sendEmail = async ({ to, subject, html }: SendEmailInput): Promise<boolean> => {
  try {
    const transport = createEmailTransport();
    await transport.sendMail({ from: getFromAddress(), to, subject, html });
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    return false;
  }
};
