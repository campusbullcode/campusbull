import express from 'express'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// ── Predictor tier access ───────────────────────────────────────────────────
// Per-account run counts ("Pro: rank x2 / college x1", "Free: rank x1 / college locked")
// are enforced on the client (no DB column needed). The SERVER enforces feature
// access by tier: the College Predictor is PRO/ADMIN only; the Rank Predictor is
// available to any logged-in user. Tier comes from existing role/isPro columns.
const tierOf = (u) => (u && u.role === 'ADMIN' ? 'ADMIN' : (u && u.isPro ? 'PRO' : 'FREE'))

// Returns { ok, status?, error?, tier }. `proOnly` blocks FREE users.
async function checkAccess(userId, { proOnly = false } = {}) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isPro: true },
  })
  if (!u) return { ok: false, status: 404, error: 'User not found' }
  const tier = tierOf(u)
  if (proOnly && tier === 'FREE') {
    return { ok: false, status: 403, limitReached: true, tier,
      error: 'College Predictor is a PRO feature. Upgrade to PRO to unlock it.' }
  }
  return { ok: true, tier }
}

// NEET rank bracket table (score → rank range)
// Based on official NEET 2024 statistics
const RANK_BRACKETS = [
  { minScore: 700, maxScore: 720, minRank: 1,     maxRank: 100   },
  { minScore: 680, maxScore: 699, minRank: 101,   maxRank: 500   },
  { minScore: 660, maxScore: 679, minRank: 501,   maxRank: 1500  },
  { minScore: 640, maxScore: 659, minRank: 1501,  maxRank: 3000  },
  { minScore: 620, maxScore: 639, minRank: 3001,  maxRank: 5000  },
  { minScore: 600, maxScore: 619, minRank: 5001,  maxRank: 8000  },
  { minScore: 580, maxScore: 599, minRank: 8001,  maxRank: 12000 },
  { minScore: 560, maxScore: 579, minRank: 12001, maxRank: 18000 },
  { minScore: 540, maxScore: 559, minRank: 18001, maxRank: 25000 },
  { minScore: 520, maxScore: 539, minRank: 25001, maxRank: 35000 },
  { minScore: 500, maxScore: 519, minRank: 35001, maxRank: 50000 },
  { minScore: 480, maxScore: 499, minRank: 50001, maxRank: 70000 },
  { minScore: 460, maxScore: 479, minRank: 70001, maxRank: 95000 },
  { minScore: 440, maxScore: 459, minRank: 95001, maxRank: 130000},
  { minScore: 420, maxScore: 439, minRank: 130001,maxRank: 170000},
  { minScore: 400, maxScore: 419, minRank: 170001,maxRank: 220000},
  { minScore: 360, maxScore: 399, minRank: 220001,maxRank: 350000},
  { minScore: 300, maxScore: 359, minRank: 350001,maxRank: 550000},
  { minScore: 0,   maxScore: 299, minRank: 550001,maxRank: 900000},
]

// College eligibility brackets
import { prisma } from '../utils/db.js'

