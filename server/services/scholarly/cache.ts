/**
 * Simple TTL cache for scholarly API responses (MySQL-backed).
 */

import crypto from 'crypto';
import pool from '../../../database/config.js';

const DEFAULT_TTL = Number(process.env.SCHOLARLY_CACHE_TTL_SEC || 3600);

export function cacheKey(parts: unknown[]): string {
  const raw = JSON.stringify(parts);
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 191);
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const result = await pool.query(
      `SELECT payload FROM scholarly_cache WHERE cache_key = $1 AND expires_at > NOW()`,
      [key]
    );
    const row = result.rows?.[0];
    if (!row?.payload) return null;
    return JSON.parse(typeof row.payload === 'string' ? row.payload : JSON.stringify(row.payload)) as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, payload: unknown, ttlSec = DEFAULT_TTL): Promise<void> {
  try {
    const expires = new Date(Date.now() + ttlSec * 1000);
    await pool.query(
      `INSERT INTO scholarly_cache (cache_key, payload, expires_at)
       VALUES ($1, $2, $3)
       ON DUPLICATE KEY UPDATE payload = VALUES(payload), expires_at = VALUES(expires_at)`,
      [key, JSON.stringify(payload), expires]
    );
  } catch (e) {
    console.warn('scholarly cache write failed:', (e as Error).message);
  }
}
