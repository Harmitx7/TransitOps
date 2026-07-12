import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const maintenanceSchema = z.object({
  vehicleId: z.string(),
  type: z.enum(['PREVENTIVE', 'CORRECTIVE', 'EMERGENCY', 'INSPECTION']),
  description: z.string().min(1),
  scheduledDate: z.string().optional(),
  cost: z.number().optional(),
  notes: z.string().optional(),
});

router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, type, vehicleId, page = '1', limit = '20' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (vehicleId) where.vehicleId = vehicleId;
    const [data, total] = await Promise.all([
      prisma.maintenance.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' }, include: { vehicle: true } }),
      prisma.maintenance.count({ where }),
    ]);
    res.json({ data, total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
});

router.post('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = maintenanceSchema.parse(req.body);
    const record = await prisma.maintenance.create({
      data: { ...data, scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined },
      include: { vehicle: true },
    });
    await prisma.vehicle.update({ where: { id: data.vehicleId }, data: { status: 'IN_SHOP' } });
    res.status(201).json(record);
  } catch (error) {
    if (error instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: error.errors }); return; }
    res.status(500).json({ error: 'Failed to create maintenance record' });
  }
});

router.patch('/:id/status', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body;
    const updateData: any = { status };
    if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
    if (status === 'COMPLETED') {
      updateData.completedAt = new Date();
      const record = await prisma.maintenance.findUnique({ where: { id: req.params.id } });
      if (record) {
        await prisma.vehicle.update({ where: { id: record.vehicleId }, data: { status: 'AVAILABLE' } });
      }
    }
    const record = await prisma.maintenance.update({ where: { id: req.params.id }, data: updateData, include: { vehicle: true } });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update maintenance status' });
  }
});

const maintenanceUpdateSchema = maintenanceSchema.partial();

router.patch('/:id', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const data = maintenanceUpdateSchema.parse(req.body);
    const updateData = {
      ...data,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
    };
    const record = await prisma.maintenance.update({ where: { id: req.params.id }, data: updateData, include: { vehicle: true } });
    res.json(record);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Failed to update maintenance record' });
  }
});

export default router;
