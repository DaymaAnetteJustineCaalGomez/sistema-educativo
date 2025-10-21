// backend/utils/sendEmail.js
import nodemailer from "nodemailer";

/** Util: obliga a que exista una variable de entorno. */
function required(name, val) {
  if (!val) throw new Error(`Falta variable ${name} en .env`);
  return val;
}

/** Normaliza el "from" con nombre */
function resolveFrom(envFrom, fallbackUser) {
  const user = fallbackUser?.trim();
  const from = (envFrom || user || "").trim();
  if (!from) return user;
  if (from.includes("<") && from.includes(">")) return from;
  const looksLikeEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from);
  if (looksLikeEmail) return from;
  if (!user) return from;
  return `${from} <${user}>`;
}

export async function sendEmail({ to, subject, html, text, replyTo, attachments }) {
  const provider = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();

  let transporter;
  let from;

  if (provider === "gmail") {
    const user = required("GMAIL_USER", process.env.GMAIL_USER);
    const pass = required("GMAIL_PASS", process.env.GMAIL_PASS);
    from = resolveFrom(process.env.MAIL_FROM, user);

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  } else if (provider === "mailtrap") {
    const host = required("MAIL_HOST", process.env.MAIL_HOST);
    const port = Number(required("MAIL_PORT", process.env.MAIL_PORT));
    const user = required("MAIL_USER", process.env.MAIL_USER);
    const pass = required("MAIL_PASS", process.env.MAIL_PASS);
    from = resolveFrom(process.env.MAIL_FROM, "no-reply@example.local");

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    });
  } else {
    throw new Error(`EMAIL_PROVIDER desconocido: ${provider}`);
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      await transporter.verify().catch(() => {});
    }

    const plain =
      text ||
      (html ? html.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "");

    const toList = Array.isArray(to) ? to.join(", ") : String(to || "").trim();
    if (!toList) throw new Error("Parámetro 'to' es requerido");

    const info = await transporter.sendMail({
      from,
      to: toList,
      subject: subject || "",
      html: html || undefined,
      text: plain || undefined,
      replyTo: replyTo || undefined,
      attachments: attachments || undefined,
    });

    console.log("📧 Email enviado", {
      provider,
      to: toList,
      from,
      subject,
      messageId: info?.messageId,
      response: info?.response,
    });

    return info;
  } catch (err) {
    console.error("❌ Error enviando email", {
      provider,
      name: err?.name,
      code: err?.code,
      command: err?.command,
      response: err?.response,
      message: err?.message,
    });
    throw err;
  }
}

export default sendEmail;
