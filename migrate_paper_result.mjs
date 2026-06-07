/**
 * Idempotent migration: create the PaperResult table used for per-paper
 * attempt counts + graded-only average scores. Safe to run multiple times.
 *
 *   node migrate_paper_result.mjs
 *
 * Reads DATABASE_URL from .env (same connection the API uses).
 */
import 'dotenv/config'
import pg from 'pg'
const { Pool } = pg

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set. Add it to .env first.')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

const SQL = `
CREATE TABLE IF NOT EXISTS "PaperResult" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "slug"         TEXT,
  "userId"       TEXT,
  "graded"       BOOLEAN NOT NULL DEFAULT false,
  "scorePercent" DOUBLE PRECISION,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "PaperResult_slug_idx"   ON "PaperResult" ("slug");
CREATE INDEX IF NOT EXISTS "PaperResult_userId_idx" ON "PaperResult" ("userId");
SELECT 'PaperResult ready' as status;
`

async function run() {
  const client = await pool.connect()
  try {
    const result = await client.query(SQL)
    const last = Array.isArray(result) ? result[result.length - 1] : result
    console.log('✅ Migration complete:', last.rows?.[0] ?? 'ok')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

run()
