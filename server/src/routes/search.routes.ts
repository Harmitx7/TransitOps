import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const q = (req.query.q as string) || '';
    if (!q.trim()) { res.json({ vehicles: [], drivers: [], trips: [] }); return; }

    const [vehicles, drivers, trips] = await Promise.all([
      prisma.vehicle.findMany({
        where: {
          OR: [
            { registrationNumber: { contains: q, mode: 'insensitive' } },
            { make: { contains: q, mode: 'insensitive' } },
            { model: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, registrationNumber: true, make: true, model: true, status: true },
      }),
      prisma.driver.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: 'insensitive' } },
            { lastName: { contains: q, mode: 'insensitive' } },
            { licenseNumber: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, firstName: true, lastName: true, licenseNumber: true, status: true },
      }),
      prisma.trip.findMany({
        where: {
          OR: [
            { tripNumber: { contains: q, mode: 'insensitive' } },
            { source: { contains: q, mode: 'insensitive' } },
            { destination: { contains: q, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, tripNumber: true, source: true, destination: true, status: true },
      }),
    ]);

    res.json({ vehicles, drivers, trips });
  } catch (error) {
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
