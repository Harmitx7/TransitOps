import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const vehicleSchema = z.object({
  registrationNumber: z.string().min(1),
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1990).max(2030),
  type: z.string().min(1),
  fuelType: z.enum(['DIESEL', 'PETROL', 'CNG', 'ELECTRIC']),
  maxLoadCapacity: z.number().positive(),
  currentOdometer: z.number().min(0).optional(),
  acquisitionCost: z.number().positive(),
  insuranceExpiry: z.string().optional(),
  registrationExpiry: z.string().optional(),
  fitnessExpiry: z.string().optional(),
});

// GET /api/vehicles
router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, search, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { registrationNumber: { contains: search as string, mode: 'insensitive' } },
        { make: { contains: search as string, mode: 'insensitive' } },
        { model: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [vehicles, total] = await Promise.all([
      prisma.vehicle.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.vehicle.count({ where }),
    ]);

    res.json({ data: vehicles, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[VEHICLES] List error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id },
      include: {
        trips: { take: 10, orderBy: { createdAt: 'desc' } },
        maintenance: { take: 10, orderBy: { createdAt: 'desc' } },
        timeline: { take: 20, orderBy: { createdAt: 'desc' } },
        fuelLogs: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    });

    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    res.json(vehicle);
  } catch (error) {
    console.error('[VEHICLES] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
});

// POST /api/vehicles
router.post('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = vehicleSchema.parse(req.body);
    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
        registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : undefined,
        fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : undefined,
      },
    });

    await prisma.vehicleTimeline.create({
      data: { vehicleId: vehicle.id, eventType: 'CREATED', title: 'Vehicle registered' },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('[VEHICLES] Create error:', error);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

const vehicleUpdateSchema = vehicleSchema.partial();

// PATCH /api/vehicles/:id
router.patch('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = vehicleUpdateSchema.parse(req.body);
    const updateData = {
      ...data,
      insuranceExpiry: data.insuranceExpiry ? new Date(data.insuranceExpiry) : undefined,
      registrationExpiry: data.registrationExpiry ? new Date(data.registrationExpiry) : undefined,
      fitnessExpiry: data.fitnessExpiry ? new Date(data.fitnessExpiry) : undefined,
    };
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: updateData,
    });
    res.json(vehicle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    console.error('[VEHICLES] Update error:', error);
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
});

// DELETE /api/vehicles/:id (soft delete via RETIRED status)
router.delete('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: req.params.id },
      data: { status: 'RETIRED' },
    });
    res.json(vehicle);
  } catch (error) {
    console.error('[VEHICLES] Delete error:', error);
    res.status(500).json({ error: 'Failed to retire vehicle' });
  }
});

export default router;
