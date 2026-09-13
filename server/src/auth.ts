import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role, User } from '../../shared/types.ts';
import { config } from './config.ts';
import { pool } from './db.ts';
import { forbidden, unauthorized } from './errors.ts';

export const COOKIE = 'tc2_session';
const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
  }
}

export function mapUser(row: any): User {
  return { id: row.id, name: row.name, username: row.username, role: row.role, createdAt: row.created_at };
}

export function setSession(res: Response, userId: string) {
  const token = jwt.sign({ sub: userId }, config.jwtSecret, { expiresIn: THIRTY_DAYS_S });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: THIRTY_DAYS_S * 1000,
    path: '/',
  });
}

export function clearSession(res: Response) {
  res.clearCookie(COOKIE, { path: '/' });
}

/** Loads req.user from the session cookie when present; never fails. */
export async function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string };
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [payload.sub]);
    if (rows[0]) req.user = mapUser(rows[0]);
  } catch {
    // invalid/expired token: treat as anonymous
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(unauthorized());
  next();
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden('Apenas administradores'));
    next();
  };
}

export const isAdmin = (u: User | undefined) => u?.role === 'admin';
