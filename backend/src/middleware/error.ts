import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  if (!res.headersSent) {
    res.status(status).json({ error: message });
  }
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
};
