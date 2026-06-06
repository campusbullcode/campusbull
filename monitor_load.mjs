import 'dotenv/config'
import pg from 'pg'
const URL = process.env.DATABASE_URL
async function counts() {
  const c = new pg.Client({ connectionString: URL, ssl:{rejectUnauthorized:true}, connectionTimeoutMillis:60000 })
  await c.connect()
  const out = {}
  for (const t of ['karnatakas','maharashtras','open_states']) {
    try { out[t] = (await c.query(`SELECT count(*)::int n FROM "${t}"`)).rows[0].n } catch { out[t] = 'err' }
  }
  await c.end()
  return out
}
let prev = '', stall = 0
for (let i = 1; i <= 45; i++) {            // up to ~45 min
  let r
  try { r = await counts() } catch (e) { console.log(`check ${i}: conn err ${e.code||e.message}`); await new Promise(s=>setTimeout(s,60000)); continue }
  const sig = JSON.stringify(r)
  console.log(`check ${i}: ${sig}`)
  if (r.open_states > 0) { console.log('OPEN_STATES POPULATED — load reached the end region. DONE.'); break }
  stall = (sig === prev) ? stall + 1 : 0
  prev = sig
  if (stall >= 8) { console.log('NO PROGRESS for ~8 checks — load appears STALLED.'); break }
  await new Promise(s => setTimeout(s, 60000))
}
console.log('FINAL:', JSON.stringify(await counts()))
