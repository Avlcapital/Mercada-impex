import nodemailer from "nodemailer";
export function createMailer(env) {
  if (!env.SMTP_HOST) return null;
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });
  return {
    contact: (message) =>
      transporter.sendMail({
        from: env.MAIL_FROM,
        to: env.SMTP_USER,
        replyTo: message.email,
        subject: `Website: ${message.subject}`,
        text: `${message.name}\n${message.email}\n\n${message.message}`,
      }),
  };
}
