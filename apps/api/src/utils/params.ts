import { Request } from 'express';

/** Get a single param value from Express — handles Express 5 string | string[] union */
export function getParam(req: Request, name: string): string {
  const val = req.params[name];
  if (!val) return '';
  return Array.isArray(val) ? (val[0] ?? '') : val;
}
