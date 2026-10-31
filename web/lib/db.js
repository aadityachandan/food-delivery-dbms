// Database connections. All settings come from environment variables
// (.env.local) - nothing is hard-coded in the source.
import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

const g = globalThis; // survives hot reloads in development

export function pool() {
  if (!g.__fhPool) {
    g.__fhPool = mysql.createPool({
      host: process.env.MYSQL_HOST || '127.0.0.1',
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD ?? '',
      database: process.env.MYSQL_DATABASE || 'food_delivery',
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,     // DATETIME as 'YYYY-MM-DD HH:MM:SS'
      decimalNumbers: true,  // DECIMAL as a JS number
    });
  }
  return g.__fhPool;
}

export async function query(sql, params = []) {
  const [rows] = await pool().query(sql, params);
  return rows;
}

export async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] ?? null;
}

// BEGIN ... COMMIT, or ROLLBACK on any error
export async function transaction(fn) {
  const conn = await pool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

// Runs fn on one pooled connection (needed for CALL ... @out variables)
export async function withConnection(fn) {
  const conn = await pool().getConnection();
  try { return await fn(conn); } finally { conn.release(); }
}

async function mongoDb() {
  if (g.__fhMongo) return g.__fhMongo;
  if (g.__fhMongoFailedAt && Date.now() - g.__fhMongoFailedAt < 15000) return null;
  try {
    const client = new MongoClient(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017', { serverSelectionTimeoutMS: 2000 });
    await client.connect();
    g.__fhMongo = client.db(process.env.MONGO_DB || 'food_delivery');
    return g.__fhMongo;
  } catch (e) {
    g.__fhMongoFailedAt = Date.now();
    console.warn('MongoDB not reachable:', e.message);
    return null;
  }
}

// MySQL is the source of truth; a MongoDB failure is logged and skipped
export async function mongo(fn, fallback = null) {
  const db = await mongoDb();
  if (!db) return fallback;
  try { return await fn(db); } catch (e) {
    console.warn('MongoDB:', e.message);
    return fallback;
  }
}

export async function status() {
  let mysqlOk = false, mongoOk = false;
  try { await query('SELECT 1'); mysqlOk = true; } catch { /* down */ }
  const db = await mongoDb();
  if (db) { try { await db.command({ ping: 1 }); mongoOk = true; } catch { /* down */ } }
  return { mysql: mysqlOk, mongodb: mongoOk };
}
