import nodemailer from "nodemailer";

/**
 * Brevo SMTP relay. Requires SMTP_LOGIN (Brevo account login email) and
 * SMTP_KEY (Brevo SMTP key, already in .env.local) — see .env.local.example.
 */
export const createEmailTransport = () => {
  const login = process.env.SMTP_LOGIN;
  const key = process.env.SMTP_KEY;

  if (!login || !key) {
    throw new Error("SMTP_LOGIN and SMTP_KEY must be set to send email");
  }

  return nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: { user: login, pass: key },
  });
};

export const getFromAddress = () => {
  const email = process.env.SMTP_FROM_EMAIL || process.env.SMTP_LOGIN;
  const name = process.env.SMTP_FROM_NAME || "eSignee® by Polixnov Logistics";
  return `"${name}" <${email}>`;
};
