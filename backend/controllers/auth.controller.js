// -------- POST /api/auth/forgot-password --------
export const forgotPassword = async (req, res, next) => {
  try {
    const email = normEmail(req.body.email);
    const user = await Usuario.findOne({ email });

    // Respuesta uniforme para no filtrar existencia de cuentas
    if (!user) return res.json({ ok: true });

    // Genera token crudo y guarda hash + expiración en el usuario
    // (createPasswordResetToken DEBE setear passwordResetToken + passwordResetExpires)
    const rawToken = user.createPasswordResetToken();

    // Guardamos sin validar otras cosas (por si hay campos requeridos que no tocaremos)
    await user.save({ validateBeforeSave: false });

    // URL que verá el usuario (tu frontend)
    const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${rawToken}`;
    const html = resetPasswordTemplate(resetUrl);

    try {
      await sendEmail({
        to: user.email,
        subject: 'Restablece tu contraseña',
        html,
      });

      // No reveles demasiado: solo confirma que el flujo sigue
      return res.json({ ok: true });
    } catch (e) {
      // Si falló el envío, limpiamos el estado de reset en BD para no dejar tokens colgados
      if (typeof user.clearPasswordReset === 'function') {
        user.clearPasswordReset();
      } else {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
      }
      await user.save({ validateBeforeSave: false });

      // Propagamos un error controlado
      e.status = 500;
      e.message = 'No se pudo enviar el correo de restablecimiento';
      return next(e);
    }
  } catch (err) {
    return next(err);
  }
};
