import express from 'express'
import { prisma } from '../utils/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// All profile routes require auth
router.use(verifyToken)

// GET /api/user/profile — full user profile
router.get('/profile', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, isPro: true, branch: true, category: true,
        domicile: true, targetYear: true, streak: true,
        testsTaken: true, avgScore: true, bestRank: true,
        ugOrPg: true, address: true, rankUpdates: true,
        createdAt: true
      }
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// PATCH /api/user/profile — update user profile
router.patch('/profile', async (req, res) => {
  try {
    const { name, phone, branch, category, domicile, targetYear, ugOrPg, address, bestRank } = req.body
    
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { rankUpdates: true, bestRank: true }
    })

    let updateData = { 
      name, phone, branch, category, domicile, 
      targetYear: targetYear ? Number(targetYear) : undefined,
      ugOrPg, address 
    }

    if (bestRank !== undefined && String(bestRank) !== String(currentUser.bestRank)) {
      if (currentUser.rankUpdates < 2) {
        updateData.bestRank = Number(bestRank)
        updateData.rankUpdates = currentUser.rankUpdates + 1
      } else {
        return res.status(400).json({ error: 'You can only update your rank twice.' })
      }
    }

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, isPro: true, branch: true, category: true,
        domicile: true, targetYear: true, streak: true,
        testsTaken: true, avgScore: true, bestRank: true,
        ugOrPg: true, address: true, rankUpdates: true
      }
    })
    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// GET /api/user/stats — dashboard stats
router.get('/stats', async (req, res) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { testsTaken: true, avgScore: true, streak: true, bestRank: true, lastActiveAt: true }
    })

    if (!user) return res.status(404).json({ error: 'User not found' })

    // Update streak logic
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const lastActiveStr = user.lastActiveAt ? user.lastActiveAt.toISOString().split('T')[0] : null

    if (lastActiveStr !== todayStr) {
      let newStreak = user.streak
      if (!lastActiveStr) {
        newStreak = 1
      } else {
        const lastActiveDate = new Date(lastActiveStr)
        const todayDate = new Date(todayStr)
        const diffDays = Math.round((todayDate - lastActiveDate) / (1000 * 60 * 60 * 24))
        if (diffDays === 1) {
          newStreak += 1
        } else if (diffDays > 1) {
          newStreak = 1
        }
      }

      await prisma.user.update({
        where: { id: req.user.userId },
        data: { lastActiveAt: now, streak: newStreak }
      })
      user.streak = newStreak
    }

    // Count recent attempts (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentAttempts = await prisma.testAttempt.count({
      where: { userId: req.user.userId, createdAt: { gte: weekAgo } }
    })

    res.json({
      testsTaken: user?.testsTaken || 0,
      avgScore: user?.avgScore || 0,
      streak: user?.streak || 0,
      bestRank: user?.bestRank || null,
      weeklyAttempts: recentAttempts
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

// POST /api/user/record-test — record a (static) paper test result into running stats
// body: { scorePercent } (0-100). Updates testsTaken + avgScore.
router.post('/record-test', async (req, res) => {
  try {
    let { scorePercent } = req.body
    scorePercent = Math.max(0, Math.min(100, Number(scorePercent) || 0))
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { testsTaken: true, avgScore: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const newCount = (user.testsTaken || 0) + 1
    const newAvg = ((user.avgScore || 0) * (user.testsTaken || 0) + scorePercent) / newCount
    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data: { testsTaken: newCount, avgScore: Math.round(newAvg * 10) / 10, lastActiveAt: new Date() },
      select: { testsTaken: true, avgScore: true },
    })
    res.json(updated)
  } catch (err) {
    console.error('record-test', err)
    res.status(500).json({ error: 'Failed to record test' })
  }
})

// GET /api/user/attempts — test history
router.get('/attempts', async (req, res) => {
  try {
    const attempts = await prisma.testAttempt.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        test: { select: { title: true, type: true, difficulty: true, questions: true } }
      }
    })
    res.json(attempts)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch attempts' })
  }
})

export default router
