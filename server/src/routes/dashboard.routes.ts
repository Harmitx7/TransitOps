import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', verifyToken, async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalVehicles,
      vehiclesByStatus,
      totalDrivers,
      driversByStatus,
      tripsByStatus,
      totalRevenue,
      totalExpenses,
      totalFuelCost,
      avgHealthScore,
      avgSafetyScore,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.groupBy({ by: ['status'], _count: true }),
      prisma.driver.count(),
      prisma.driver.groupBy({ by: ['status'], _count: true }),
      prisma.trip.groupBy({ by: ['status'], _count: true }),
      prisma.trip.aggregate({ _sum: { revenue: true } }),
      prisma.expense.aggregate({ _sum: { amount: true } }),
      prisma.fuelLog.aggregate({ _sum: { totalCost: true } }),
      prisma.vehicle.aggregate({ _avg: { healthScore: true } }),
      prisma.driver.aggregate({ _avg: { safetyScore: true } }),
    ]);

    const statusMap = (arr: Array<{ status: string; _count: number }>) =>
      arr.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {} as Record<string, number>);

    const vStatus = statusMap(vehiclesByStatus as any);
    const dStatus = statusMap(driversByStatus as any);
    const tStatus = statusMap(tripsByStatus as any);

    const activeVehicles = (vStatus['ON_TRIP'] || 0);
    const availableVehicles = (vStatus['AVAILABLE'] || 0);
    const inMaintenance = (vStatus['IN_SHOP'] || 0);

    const onDutyDrivers = (dStatus['ON_TRIP'] || 0);
    const availableDrivers = (dStatus['AVAILABLE'] || 0);

    const activeTrips = (tStatus['IN_PROGRESS'] || 0) + (tStatus['DISPATCHED'] || 0);
    const pendingTrips = (tStatus['DRAFT'] || 0) + (tStatus['SCHEDULED'] || 0);
    const completedTrips = (tStatus['COMPLETED'] || 0);

    const fleetUtilization = totalVehicles > 0
      ? Math.round(((activeVehicles + inMaintenance) / totalVehicles) * 100)
      : 0;

    res.json({
      totalVehicles,
      activeVehicles,
      availableVehicles,
      inMaintenance,
      totalDrivers,
      onDutyDrivers,
      availableDrivers,
      activeTrips,
      pendingTrips,
      completedTrips,
      fleetUtilization,
      totalRevenue: totalRevenue._sum.revenue || 0,
      totalExpenses: (totalExpenses._sum.amount || 0) + (totalFuelCost._sum.totalCost || 0),
      avgHealthScore: Math.round(avgHealthScore._avg.healthScore || 0),
      avgSafetyScore: Math.round(avgSafetyScore._avg.safetyScore || 0),
      vehiclesByStatus: vStatus,
      driversByStatus: dStatus,
      tripsByStatus: tStatus,
    });
  } catch (error) {
    console.error('[DASHBOARD] Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
