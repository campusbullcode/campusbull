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
      select: { rankUpdates: true, bestRank: true, role: true }
    })

    let updateData = {
      name, phone, branch, category, domicile,
      targetYear: targetYear ? Number(targetYear) : undefined,
      ugOrPg, address
    }

    if (bestRank !== undefined && String(bestRank) !== String(currentUser.bestRank)) {
      const nextRank = bestRank === '' || bestRank === null ? null : Number(bestRank)
      if (currentUser.role === 'ADMIN') {
        // Admins can change their rank as often as they want.
        updateData.bestRank = nextRank
      } else if (currentUser.rankUpdates < 2) {
        updateData.bestRank = nextRank
        updateData.rankUpdates = currentUser.rankUpdates + 1
      } else {
        return res.status(400).json({ error: 'You can only update your rank twice. Contact admin to request more.' })
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

// POST /api/user/predicted-rank — persist a rank produced by the Rank Predictor
// onto the user's profile so it sticks. Does NOT consume the manual rank-update
// allowance (the predictor enforces its own usage limit).
router.post('/predicted-rank', async (req, res) => {
  try {
    const r = Number(req.body.rank)
    if (!Number.isFinite(r) || r < 1) return res.status(400).json({ error: 'Invalid rank' })
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { bestRank: Math.round(r) },
      select: { bestRank: true },
    })
    res.json(user)
  } catch (err) {
    console.error('predicted-rank', err)
    res.status(500).json({ error: 'Failed to save predicted rank' })
  }
})

// POST /api/user/record-test — record a (static) paper test attempt into running stats.
// body: { slug, graded (bool), scorePercent (0-100, only when graded) }
// Every completion bumps testsTaken; avgScore is the mean over GRADED attempts only,
// so practice-mode papers no longer drag the average toward 0.
router.post('/record-test', async (req, res) => {
  try {
    const { slug } = req.body
    const graded = !!req.body.graded
    const hasScore = graded && req.body.scorePercent !== null && req.body.scorePercent !== undefined
    const scorePercent = hasScore ? Math.max(0, Math.min(100, Number(req.body.scorePercent) || 0)) : null

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { testsTaken: true, avgScore: true },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const data = { testsTaken: (user.testsTaken || 0) + 1, lastActiveAt: new Date() }

    // Per-paper result row + graded-only average. Wrapped so a not-yet-migrated
    // PaperResult table can't break test completion.
    try {
      await prisma.paperResult.create({
        data: { slug: slug || null, userId: req.user.userId, graded, scorePercent },
      })
      if (hasScore) {
        const agg = await prisma.paperResult.aggregate({
          _avg: { scorePercent: true },
          where: { userId: req.user.userId, graded: true },
        })
        data.avgScore = Math.round((agg._avg.scorePercent || 0) * 10) / 10
      }
    } catch (e) {
      // Fallback (table missing): keep the legacy running-mean for graded attempts.
      if (hasScore) {
        const newAvg = ((user.avgScore || 0) * (user.testsTaken || 0) + scorePercent) / data.testsTaken
        data.avgScore = Math.round(newAvg * 10) / 10
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.userId },
      data,
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
