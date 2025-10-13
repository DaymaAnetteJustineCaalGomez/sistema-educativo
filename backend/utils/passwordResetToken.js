// utils/passwordResetToken.js
import crypto from 'crypto';

export function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex'); // lo que viaja por email
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex'); // lo que guardas en DB
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  return { rawToken, hashedToken, expiresAt };
}
