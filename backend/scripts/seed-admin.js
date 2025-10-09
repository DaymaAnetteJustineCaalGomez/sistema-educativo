// backend/scripts/seed-admin.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Cargar siempre backend/.env sin importar desde dónde ejecutes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { Usuario } from '../models/Usuario.js';

async function main() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('Falta MONGO_URI en .env');
      process.exit(1);
    }

    await mongoose.connect(uri, { dbName: process.env.MONGO_DB || undefined });

    const email = 'admin@correo.com';
    const plainPassword = 'Admin2025!';
    const rol = 'ADMIN';
    const nombre = 'Administrador del Sistema';

    const existing = await Usuario.findOne({ email }).lean();
    if (existing) {
      console.log(`✅ Usuario ADMIN ya existía: ${email}`);
      return;
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);

    const admin = await Usuario.create({
      nombre,
      email,
      passwordHash,
      rol,
    });

    console.log('✅ Usuario ADMIN creado con éxito:');
    console.log({
      _id: admin._id.toString(),
      email: admin.email,
      rol: admin.rol,
      createdAt: admin.createdAt,
    });
  } catch (err) {
    console.error('❌ Error en seed-admin:', err.message);
    if (err.code === 11000) {
      console.error('E11000 duplicate key: ya existe un usuario con ese email.');
    }
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
