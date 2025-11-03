// backend/config/db.js
import mongoose from 'mongoose';

function buildConnectionOptions() {
  const options = {
    serverSelectionTimeoutMS: Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 12000),
  };

  if (String(process.env.MONGO_DIRECT_CONNECTION).toLowerCase() === 'true') {
    options.directConnection = true;
  }

  return options;
}

async function tryConnect(uri, options) {
  if (!uri) return null;
  const trimmed = uri.trim();
  if (!trimmed) return null;

  await mongoose.connect(trimmed, options);
  return mongoose.connection;
}

export async function connectDB() {
  const primaryUri = process.env.MONGO_URI;
  if (!primaryUri) throw new Error('Falta MONGO_URI en .env');

  const fallbackUri = process.env.MONGO_URI_FALLBACK;
  const allowLocalFallback = String(process.env.MONGO_ALLOW_LOCAL_FALLBACK || 'true').toLowerCase() !== 'false';
  const dbName = process.env.MONGO_DB_NAME || 'sistema_educativo';

  const connectionOptions = buildConnectionOptions();

  mongoose.set('strictQuery', true);

  try {
    await tryConnect(primaryUri, connectionOptions);
  } catch (primaryError) {
    const reason = primaryError?.reason || primaryError;
    const isDnsError = /enotfound/i.test(String(reason?.code || reason?.message || ''));

    if (fallbackUri) {
      console.warn('⚠️  Conexión principal falló. Probando MONGO_URI_FALLBACK...');
      await tryConnect(fallbackUri, connectionOptions);
    } else if (allowLocalFallback && isDnsError) {
      const localUri = `mongodb://127.0.0.1:27017/${dbName}`;
      console.warn('⚠️  Conexión DNS no disponible. Intentando con instancia local:', localUri);
      await tryConnect(localUri, connectionOptions);
    } else {
      throw primaryError;
    }
  }

  console.log('✅ MongoDB conectado:', mongoose.connection.name);
  return mongoose.connection;
}
