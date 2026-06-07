import express from 'express'
import { prisma } from '../utils/db.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// All routes in this file require both authentication and ADMIN role
router.use(verifyToken)
router.use(requireAdmin)

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isPro: true, createdAt: true, bestRank: true, rankUpdates: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Update user details (e.g., promote to Admin, make Pro)
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { role, isPro, rankUpdates } = req.body

    const data = {}
    if (role !== undefined) data.role = role
    if (isPro !== undefined) data.isPro = isPro
    // Admin can reset a student's rank-update counter (e.g. to 0) to grant more changes.
    if (rankUpdates !== undefined) data.rankUpdates = Number(rankUpdates)

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, isPro: true, bestRank: true, rankUpdates: true }
    })
    res.json(updatedUser)
  } catch (err) {
    if (err.code === 'P2025') {
       return res.status(404).json({ error: 'User not found' })
    }
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params

    // Prevent admin from deleting themselves (basic safety)
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' })
    }

    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Get Overview Stats
router.get('/overview-stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count({ where: { role: 'STUDENT' } })
    
    // Calculate active users (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const activeUsers = await prisma.user.count({
      where: { lastActiveAt: { gte: oneDayAgo } }
    })

    const totalTestsTaken = await prisma.testAttempt.count()
    
    const attempts = await prisma.testAttempt.findMany({ select: { score: true, totalMarks: true } })
    let avgScore = 0
    if (attempts.length > 0) {
      const sum = attempts.reduce((acc, att) => acc + (att.totalMarks > 0 ? (att.score / att.totalMarks) * 100 : 0), 0)
      avgScore = Math.round(sum / attempts.length)
    }

    const pendingQs = await prisma.question.count({ where: { status: 'PENDING' } })

    // Simulate growth data based on total users for the UI graph (12 data points)
    // In production, this would be grouped by date from the database
    const growthData = [
      Math.max(10, Math.floor(totalUsers * 0.1)),
      Math.max(15, Math.floor(totalUsers * 0.2)),
      Math.max(20, Math.floor(totalUsers * 0.3)),
      Math.max(25, Math.floor(totalUsers * 0.4)),
      Math.max(40, Math.floor(totalUsers * 0.5)),
      Math.max(50, Math.floor(totalUsers * 0.6)),
      Math.max(60, Math.floor(totalUsers * 0.7)),
      Math.max(75, Math.floor(totalUsers * 0.8)),
      Math.max(85, Math.floor(totalUsers * 0.9)),
      Math.max(90, Math.floor(totalUsers * 0.95)),
      Math.max(95, Math.floor(totalUsers * 0.98)),
      Math.max(100, Math.floor(totalUsers))
    ].map(v => Math.min(100, Math.max(10, v % 100 + 10))); // Normalize to 10-100% for bar heights

    const todaySessions = []; // Empty array for production

    res.json({ totalUsers, activeUsers, totalTestsTaken, avgScore, pendingQs, growthData, todaySessions })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch overview stats' })
  }
})

// ─── Announcements ────────────────────────────────────────────────────────────

// GET all announcements (admin)
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' }
    })
    res.json(announcements)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
})

// POST create new announcement
router.post('/announcements', async (req, res) => {
  try {
    const { title, content, imageUrl, scheduledAt, expiresAt } = req.body
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required' })
    }
    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    })
    res.status(201).json(announcement)
  } catch (err) {
    res.status(500).json({ error: 'Failed to create announcement' })
  }
})

// PATCH toggle active status
router.patch('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { isActive } = req.body
    const updated = await prisma.announcement.update({
      where: { id },
      data: { isActive }
    })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement' })
  }
})

// DELETE announcement
router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params
    await prisma.announcement.delete({ where: { id } })
    res.json({ message: 'Announcement deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement' })
  }
})

// ── Question Papers (admin) ─────────────────────────────────────────────────

// List papers with stats
router.get('/papers', async (req, res) => {
  try {
    const papers = await prisma.questionPaper.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { questions: true } } },
    })
    const data = await Promise.all(papers.map(async (p) => {
      const graded = await prisma.paperQuestion.count({
        where: { paperId: p.id, correctOption: { not: null } },
      })
      return { ...p, questionCount: p._count.questions, gradedCount: graded, _count: undefined }
    }))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch papers' })
  }
})

// Get one paper with all questions INCLUDING the answer key (admin only)
router.get('/papers/:slug', async (req, res) => {
  try {
    const paper = await prisma.questionPaper.findUnique({
      where: { slug: req.params.slug },
      include: { questions: { orderBy: { number: 'asc' } } },
    })
    if (!paper) return res.status(404).json({ error: 'Paper not found' })
    res.json(paper)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch paper' })
  }
})

// Update paper metadata (title, year, isActive, durationMin)
router.patch('/papers/:id', async (req, res) => {
  try {
    const { title, year, isActive, durationMin } = req.body
    const data = {}
    if (title !== undefined) data.title = title
    if (year !== undefined) data.year = year
    if (isActive !== undefined) data.isActive = isActive
    if (durationMin !== undefined) data.durationMin = parseInt(durationMin, 10)
    const updated = await prisma.questionPaper.update({ where: { id: req.params.id }, data })
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update paper' })
  }
})

// Set the correct option (answer key) for a single question
router.patch('/papers/questions/:questionId', async (req, res) => {
  try {
    const { correctOption, subject } = req.body
    const data = {}
    if (correctOption !== undefined) data.correctOption = correctOption // 0-3 or null
    if (subject !== undefined) data.subject = subject
    const updated = await prisma.paperQuestion.update({
      where: { id: req.params.questionId },
      data,
    })
    res.json(updated)
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Question not found' })
    res.status(500).json({ error: 'Failed to update question' })
  }
})

// Bulk-set answer key: body { answers: { "<number>": <optIdx> } }
router.patch('/papers/:id/answers', async (req, res) => {
  try {
    const { answers = {} } = req.body
    const entries = Object.entries(answers)
    await prisma.$transaction(
      entries.map(([number, opt]) =>
        prisma.paperQuestion.updateMany({
          where: { paperId: req.params.id, number: parseInt(number, 10) },
          data: { correctOption: opt === null ? null : parseInt(opt, 10) },
        })
      )
    )
    res.json({ updated: entries.length })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save answer key' })
  }
})

export default router
