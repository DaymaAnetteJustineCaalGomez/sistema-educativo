// utils/emailTemplates.js
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
