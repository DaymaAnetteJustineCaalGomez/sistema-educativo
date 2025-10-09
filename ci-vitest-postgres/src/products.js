import { query } from './db.js';

export async function createProduct(name, price) {
  const { rows } = await query(
    `INSERT INTO products (name, price) VALUES ($1,$2) RETURNING id,name,price,created_at`,
    [name, price]
  );
  return rows[0];
}

export async function getProducts() {
  const { rows } = await query(
    `SELECT id,name,price,created_at FROM products ORDER BY id ASC`
  );
  return rows;
}

export async function clearProducts() {
  await query('TRUNCATE TABLE products RESTART IDENTITY');
}
