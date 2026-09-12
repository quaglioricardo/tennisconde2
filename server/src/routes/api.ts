import { Router } from 'express';
import { z } from 'zod';
import { mapUser, requireAuth, requireRole } from '../auth.ts';
import { pool } from '../db.ts';
import { adminSetResult, confirmResult, pendingActions, rejectResult, reportResult, withdrawReport } from '../services/matches.ts';
import { listNotifications, markRead } from '../services/notifications.ts';
import { createRanking, deleteRanking, drawRanking, getRankingDetail, listRankings, updateRanking } from '../services/rankings.ts';
import { authRouter } from './auth.ts';

export const api = Router();
api.use('/auth', authRouter);

// Everything below requires a session.
api.use(requireAuth);
const admin = requireRole('admin');

api.get('/users', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY name');
    res.json({ users: rows.map(mapUser) });
  } catch (e) { next(e); }
});

// ---- Rankings -------------------------------------------------------------

const rankingInput = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(80),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido (AAAA-MM)'),
  matchesPerMonth: z.number().int().min(1).max(10).default(3),
  pointsWin: z.number().int().min(-10000).max(10000).default(300),
  pointsLoss: z.number().int().min(-10000).max(10000).default(100),
  pointsWo: z.number().int().min(-10000).max(10000).default(-100),
  participantIds: z.array(z.string().uuid()).default([]),
});

api.get('/rankings', async (req, res, next) => {
  try { res.json({ rankings: await listRankings(req.user!.id) }); } catch (e) { next(e); }
});

api.post('/rankings', admin, async (req, res, next) => {
  try { res.status(201).json({ ranking: await createRanking(rankingInput.parse(req.body), req.user!.id) }); } catch (e) { next(e); }
});

api.get('/rankings/:id', async (req, res, next) => {
  try { res.json(await getRankingDetail(req.params.id, req.user!.id)); } catch (e) { next(e); }
});

api.put('/rankings/:id', admin, async (req, res, next) => {
  try { res.json({ ranking: await updateRanking(req.params.id, rankingInput.parse(req.body), req.user!.id) }); } catch (e) { next(e); }
});

api.post('/rankings/:id/draw', admin, async (req, res, next) => {
  try { res.json({ ranking: await drawRanking(req.params.id, req.user!.id) }); } catch (e) { next(e); }
});

api.delete('/rankings/:id', admin, async (req, res, next) => {
  try { await deleteRanking(req.params.id); res.status(204).end(); } catch (e) { next(e); }
});

// ---- Matches --------------------------------------------------------------

const setScore = z.object({ p1: z.number().int(), p2: z.number().int() });
const reportInput = z.discriminatedUnion('type', [
  z.object({ type: z.literal('played'), sets: z.array(setScore).min(2).max(3) }),
  z.object({ type: z.literal('wo'), woPlayerId: z.string().uuid() }),
]);
const adminResultInput = z.discriminatedUnion('type', [
  z.object({ type: z.literal('played'), sets: z.array(setScore).min(2).max(3) }),
  z.object({ type: z.literal('wo'), woPlayerIds: z.array(z.string().uuid()).min(1).max(2) }),
]);

api.get('/me/pending', async (req, res, next) => {
  try { res.json({ pending: await pendingActions(req.user!) }); } catch (e) { next(e); }
});

api.post('/matches/:id/report', async (req, res, next) => {
  try { res.json({ match: await reportResult(req.params.id, reportInput.parse(req.body), req.user!) }); } catch (e) { next(e); }
});

api.post('/matches/:id/confirm', async (req, res, next) => {
  try { res.json({ match: await confirmResult(req.params.id, req.user!) }); } catch (e) { next(e); }
});

api.post('/matches/:id/reject', async (req, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().max(300).optional() }).parse(req.body ?? {});
    res.json({ match: await rejectResult(req.params.id, reason, req.user!) });
  } catch (e) { next(e); }
});

api.delete('/matches/:id/report', async (req, res, next) => {
  try { res.json({ match: await withdrawReport(req.params.id, req.user!) }); } catch (e) { next(e); }
});

api.put('/matches/:id/result', admin, async (req, res, next) => {
  try { res.json({ match: await adminSetResult(req.params.id, adminResultInput.parse(req.body), req.user!) }); } catch (e) { next(e); }
});

// ---- Notifications --------------------------------------------------------

api.get('/notifications', async (req, res, next) => {
  try { res.json(await listNotifications(req.user!.id)); } catch (e) { next(e); }
});

api.post('/notifications/read', async (req, res, next) => {
  try {
    const { ids } = z.object({ ids: z.array(z.string().uuid()).optional() }).parse(req.body ?? {});
    await markRead(req.user!.id, ids);
    res.status(204).end();
  } catch (e) { next(e); }
});
