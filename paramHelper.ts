import { Request } from 'express';

/**
 * getParam — safely extracts a single string route param.
 * Express types req.params values as `string | string[]`;
 * this helper normalises them to `string`.
 */
export function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return Array.isArray(val) ? val[0] : val;
}
