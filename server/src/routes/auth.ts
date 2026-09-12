import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { clearSession, mapUser, requireAuth, setSession } from '../auth.ts';
import { config } from '../config.ts';
import { pool } from '../db.ts';
import { badRequest, conflict, unauthorized } from '../errors.ts';

export const authRouter = Router();

const username = z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{2,30}$/, 'Usuário: 2 a 30 caracteres, só letras, números, ponto, hífen ou _');
const newPassword = z.string().min(6, 'Senha precisa ter pelo menos 6 caracteres').max(200);
const credentials = z.object({ username, password: newPassword });
const loginInput = z.object({ username, password: z.string().max(200) });

authRouter.post('/register', async (req, res, next) => {
  try {
    const body = credentials.extend({ name: z.string().trim().min(2, 'Nome muito curto').max(80) }).parse(req.body);
    const exists = await pool.query('SELECT 1 FROM users WHERE username = $1', [body.username]);
    if (exists.rowCount) throw conflict('Usuário já cadastrado');
    const role = config.adminUsernames.includes(body.username) ? 'admin' : 'player';
    const hash = await bcrypt.hash(body.password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [body.name, body.username, hash, role],
    );
    setSession(res, rows[0].id);
    res.status(201).json({ user: mapUser(rows[0]) });
  } catch (e) { next(e); }
});

authRouter.post('/login', async (req, res, next) => {
  try {
    const body = loginInput.parse(req.body);
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [body.username]);
    const ok = rows[0] && (await bcrypt.compare(body.password, rows[0].password_hash));
    if (!ok) throw unauthorized('Usuário ou senha incorretos');
    setSession(res, rows[0].id);
    res.json({ user: mapUser(rows[0]) });
  } catch (e) { next(e); }
});

authRouter.post('/logout', (_req, res) => {
  clearSession(res);
  res.status(204).end();
});

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ?? null });
});

authRouter.post('/password', requireAuth, async (req, res, next) => {
  try {
    const body = z.object({ currentPassword: z.string(), newPassword }).parse(req.body);
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
    if (!(await bcrypt.compare(body.currentPassword, rows[0].password_hash))) throw badRequest('Senha atual incorreta');
    await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [req.user!.id, await bcrypt.hash(body.newPassword, 10)]);
    res.status(204).end();
  } catch (e) { next(e); }
});
