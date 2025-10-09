// db.js
import mongoose from 'mongoose';

export async function connectDB() {
  const { MONGO_URI } = process.env;
  if (!MONGO_URI) throw new Error('MONGO_URI no definido (.env)');

  mongoose.connection.on('connected', () => {
    console.log('✅ Conectado a MongoDB Atlas');
  });
  mongoose.connection.on('error', (e) => {
    console.error('❌ Error de conexión MongoDB:', e.message);
  });

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 12000 });
}
