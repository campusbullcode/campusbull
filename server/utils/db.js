import 'dotenv/config'
import pkg from '@prisma/client'
const { PrismaClient } = pkg
import pg from 'pg'
const { Pool } = pg
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Add it to your .env (local) or Render env vars (production).')
}

// Neon serves a publicly-trusted TLS cert, so verify it (sslmode=require in the URL).
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: true }
})

const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis
// ALWAYS create a fresh client during this phase to avoid caching bugs with globalThis
export const prisma = new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

