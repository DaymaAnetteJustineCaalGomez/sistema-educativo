// backend/utils/emailTemplates.js

// ✔️ Template: Restablecer contraseña (ya lo tenías)
export function resetPasswordTemplate(resetUrl) {
  return `
  <div style="font-family:Arial,sans-serif;line-height:1.55;color:#0f172a">
    <h2 style="margin:0 0 12px">Restablecer contraseña</h2>
    <p>Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón:</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:8px">
        Cambiar mi contraseña
      </a>
    </p>
    <p>Si el botón no funciona, copia y pega esta URL en tu navegador:</p>
    <p><a href="${resetUrl}" style="color:#1d4ed8">${resetUrl}</a></p>
    <p style="color:#64748b;font-size:13px">Este enlace expira en 15 minutos. Si no fuiste tú, ignora este correo.</p>
  </div>
  `;
}

// ➕ Template: Código de registro (OTP) para Docente/Admin
export function registerCodeTemplate(code) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;line-height:1.55;color:#0f172a">
    <h2 style="color:#4f46e5;margin:0 0 12px">Código de verificación</h2>
    <p>Usa este código para completar tu registro como Docente/Administrador:</p>
    <p style="font-size:28px;letter-spacing:4px;font-weight:700;margin:10px 0">${code}</p>
    <p style="color:#64748b">El código expira en <b>10 minutos</b>. Si no solicitaste este código, ignora este correo.</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
    <small style="color:#64748b">Sistema Educativo Inteligente CNB</small>
  </div>
  `;
}
