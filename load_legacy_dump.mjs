/**
 * Load the legacy Postgres dump (full_postgres.sql) into the DB pointed to by
 * DATABASE_URL. This restores the ~155 legacy tables (closing_ranks, open_states,
 * per-state college tables, etc.) that power the detailed College Predictor.
 *
 * Legacy tables are lowercase (e.g. "users", "colleges") and DO NOT collide with
 * the Prisma PascalCase tables ("User", "College"), so this is additive.
 *
 * Streams statement-by-statement with retry to survive Neon free-tier drops.
 */
import 'dotenv/config'
import fs from 'fs'
import readline from 'readline'
import pg from 'pg'

const URL = process.env.DATABASE_URL
if (!URL) { console.error('DATABASE_URL not set'); process.exit(1) }

const pool = new pg.Pool({
  connectionString: URL,
  ssl: { rejectUnauthorized: true },
  max: 4,
  statement_timeout: 600000,
  connectionTimeoutMillis: 60000,
})
pool.on('error', (e) => console.error('idle client error:', e.message))

async function safeQuery(sql, tag, retries = 6) {
  while (retries > 0) {
    try { await pool.query(sql); return true }
    catch (e) {
      if (e.code === 'ECONNRESET' || e.code === 'EPIPE' || /terminat|timeout/i.test(e.message)) {
        await new Promise(r => setTimeout(r, 3000)); retries--
      } else {
        console.error(`  [${tag}] ${e.message.slice(0, 140)}`)
        return false  // skip a single bad statement, keep going
      }
    }
  }
  return false
}

async function main() {
  await safeQuery("SET client_encoding = 'UTF8'", 'INIT')
  await safeQuery('SET standard_conforming_strings = off', 'INIT')
  await safeQuery('SET escape_string_warning = off', 'INIT')
  console.log('Streaming full_postgres.sql ...')

  const rl = readline.createInterface({ input: fs.createReadStream('full_postgres.sql'), crlfDelay: Infinity })
  let buf = []
  let ok = 0, fail = 0

  for await (const line of rl) {
    const t = line.trim()
    if (!t && buf.length === 0) continue
    if (t === 'BEGIN;' || t === 'COMMIT;') continue
    if (t.startsWith('SET client_encoding') || t.startsWith('SET standard_conforming_strings') || t.startsWith('SET escape_string_warning')) continue

    buf.push(line)
    if (!t.endsWith(';')) continue

    const stmt = buf.join('\n')
    // ensure not inside a string literal (count unescaped single quotes)
    let q = 0, esc = false
    for (let i = 0; i < stmt.length; i++) {
      const ch = stmt[i]
      if (esc) { esc = false; continue }
      if (ch === '\\') { esc = true; continue }
      if (ch === "'") q++
    }
    if (q % 2 !== 0) continue   // still inside a string

    buf = []
    let tag = 'EXEC'
    if (stmt.startsWith('DROP')) tag = 'DROP'
    else if (stmt.startsWith('CREATE')) tag = 'CREATE'
    else if (stmt.startsWith('INSERT')) { const m = stmt.match(/INSERT INTO\s+"([^"]+)"/i); if (m) tag = `INSERT ${m[1]}` }
    else if (stmt.startsWith('ALTER')) tag = 'ALTER'

    if (await safeQuery(stmt, tag)) { ok++; if (ok % 200 === 0) console.log(`  ${ok} statements...`) }
    else fail++
  }
  if (buf.length) await safeQuery(buf.join('\n'), 'FINAL')

  await pool.end()
  console.log(`\nDone. ok=${ok} fail=${fail}`)
}
main().catch(e => { console.error('Fatal:', e); process.exit(1) })
