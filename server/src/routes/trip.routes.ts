import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

const tripSchema = z.object({
  vehicleId: z.string(),
  driverId: z.string(),
  source: z.string().min(1),
  sourceLat: z.number().optional(),
  sourceLng: z.number().optional(),
  destination: z.string().min(1),
  destLat: z.number().optional(),
  destLng: z.number().optional(),
  distancePlanned: z.number().optional(),
  cargoType: z.string().optional(),
  cargoWeight: z.number().optional(),
  scheduledStart: z.string().optional(),
  revenue: z.number().optional(),
  notes: z.string().optional(),
});

function generateTripNumber(): string {
  const date = new Date();
  const prefix = `TR${date.getFullYear().toString().slice(2)}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  const suffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${suffix}`;
}

// GET /api/trips
router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, vehicleId, driverId, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;

    const [trips, total] = await Promise.all([
      prisma.trip.findMany({
        where, skip, take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { vehicle: true, driver: true },
      }),
      prisma.trip.count({ where }),
    ]);
    res.json({ data: trips, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    console.error('[TRIPS] List error:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/:id
router.get('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: req.params.id },
      include: { vehicle: true, driver: true, fuelLogs: true, expenses: true },
    });
    if (!trip) { res.status(404).json({ error: 'Trip not found' }); return; }
    res.json(trip);
  } catch (error) {
    console.error('[TRIPS] Get error:', error);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

// POST /api/trips
router.post('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = tripSchema.parse(req.body);
    const trip = await prisma.trip.create({
      data: {
        ...data,
        tripNumber: generateTripNumber(),
        dispatcherId: req.user?.id,
        scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
        trackingToken: crypto.randomBytes(16).toString('hex'),
      },
      include: { vehicle: true, driver: true },
    });
    res.status(201).json(trip);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.errors }); return; }
    console.error('[TRIPS] Create error:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PATCH /api/trips/:id/status
router.patch('/:id/status', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const validTransitions: Record<string, string[]> = {
      DRAFT: ['SCHEDULED', 'CANCELLED'],
      SCHEDULED: ['DISPATCHED', 'CANCELLED'],
      DISPATCHED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED'],
    };

    const trip = await prisma.trip.findUnique({ where: { id: req.params.id } });
    if (!trip) { res.status(404).json({ error: 'Trip not found' }); return; }

    const allowed = validTransitions[trip.status] || [];
    if (!allowed.includes(status)) {
      res.status(400).json({ error: `Cannot transition from ${trip.status} to ${status}` });
      return;
    }

    const updateData: any = { status };
    if (status === 'IN_PROGRESS') updateData.actualStart = new Date();
    if (status === 'COMPLETED') updateData.actualEnd = new Date();

    const updated = await prisma.trip.update({
      where: { id: req.params.id },
      data: updateData,
      include: { vehicle: true, driver: true },
    });

    // Auto-update vehicle and driver statuses
    if (status === 'IN_PROGRESS') {
      await prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'ON_TRIP' } });
      await prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'ON_TRIP' } });
    }
    if (status === 'COMPLETED' || status === 'CANCELLED') {
      await prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } });
      await prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } });
    }

    res.json(updated);
  } catch (error) {
    console.error('[TRIPS] Status update error:', error);
    res.status(500).json({ error: 'Failed to update trip status' });
  }
});

// PATCH /api/trips/:id
router.patch('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const trip = await prisma.trip.update({ where: { id: req.params.id }, data: req.body });
    res.json(trip);
  } catch (error) {
    console.error('[TRIPS] Update error:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

export default router;
