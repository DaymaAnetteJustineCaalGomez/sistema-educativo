import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT || 5433), // local 5433; en CI se sobreescribe
  user: process.env.POSTGRES_USER || 'testuser',
  password: process.env.POSTGRES_PASSWORD || 'testpass',
  database: process.env.POSTGRES_DB || 'testdb'
});
export const query = (text, params) => pool.query(text, params);
export const closePool = async () => pool.end();
