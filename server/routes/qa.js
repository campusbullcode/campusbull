import express from 'express'
import { prisma } from '../utils/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// GET /api/qa — list all approved questions (and pending/rejected if admin or owner)
router.get('/', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } })
    const isAdmin = user.role === 'ADMIN'

    const whereClause = isAdmin 
      ? {} 
      : { OR: [{ status: 'APPROVED' }, { userId: req.user.userId }] }

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
        status: 'PENDING'
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
