import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { verifyToken, requireRole } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['ADMIN', 'FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCE_MANAGER', 'DRIVER']),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      authConfig.jwtSecret,
      { algorithm: 'HS256', expiresIn: authConfig.jwtExpiresIn as string }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('[AUTH] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register (admin only)
router.post('/register', verifyToken, requireRole(['ADMIN']), async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });

    res.status(201).json(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('[AUTH] Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req: Request, res: Response): Promise<void> => {
  res.json(req.user);
});

export default router;
