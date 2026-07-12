import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const driverSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email().optional(),
  licenseNumber: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.string(),
});

// GET /api/drivers
router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { licenseNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    const [drivers, total] = await Promise.all([
      prisma.driver.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.driver.count({ where }),
    ]);
    res.json({ data: drivers, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[DRIVERS] List error:', error);
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
});

// GET /api/drivers/:id
router.get('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: req.params.id },
      include: { trips: { take: 10, orderBy: { createdAt: 'desc' }, include: { vehicle: true } } },
    });
    if (!driver) { res.status(404).json({ error: 'Driver not found' }); return; }
    res.json(driver);
  } catch (error) {
    console.error('[DRIVERS] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
});

// POST /api/drivers
router.post('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = driverSchema.parse(req.body);
    const driver = await prisma.driver.create({
      data: { ...data, licenseExpiry: new Date(data.licenseExpiry) },
    });
    res.status(201).json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.errors }); return; }
    console.error('[DRIVERS] Create error:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

const driverUpdateSchema = driverSchema.partial();

// PATCH /api/drivers/:id
router.patch('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = driverUpdateSchema.parse(req.body);
    const updateData = {
      ...data,
      licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
    };
    const driver = await prisma.driver.update({ where: { id: req.params.id }, data: updateData });
    res.json(driver);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('[DRIVERS] Update error:', error);
    res.status(500).json({ error: 'Failed to update driver' });
  }
});

export default router;
