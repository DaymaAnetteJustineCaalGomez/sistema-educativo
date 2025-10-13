// backend/utils/sendEmail.js
import nodemailer from 'nodemailer';

function required(name, val) {
  if (!val) throw new Error(`Falta variable ${name} en .env`);
  return val;
}

export async function sendEmail({ to, subject, html, text }) {
  const provider = (process.env.EMAIL_PROVIDER || 'gmail').toLowerCase();

  let transporter;
  let from;

  if (provider === 'gmail') {
    const user = required('GMAIL_USER', process.env.GMAIL_USER);
    const pass = required('GMAIL_PASS', process.env.GMAIL_PASS);
    from = process.env.MAIL_FROM || user;

    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Gmail App Password → puerto 465 + secure
      auth: { user, pass },
    });
  } else if (provider === 'mailtrap') {
    const host = required('MAIL_HOST', process.env.MAIL_HOST);
    const port = Number(required('MAIL_PORT', process.env.MAIL_PORT));
    const user = required('MAIL_USER', process.env.MAIL_USER);
    const pass = required('MAIL_PASS', process.env.MAIL_PASS);
    from = process.env.MAIL_FROM || 'no-reply@example.local';

    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  } else {
    throw new Error(`EMAIL_PROVIDER desconocido: ${provider}`);
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
    // Log útil para debug
    console.log('📧 Email enviado:', {
      provider,
      messageId: info.messageId,
      to,
      from,
      response: info.response,
    });
    return info;
  } catch (err) {
    console.error('❌ Error enviando email:', {
      name: err.name,
      code: err.code,
      command: err.command,
      response: err.response,
      message: err.message,
    });
    throw err; // deja que el controller maneje el 500
  }
}
