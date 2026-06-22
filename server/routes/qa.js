import express from 'express'
import { prisma } from '../utils/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/qa/public — latest Q/A for the public homepage (NO auth required).
// Returns the most recent non-rejected questions with their answers (admins first).
router.get('/public', async (req, res) => {
  try {
    const take = Math.min(parseInt(req.query.limit) || 6, 20)
    const questions = await prisma.question.findMany({
      where: { status: { not: 'REJECTED' } },
      include: {
        user: { select: { name: true, role: true } },
        answers: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take,
    })
    for (const q of questions) {
      q.answers.sort((a, b) => {
        const aAdmin = a.user?.role === 'ADMIN' ? 0 : 1
        const bAdmin = b.user?.role === 'ADMIN' ? 0 : 1
        if (aAdmin !== bAdmin) return aAdmin - bAdmin
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    }
    res.json(questions)
  } catch (err) {
    console.error(err)
    res.json([])   // homepage should never hard-fail on Q/A
  }
})

// GET /api/qa — public Q/A: everyone sees everyone's questions & answers.
// Admins additionally see REJECTED (hidden) questions; everyone else sees all
// questions except ones an admin has rejected. Admin answers are sorted to the top.
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    const isAdmin = user.role === 'ADMIN'

    const whereClause = isAdmin ? {} : { status: { not: 'REJECTED' } }

    const questions = await prisma.question.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true, role: true } },
        answers: {
          include: { user: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Admin (expert) answers first, then chronological.
    for (const q of questions) {
      q.answers.sort((a, b) => {
        const aAdmin = a.user?.role === 'ADMIN' ? 0 : 1
        const bAdmin = b.user?.role === 'ADMIN' ? 0 : 1
        if (aAdmin !== bAdmin) return aAdmin - bAdmin
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    }

    res.json(questions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch Q/A' })
  }
})

// POST /api/qa/question — ask a new question
router.post('/question', verifyToken, async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    const question = await prisma.question.create({
      data: {
        content,
        userId: req.user.userId,
        status: 'APPROVED'   // public Q/A — visible to everyone immediately (admins can still reject to hide)
      },
      include: { user: { select: { name: true, role: true } }, answers: true }
    })

    res.json(question)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to post question' })
  }
})

// PATCH /api/qa/question/:id/status — admin approve/reject question
router.patch('/question/:id/status', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' })

    const { status } = req.body
    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        user: { select: { name: true, role: true } },
        answers: { include: { user: { select: { name: true, role: true } } } }
      }
    })

    res.json(question)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update status' })
  }
})

// POST /api/qa/question/:id/answer — post an answer (any authenticated user)
router.post('/question/:id/answer', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })

    const { content } = req.body
    if (!content) return res.status(400).json({ error: 'Content is required' })

    // Admin answers auto-approve the question
    if (user.role === 'ADMIN') {
      await prisma.question.update({
        where: { id: req.params.id },
        data: { status: 'APPROVED' }
      })
    }

    const answer = await prisma.answer.create({
      data: {
        content,
        questionId: req.params.id,
        userId: req.user.userId
      },
      include: { user: { select: { name: true, role: true } } }
    })

    res.json(answer)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to post answer' })
  }
})

export default router
