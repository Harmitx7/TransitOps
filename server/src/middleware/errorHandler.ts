import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[ERROR]', err.message);

  if (err.name === 'ZodError') {
    res.status(400).json({ error: 'Validation failed', details: err });
    return;
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(409).json({ error: 'Database conflict', message: err.message });
    return;
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
};
