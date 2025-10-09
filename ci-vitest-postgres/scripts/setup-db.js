import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// En CI usamos hostname 'postgres' y 5432 (se sobreescribe por env del job)
const isCI = !!process.env.GITHUB_ACTIONS;
const cfg = {
  host: process.env.POSTGRES_HOST || (isCI ? 'postgres' : '127.0.0.1'),
  port: Number(process.env.POSTGRES_PORT || (isCI ? 5432 : 5433)),
  user: process.env.POSTGRES_USER || 'testuser',
  password: process.env.POSTGRES_PASSWORD || 'testpass',
  database: process.env.POSTGRES_DB || 'testdb'
};

const pool = new Pool(cfg);

async function waitForDb(max=60, delay=1000){
  for (let i=1;i<=max;i++){
    try { await pool.query('SELECT 1'); return; }
    catch { await new Promise(r=>setTimeout(r,delay)); }
  }
  throw new Error('DB did not become ready in time');
}

async function run(){
  await waitForDb();
  const schemaPath = path.join(__dirname, '../sql/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  await pool.query(sql);
  console.log('✅ DB inicializada');
  await pool.end();
}
run().catch(e=>{ console.error('❌ Error inicializando:', e); process.exit(1); });