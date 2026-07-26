import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import userRoutes from './routes/user.js'
import testRoutes from './routes/tests.js'
import predictRoutes from './routes/predict.js'
import qaRoutes from './routes/qa.js'
import paperRoutes from './routes/papers.js'

const app = express()

// ── CORS ──────────────────────────────────────────────────────────────────────
// Allow both local dev and any Vercel production/preview URLs
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL, // e.g. https://campus-bull.vercel.app
].filter(Boolean)

// Any localhost / 127.0.0.1 origin (any port) is treated as local dev.
const isLocalhost = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / curl / Postman (no origin)
    if (!origin) return callback(null, true)
    if (isLocalhost(origin) || allowedOrigins.some(o => origin.startsWith(o)) || origin.endsWith('.vercel.app')) {
      return callback(null, true)
    }
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true
}))

app.use(express.json())

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/user', userRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/predict', predictRoutes)
app.use('/api/qa', qaRoutes)
app.use('/api/papers', paperRoutes)

// Public: active announcements for students
import { prisma } from './utils/db.js'
app.get('/api/announcements', async (req, res) => {
  try {
    const now = new Date()
    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }]
      },
      orderBy: { createdAt: 'desc' }
    })
    res.json(announcements)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcements' })
  }
})

// Public: dashboard recommendations
app.get('/api/recommendations', async (req, res) => {
  try {
    const colleges = await prisma.college.findMany({
      where: { tier: 'recommendation' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, state: true },
    })
    res.json(colleges)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recommendations' })
  }
})

// ── Health / keep-alive endpoint ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api', (_req, res) => {
  res.json({ message: 'Campus Bull API is running' })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`)

  // ── Keep-alive self-ping (Render free tier sleeps after 15 min idle) ─────────
  // Only run in production so it doesn't spam locally
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    const PING_URL = `${process.env.RENDER_EXTERNAL_URL}/api/health`
    const INTERVAL_MS = 10 * 60 * 1000 // every 10 minutes

    setInterval(async () => {
      try {
        const res = await fetch(PING_URL)
        console.log(`[keep-alive] ping ${PING_URL} → ${res.status}`)
      } catch (e) {
        console.warn(`[keep-alive] ping failed: ${e.message}`)
      }
    }, INTERVAL_MS)

    console.log(`[keep-alive] pinging ${PING_URL} every 10 min`)
  }
})
