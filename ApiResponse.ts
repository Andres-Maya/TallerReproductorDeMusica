import { Response } from 'express';

/**
 * ApiResponse — standardises every HTTP response shape.
 *
 * Success:  { success: true,  data:    T,        meta?: object }
 * Error:    { success: false, error:   string,   details?: any }
 */
export class ApiResponse {
  static ok<T>(res: Response, data: T, meta?: object): Response {
    return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
  }

  static created<T>(res: Response, data: T): Response {
    return res.status(201).json({ success: true, data });
  }

  static noContent(res: Response): Response {
    return res.status(204).send();
  }

  static badRequest(res: Response, message: string, details?: unknown): Response {
    return res.status(400).json({ success: false, error: message, ...(details ? { details } : {}) });
  }

  static notFound(res: Response, message: string): Response {
    return res.status(404).json({ success: false, error: message });
  }

  static internalError(res: Response, message = 'Internal server error'): Response {
    return res.status(500).json({ success: false, error: message });
  }
}