// POST /api/predict/rank — predict rank and matching colleges (auth + usage-limited)
router.post('/rank', verifyToken, async (req, res) => {
  try {
    const { score, category = 'General' } = req.body

    if (score === undefined || score < 0 || score > 720) {
      return res.status(400).json({ error: 'Score must be between 0 and 720' })
    }

    // Find rank bracket
    const bracket = RANK_BRACKETS.find(b => score >= b.minScore && score <= b.maxScore)
      || RANK_BRACKETS[RANK_BRACKETS.length - 1]

    // Estimate rank midpoint
    const estimatedRank = Math.round((bracket.minRank + bracket.maxRank) / 2)

    // Apply category adjustment (OBC -5%, SC/ST -15% rank improvement)
    let adjustedRank = estimatedRank
    if (category === 'OBC') adjustedRank = Math.round(estimatedRank * 0.85)
    if (category === 'SC' || category === 'ST') adjustedRank = Math.round(estimatedRank * 0.60)

    // Find eligible colleges directly from Neon PostgreSQL!
    // We look for allotments where the closing rank (aiRank) is greater than or equal to the student's adjustedRank
    const dbAllotments = await prisma.collegeAllotment.findMany({
      where: {
        aiRank: { gte: adjustedRank },
        category: category !== 'General' ? { contains: category } : undefined
      },
      include: { college: true },
      orderBy: { aiRank: 'asc' },
      take: 8
    })

    const eligibleColleges = dbAllotments.map(a => ({
      name: a.college.name,
      state: a.college.state || 'All India',
      type: a.college.type || 'Government',
      minRank: Math.max(1, a.aiRank - 1500),
      maxRank: a.aiRank
    }))

    // Approximate total eligibility based on a count query
    const totalEligibleCount = await prisma.collegeAllotment.count({
      where: { aiRank: { gte: adjustedRank } }
    })

    // Percentile (approximate with 200 total marks)
    const percentile = Math.max(0, Math.min(100, Math.round((1 - adjustedRank / 1000000) * 100 * 10) / 10))

    res.json({
      score,
      category,
      estimatedRank: adjustedRank,
      rankRange: { min: bracket.minRank, max: bracket.maxRank },
      percentile,
      eligibleColleges: eligibleColleges,
      totalEligible: Math.max(eligibleColleges.length, totalEligibleCount),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Prediction failed' })
  }
})

// Helper to get table name from closing_ranks safely
async function getTableName(state, counsellingType) {
  if (counsellingType === 'MCC' || state === 'All India' || state === 'open_states') {
    return 'open_states'
  }
  if (!state || state === 'All') {
    return 'open_states'
  }
  
  // Direct match to closing_ranks table
  const records = await prisma.$queryRawUnsafe(`SELECT table_name FROM closing_ranks WHERE state_name = $1 OR table_name = $1 LIMIT 1`, state)
  if (records && records.length > 0 && records[0].table_name) {
    return records[0].table_name
  }
  
  // Fallback map for common ones
  const map = {
    'karnatakas': 'karnatakas', 'andhra_pradeshes': 'andhra_pradeshes', 'delhis': 'delhis',
    'maharashtras': 'maharashtras', 'uttar_pradeshes': 'uttar_pradeshes', 'telanganas': 'telanganas',
    'tamil_nadus': 'tamil_nadus', 'west_bengals': 'west_bengals', 'gujarats': 'gujarats'
  }
  return map[state] || 'open_states'
}

// GET /api/predict/categories — get distinct categories for a state
router.get('/categories', async (req, res) => {
  try {
    const { state, counsellingType } = req.query;
    const tableName = await getTableName(state, counsellingType)
    
    // Sanitize table name to prevent SQL injection
    if (!/^[a-zA-Z_]+$/.test(tableName)) return res.json([])

    const rows = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT "category" AS cat 
      FROM "${tableName}" 
      WHERE "category" IS NOT NULL 
      ORDER BY "category" ASC
    `)
    res.json(rows.map(r => r.cat))
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
})

// GET /api/predict/quotas — get distinct quotas for a state
router.get('/quotas', async (req, res) => {
  try {
    const { state, counsellingType } = req.query;
    const tableName = await getTableName(state, counsellingType)
    
    if (!/^[a-zA-Z_]+$/.test(tableName)) return res.json([])

    const rows = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT "quota" AS qt 
      FROM "${tableName}" 
      WHERE "quota" IS NOT NULL 
      ORDER BY "quota" ASC
    `)
    res.json(rows.map(r => r.qt))
  } catch (err) {
    console.error('Failed to fetch quotas:', err)
    res.status(500).json({ error: 'Failed to fetch quotas' });
  }
})

// GET /api/predict/colleges — get list of college names
router.get('/colleges', async (req, res) => {
  try {
    const { state, counsellingType } = req.query;
    const tableName = await getTableName(state, counsellingType)
    if (!/^[a-zA-Z_]+$/.test(tableName)) return res.json([])

    const rows = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT college AS name 
      FROM "${tableName}" 
      WHERE college IS NOT NULL 
      ORDER BY college ASC
    `)
    res.json(rows.map(c => c.name));
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
})

// POST /api/predict/college — detailed college search
router.post('/college', verifyToken, async (req, res) => {
  try {
    const { rank, state, courseType, counsellingType, category, quota, collegeName, budget, limit } = req.body

    if (!rank || rank < 0) {
      return res.status(400).json({ error: 'Valid rank is required' })
    }

    const gate = await checkAccess(req.user.userId, { proOnly: true })
    if (!gate.ok) return res.status(gate.status).json(gate)

    const tableName = await getTableName(state, counsellingType)
    if (!/^[a-zA-Z_]+$/.test(tableName)) return res.status(400).json({ error: 'Invalid state' })

    const dbLimit = parseInt(limit) || 20
    const catCol = 'category'
    const rankInt = parseInt(rank)

    // Build the WHERE clause dynamically
    let whereClauses = []
    let params = []
    let pIdx = 1

    // Category filter
    if (category && category !== 'All') {
      const cats = category.split(',').map(c => c.trim())
      if (cats.length > 1) {
        const placeholders = cats.map(() => `$${pIdx++}`).join(', ')
        whereClauses.push(`"${catCol}" IN (${placeholders})`)
        params.push(...cats)
      } else {
        whereClauses.push(`"${catCol}" ILIKE $${pIdx++}`)
        params.push(`%${category}%`)
      }
    }

    // Quota filter
    if (quota && quota !== 'All') {
      whereClauses.push(`"quota" ILIKE $${pIdx++}`)
      params.push(`%${quota}%`)
    }

    // Type filter (UG/PG)
    if (courseType && courseType !== 'All') {
      whereClauses.push(`type ILIKE $${pIdx++}`)
      params.push(`%${courseType}%`)
    }

    // College Name filter
    if (collegeName && collegeName.trim() && collegeName !== 'All') {
      whereClauses.push(`college ILIKE $${pIdx++}`)
      params.push(`%${collegeName.trim()}%`)
    }

    // Budget filter
    if (budget && Number(budget) > 0) {
      whereClauses.push(`CAST(NULLIF(regexp_replace(course_fee::text, '\\D', '', 'g'), '') AS INTEGER) <= $${pIdx++}`)
      params.push(Number(budget))
    }

    // Rank logic: Check if ANY round cutoff is >= the user's rank
    // For r1 to r10, extract digits and cast to integer.
    const rankChecks = []
    for (let i = 1; i <= 10; i++) {
      rankChecks.push(`CAST(NULLIF(regexp_replace(r${i}, '\\D.*', ''), '') AS INTEGER) >= $${pIdx}`)
    }
    whereClauses.push(`(${rankChecks.join(' OR ')})`)
    params.push(rankInt)

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const query = `
      SELECT id, college, state, type, course_fee, quota, "${catCol}" as category, year, round, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10
      FROM "${tableName}"
      ${whereStr}
      ORDER BY college ASC
      LIMIT ${dbLimit}
    `
    const dbAllotments = await prisma.$queryRawUnsafe(query, ...params)

    const colleges = dbAllotments.map(a => {
      // Find the best valid rank from rounds
      let maxR = 0
      for (let i = 1; i <= 10; i++) {
        if (a[`r${i}`]) {
          const val = parseInt(a[`r${i}`].replace(/\D.*$/, ''), 10)
          if (!isNaN(val) && val >= rankInt && val > maxR) {
            maxR = val
          }
        }
      }
      return {
        name: a.college,
        state: a.state || state || 'All India',
        type: a.type || 'ug',
        category: a.category,
        quota: a.quota,
        year: a.year || '2023',
        course_fee: a.course_fee,
        maxRank: maxR || null,
        rounds: {
          r1: a.r1, r2: a.r2, r3: a.r3, r4: a.r4, 
          r5: a.r5, r6: a.r6, r7: a.r7, r8: a.r8, r9: a.r9, r10: a.r10
        }
      }
    })

    // Count total matches
    const countQuery = `SELECT COUNT(*) as cnt FROM "${tableName}" ${whereStr}`
    const countRes = await prisma.$queryRawUnsafe(countQuery, ...params)
    const total = countRes[0]?.cnt ? parseInt(countRes[0].cnt.toString()) : 0

    res.json({ rank, colleges, total })
  } catch (err) {
    console.error('College prediction error:', err)
    res.status(500).json({ error: 'College prediction failed' })
  }
})

export default router
