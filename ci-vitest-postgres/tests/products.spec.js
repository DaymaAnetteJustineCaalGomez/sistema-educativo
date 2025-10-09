import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createProduct, getProducts, clearProducts } from '../src/products.js';
import { query, closePool } from '../src/db.js';
import 'dotenv/config';

describe('Products (integración con Postgres real)', () => {
  beforeAll(async () => {
    await query(`CREATE TABLE IF NOT EXISTS products(
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );`);
  });

  beforeEach(async () => { await clearProducts(); });
  afterAll(async () => { await closePool(); });

  it('crea un producto válido', async () => {
    const p = await createProduct('Mouse', 99.99);
    expect(p.id).toBeGreaterThan(0);
    expect(p.name).toBe('Mouse');
  });

  it('lista productos luego de insertar', async () => {
    await createProduct('Teclado', 150);
    const list = await getProducts();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Teclado');
  });

  it('rechaza precio negativo (CHECK)', async () => {
    await expect(createProduct('Invalido', -5)).rejects.toThrow();
  });
});