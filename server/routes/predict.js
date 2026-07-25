import express from 'express'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// ── Predictor tier access ───────────────────────────────────────────────────
// Per-account run counts ("Pro: rank x2 / college x1", "Free: rank x1 / college locked")
// are enforced on the client (no DB column needed). The SERVER enforces feature
// access by tier: UG/MBBS College Predictor searches are free, while PG College
// Predictor searches are PRO/ADMIN only. The Rank Predictor is available to any
// logged-in user. Tier comes from existing role/isPro columns.
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
      error: 'PG College Predictor is a PRO feature. MBBS/UG searches are free.' }
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

// Category group label → actual DB values per state table
const CATEGORY_MAPPING = {
  "Central": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "PwD": ["GEN0PwD", "OBC0PwD", "SC0PwD", "ST0PwD", "EWS0PwD"],
    "AFMS": ["AFMS0Priority III", "AFMS0Priority IV"]
  },
  "open_states": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "PwD": ["GEN0PwD", "OBC0PwD", "SC0PwD", "ST0PwD", "EWS0PwD"]
  },
  // Each state list = Central codes UNION state-specific codes
  // so rows using central coding (e.g. DNB seats) and state coding (govt seats) are both found
  "karnatakas": {
    "GEN": ["GEN", "OPEN", "UR", "GM", "GMH", "GMK", "GMKH", "GMR", "GMRH", "OPEN-GEN", "OPEN-FEM", "OPN"],
    "OBC": ["OBC", "1G", "1H", "1K", "1KH", "1R", "1RH", "2AG", "2AH", "2AK", "2AKH", "2AR", "2ARH", "2BG", "2BH", "2BK", "2BKH", "2BR", "2BRH", "3AG", "3AH", "3AK", "3AKH", "3AR", "3ARH", "3BG", "3BH", "3BK", "3BKH", "3BR", "3BRH"],
    "SC": ["SC", "SCG", "SCH", "SCK", "SCKH", "SCR", "SCRH"],
    "ST": ["ST", "STG", "STH", "STK", "STKH", "STR", "STRH"],
    "EWS": ["EWS"],
    "MANAGEMENT/NRI": ["GMP", "GMPH", "NRI"]
  },
  "andhra_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR", "OC", "OC Open", "OC Serv", "OPEN-GEN", "OPEN-FEM", "OP", "Open"],
    "OBC/BC": ["OBC", "BC", "BC Open", "BC Serv", "BC Service", "BCA-GEN", "BCB-GEN", "BCC-GEN", "BCD-GEN", "BCE-GEN", "BCM"],
    "SC": ["SC", "SC Open", "SC Serv", "SC Service", "SC-OP", "SC-PH"],
    "ST": ["ST", "ST Open", "ST Serv", "ST Service", "ST-OP", "ST-PH"],
    "EWS": ["EWS", "EWS Open", "EWS Service", "EWS-PH"],
    "MINORITY": ["Christian Minority", "Malayalam Minority", "Telugu Minority", "BCM"],
    "MANAGEMENT/NRI": ["CAT B1", "CAT B2", "CAT C(NRI)", "CA NRI", "MNG", "MQ", "MQ1", "MQ2", "MQ3", "NQ-NRI", "NRI"]
  },
  "telanganas": {
    "GEN": ["GEN", "OPEN", "UR", "OC", "OC Open", "OC Serv", "OPEN-GEN", "OPEN-FEM", "OP", "Open"],
    "OBC/BC": ["OBC", "BC", "BC Open", "BC Serv", "BC Service", "BCA-GEN", "BCB-GEN", "BCC-GEN", "BCD-GEN", "BCE-GEN", "BCM"],
    "SC": ["SC", "SC Open", "SC Serv", "SC Service", "SC-OP", "SC-PH"],
    "ST": ["ST", "ST Open", "ST Serv", "ST Service", "ST-OP", "ST-PH"],
    "EWS": ["EWS", "EWS Open", "EWS Service", "EWS-PH"],
    "MINORITY": ["Christian Minority", "Malayalam Minority", "Telugu Minority", "BCM"],
    "MANAGEMENT/NRI": ["CAT B1", "CAT B2", "CAT C(NRI)", "CA NRI", "MNG", "MQ", "MQ1", "MQ2", "MQ3", "NQ-NRI", "NRI"]
  },
  "tamil_nadus": {
    "GEN": ["GEN", "OPEN", "UR", "OC", "BC", "BCM", "MBC"],
    "SC": ["SC", "SCA"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "MINORITY": ["Christian Minority", "Malayalam Minority", "Telugu Minority", "Minority"],
    "MANAGEMENT/NRI": ["NRI", "Management", "MGT", "NRI Lapsed"]
  },
  "maharashtras": {
    "GEN": ["GEN", "OPEN", "UR", "UR Open"],
    "OBC/SEBC": ["OBC", "SEBC", "NT1", "NT2", "NT3", "VJ", "VJA"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"],
    "SPECIAL": ["DEF1", "DEF2", "DEF3", "PH", "CAP"]
  },
  "gujarats": {
    "GEN": ["GEN", "OPEN", "UR", "OP", "GQ-OP", "IQ-OP", "UQ-OP"],
    "SC": ["SC", "GQ-SC", "IQ-SC", "UQ-SC"],
    "ST": ["ST", "GQ-ST", "IQ-ST", "UQ-ST"],
    "EWS": ["EWS", "GQ-EW", "IQ-EW", "UQ-EW"],
    "SEBC/OBC": ["OBC", "GQ-SE", "IQ-SE", "UQ-SE", "SE", "SEBC"]
  },
  "kerlas": {
    "GEN": ["GEN", "OPEN", "UR", "SM"],
    "OBC": ["OBC", "EZ", "MU", "LC", "BH", "BX", "OEC", "SEBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "west_bengals": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-A", "OBC-B"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "uttar_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "madhya_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "bihars": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "BC", "EBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "rajasthans": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "SBC", "MBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "delhis": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "odishas": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "SEBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "haryanas": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "BC-A", "BC-B"],
    "SC": ["SC"],
    "EWS": ["EWS"]
  },
  "punjabs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "SC": ["SC", "SC (1st Priority)", "SC (2nd Priority)"],
    "BC": ["BC"],
    "EWS": ["EWS"]
  },
  "himachal_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "jammu_and_kashmirs": {
    "GEN": ["GEN", "OPEN", "UR", "OM"],
    "OBC": ["OBC", "ALC/IB", "RBA"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "uttarakhands": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "OBC-NCL"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "jharkhands": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "BC1", "BC2"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "chhattisgarhs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "assams": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC", "MOBC"],
    "SC": ["SC"],
    "ST": ["ST", "STP", "STH"],
    "EWS": ["EWS"]
  },
  "manipurs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "tripuras": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "sikkims": {
    "GEN": ["GEN", "OPEN", "UR", "SL"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "pondicherries": {
    "GEN": ["GEN", "OPEN", "UR", "OC"],
    "OBC": ["OBC", "BC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "arunachal_pradeshes": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "goas": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  },
  "chandigarhs": {
    "GEN": ["GEN", "OPEN", "UR"],
    "OBC": ["OBC"],
    "SC": ["SC"],
    "ST": ["ST"],
    "EWS": ["EWS"]
  }
}

// Expand a category group label (e.g., "GEN") to the actual DB values for that state.
// Returns an array if expansion found, null if category is already a specific DB value.
function expandCategory(category, tableKey) {
  if (!category || category === 'All') return null
  const stateCats = CATEGORY_MAPPING[tableKey]
  if (stateCats && stateCats[category]) return stateCats[category]
  const centralCats = CATEGORY_MAPPING["Central"]
  if (centralCats && centralCats[category]) return centralCats[category]
  return null
}

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
    const { rank, state, courseType, counsellingType, category, quota, collegeName, budget, instType, limit } = req.body

    if (!rank || rank < 0) {
      return res.status(400).json({ error: 'Valid rank is required' })
    }

    const gate = await checkAccess(req.user.userId, { proOnly: courseType !== 'UG' })
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

    // Category filter — expand group labels (e.g. "GEN" → ["GM","GMH",...] for Karnataka)
    if (category && category !== 'All') {
      const expanded = expandCategory(category, tableName)
      const cats = expanded || category.split(',').map(c => c.trim())
      if (cats.length > 1) {
        const placeholders = cats.map(() => `$${pIdx++}`).join(', ')
        whereClauses.push(`"${catCol}" IN (${placeholders})`)
        params.push(...cats)
      } else {
        whereClauses.push(`"${catCol}" ILIKE $${pIdx++}`)
        params.push(`%${cats[0]}%`)
      }
    }

    // Quota filter — exact case-insensitive match (values come from DB dropdown, no wildcards)
    if (quota && quota !== 'All') {
      whereClauses.push(`"quota" ILIKE $${pIdx++}`)
      params.push(quota)
    }

    // Type filter:
    // - open_states (MCC/AIQ): `type` stores UG/PG → filter by courseType
    // - state tables: `type` stores institution type (Government/Private/Deemed/AIIMS) → filter by instType
    if (tableName === 'open_states') {
      if (courseType && courseType !== 'All') {
        whereClauses.push(`type ILIKE $${pIdx++}`)
        params.push(`%${courseType}%`)
      }
    } else {
      if (instType && instType !== 'All') {
        whereClauses.push(`type ILIKE $${pIdx++}`)
        params.push(`%${instType}%`)
      }
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
