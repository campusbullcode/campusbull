/**
 * Seed QuestionPaper + PaperQuestion rows from the extracted manifests in
 * public/questions/<slug>/manifest.json. Idempotent (upserts by slug/number).
 * Resilient to Neon free-tier connection drops via retry.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { prisma } from './server/utils/db.js'

// Paper catalogue. PDFs live in public/papers/ ; question images in public/questions/<slug>/
const PAPERS = [
  { slug: 'neet-2026', title: 'NEET (UG) 2026', year: '2026', pdf: '/papers/neet-2026.pdf', hasQuestions: true },
  { slug: 'neet-2023', title: 'NEET (UG) 2023', year: '2023', pdf: '/papers/neet-2023.pdf', hasQuestions: true },
  { slug: 'neet-2024', title: 'NEET (UG) 2024', year: '2024', pdf: '/papers/neet-2024.pdf', hasQuestions: false },
  { slug: 'neet-set-a', title: 'NEET (UG) Practice Set A', year: null, pdf: '/papers/neet-set-a.pdf', hasQuestions: false },
]

async function withRetry(fn, label, tries = 6) {
  for (let i = 0; i < tries; i++) {
    try { return await fn() }
    catch (e) {
      if (i === tries - 1) throw e
      console.log(`  retry ${label} (${e.code || e.message?.slice(0, 40)})`)
      await new Promise(r => setTimeout(r, 4000))
    }
  }
}

async function main() {
  for (const p of PAPERS) {
    const paper = await withRetry(() => prisma.questionPaper.upsert({
      where: { slug: p.slug },
      update: { title: p.title, year: p.year, pdfUrl: p.pdf },
      create: { slug: p.slug, title: p.title, year: p.year, pdfUrl: p.pdf },
    }), `paper ${p.slug}`)
    console.log(`✔ paper ${p.slug}`)

    if (!p.hasQuestions) continue

    const manifestPath = path.join('public', 'questions', p.slug, 'manifest.json')
    if (!fs.existsSync(manifestPath)) { console.log(`  ! no manifest at ${manifestPath}`); continue }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))

    let n = 0
    for (const q of manifest) {
      const imageUrl = `/questions/${p.slug}/${q.image}`
      await withRetry(() => prisma.paperQuestion.upsert({
        where: { paperId_number: { paperId: paper.id, number: q.number } },
        update: { imageUrl, subject: q.subject === 'Unknown' ? null : q.subject },
        create: {
          paperId: paper.id, number: q.number, imageUrl,
          subject: q.subject === 'Unknown' ? null : q.subject,
        },
      }), `q${q.number}`)
      n++
      if (n % 40 === 0) console.log(`  ${p.slug}: ${n}/${manifest.length}`)
    }
    console.log(`  ${p.slug}: seeded ${n} questions`)
  }
  console.log('✅ Papers seeded.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
