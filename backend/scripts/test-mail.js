// backend/scripts/test-mail.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar backend/.env sin importar el cwd
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { sendEmail } from '../utils/sendEmail.js';

const TO = process.env.GMAIL_USER || process.env.MAIL_TO || 'test@example.com';

(async () => {
  try {
    console.log('→ EMAIL_PROVIDER =', process.env.EMAIL_PROVIDER);
    console.log('→ Enviando prueba a:', TO);

    await sendEmail({
      to: TO,
      subject: 'Prueba | Sistema Educativo',
      html: '<h2>Funciona 🎉</h2><p>Este es un correo de prueba.</p>',
      text: 'Funciona (correo de prueba).',
    });

    console.log('✅ Prueba OK');
    process.exit(0);
  } catch (err) {
    console.error('❌ Prueba falló:', err?.message || err);
    process.exit(1);
  }
})();
