/**
 * Apply an answer key to a paper's questions.
 * Usage: node apply_answer_key.mjs <slug> <key.json>
 * key.json: { "<qnum>": <optionIndex 0-3> }
 */
import 'dotenv/config'
import fs from 'fs'
import { prisma } from './server/utils/db.js'

const [slug, keyPath] = process.argv.slice(2)
if (!slug || !keyPath) { console.error('usage: node apply_answer_key.mjs <slug> <key.json>'); process.exit(1) }

const key = JSON.parse(fs.readFileSync(keyPath, 'utf-8'))

async function withRetry(fn, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try { return await fn() }
    catch (e) { if (i === tries - 1) throw e; await new Promise(r => setTimeout(r, 4000)) }
  }
}

const paper = await withRetry(() => prisma.questionPaper.findUnique({ where: { slug } }))
if (!paper) { console.error('paper not found:', slug); process.exit(1) }

let n = 0
for (const [num, opt] of Object.entries(key)) {
  const r = await withRetry(() => prisma.paperQuestion.updateMany({
    where: { paperId: paper.id, number: parseInt(num, 10) },
    data: { correctOption: opt },
  }))
  n += r.count
}
const graded = await prisma.paperQuestion.count({ where: { paperId: paper.id, correctOption: { not: null } } })
console.log(`Applied ${Object.keys(key).length} answers to ${slug}; rows updated=${n}; now graded=${graded}`)
await prisma.$disconnect()
