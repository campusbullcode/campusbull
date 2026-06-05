import express from 'express'
import { prisma } from '../utils/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/papers — list active papers (public)
router.get('/', async (req, res) => {
  try {
    const papers = await prisma.questionPaper.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    })
    // expose question count + whether any answer keys are set (graded)
    const data = await Promise.all(papers.map(async (p) => {
      const graded = await prisma.paperQuestion.count({
        where: { paperId: p.id, correctOption: { not: null } },
      })
      return {
        id: p.id, slug: p.slug, title: p.title, year: p.year,
        pdfUrl: p.pdfUrl, durationMin: p.durationMin,
        questionCount: p._count.questions, gradedCount: graded,
      }
    }))
    res.json(data)
  } catch (err) {
    console.error('GET /papers', err)
    res.status(500).json({ error: 'Failed to fetch papers' })
  }
})

// GET /api/papers/:slug — paper + questions WITHOUT the answer key (public)
router.get('/:slug', async (req, res) => {
  try {
    const paper = await prisma.questionPaper.findUnique({
      where: { slug: req.params.slug },
      include: {
        questions: {
          orderBy: { number: 'asc' },
          select: { id: true, number: true, subject: true, imageUrl: true },
        },
      },
    })
    if (!paper || !paper.isActive) return res.status(404).json({ error: 'Paper not found' })
    res.json(paper)
  } catch (err) {
    console.error('GET /papers/:slug', err)
    res.status(500).json({ error: 'Failed to fetch paper' })
  }
})

// POST /api/papers/:slug/submit — grade an attempt server-side (auth optional but recorded if present)
// body: { answers: { "<number>": <optionIndex 0-3> } }
router.post('/:slug/submit', async (req, res) => {
  try {
    const { answers = {} } = req.body
    const paper = await prisma.questionPaper.findUnique({
      where: { slug: req.params.slug },
      include: { questions: { orderBy: { number: 'asc' } } },
    })
    if (!paper) return res.status(404).json({ error: 'Paper not found' })

    let correct = 0, wrong = 0, attempted = 0, gradedCount = 0
    const results = paper.questions.map((q) => {
      const your = answers[q.number]
      const isGraded = q.correctOption !== null && q.correctOption !== undefined
      if (isGraded) gradedCount++
      if (your !== undefined && your !== null) {
        attempted++
        if (isGraded) {
          if (your === q.correctOption) correct++
          else wrong++
        }
      }
      return {
        number: q.number,
        subject: q.subject,
        your: your ?? null,
        correct: isGraded ? q.correctOption : null,
        isGraded,
      }
    })

    // NEET marking: +4 correct, -1 wrong (only over graded questions)
    const score = correct * 4 - wrong
    res.json({
      title: paper.title,
      totalQuestions: paper.questions.length,
      gradedCount, attempted, correct, wrong,
      score, maxScore: gradedCount * 4,
      results,
    })
  } catch (err) {
    console.error('POST /papers/:slug/submit', err)
    res.status(500).json({ error: 'Failed to submit attempt' })
  }
})

export default router
