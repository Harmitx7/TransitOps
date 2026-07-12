import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const fuelSchema = z.object({
  vehicleId: z.string(),
  tripId: z.string().optional(),
  quantity: z.number().positive(),
  costPerUnit: z.number().positive(),
  odometer: z.number().positive(),
  station: z.string().optional(),
});

const expenseSchema = z.object({
  tripId: z.string().optional(),
  vehicleId: z.string().optional(),
  category: z.enum(['FUEL', 'TOLL', 'MAINTENANCE', 'INSURANCE', 'REGISTRATION', 'SALARY', 'OTHER']),
  amount: z.number().positive(),
  description: z.string().optional(),
});

// Fuel logs
router.get('/fuel', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { vehicleId, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (vehicleId) where.vehicleId = vehicleId;
    const [data, total] = await Promise.all([
      prisma.fuelLog.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { vehicle: true, trip: true } }),
      prisma.fuelLog.count({ where }),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fuel logs' });
  }
});

router.post('/fuel', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = fuelSchema.parse(req.body);
    const totalCost = data.quantity * data.costPerUnit;

    // Anomaly detection: cost per liter > 120 is flagged
    const isAnomaly = data.costPerUnit > 120;

    const log = await prisma.fuelLog.create({
      data: { ...data, totalCost, isAnomaly, loggedById: req.user!.id },
      include: { vehicle: true },
    });

    // Update vehicle odometer
    await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { currentOdometer: data.odometer } });

    res.status(201).json(log);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create fuel log' });
  }
});

// Expenses
router.get('/expenses', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (category) where.category = category;
    const [data, total] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { trip: true } }),
      prisma.expense.count({ where }),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/expenses', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = expenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data: { ...data, loggedById: req.user!.id } });
    res.status(201).json(expense);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

export default router;
