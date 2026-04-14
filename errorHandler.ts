import { Request, Response, NextFunction } from 'express';

/**
 * requestLogger — simple dev-friendly console logger.
 * Logs method, path, status and response time.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const ms     = Date.now() - start;
    const status = res.statusCode;
    const color  = status >= 500 ? '\x1b[31m'
                 : status >= 400 ? '\x1b[33m'
                 : '\x1b[32m';
    console.log(`${color}${req.method}\x1b[0m ${req.path} → ${status} (${ms}ms)`);
  });
  next();
}

/**
 * notFoundHandler — catch-all for unmapped routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error:   `Route '${req.method} ${req.path}' not found`,
  });
}

/**
 * errorHandler — global error boundary.
 * Catches anything that slips through controllers.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[GlobalError]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
}
