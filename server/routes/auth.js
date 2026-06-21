import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../utils/db.js'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    // Check existing
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    // Hash password
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Save to DB (defaults to STUDENT role)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, ...(phone ? { phone } : {}) }
    })

    res.status(201).json({ message: 'Registration successful' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during registration' })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid email or password' })
    }

    // Generate JWT including role
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, role: user.role, name: user.name })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error during login' })
  }
})

// Get currently authenticated user details
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, role: true, isPro: true, targetYear: true } // Exclude password
    })
    
    if (!user) return res.status(404).json({ error: 'User not found' })

    res.json(user)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error retrieving profile' })
  }
})

export default router
