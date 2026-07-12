import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.get('/', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '30' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const userId = req.user?.id;
    const where: any = { OR: [{ userId }, { userId: null }] };
    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: 'desc' } }),
      prisma.notification.count({ where }),
    ]);
    res.json({ data, total, unreadCount: data.filter((n) => !n.isRead).length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.patch('/:id/read', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.patch('/read-all', verifyToken, async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.notification.updateMany({
      where: { OR: [{ userId: req.user?.id }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

export default router;
