import express, { Express } from 'express';
import cors                   from 'cors';
import { buildRouter }        from './routes';
import { PlaylistManager }    from './services/PlaylistManager';
import {
  requestLogger,
  notFoundHandler,
  errorHandler,
} from './middlewares/errorHandler';

/**
 * createApp — Express application factory.
 *
 * Separating app creation from server startup lets us import
 * the app in tests without binding a port.
 */
export function createApp(): { app: Express; manager: PlaylistManager } {
  const app     = express();
  const manager = new PlaylistManager();

  // ── Global middleware ────────────────────────────────────
  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  // ── Health check ─────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      status:    'ok',
      service:   'waveline-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // ── API v1 ───────────────────────────────────────────────
  app.use('/api/v1', buildRouter(manager));

  // ── Fallback & error ─────────────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, manager };
}
