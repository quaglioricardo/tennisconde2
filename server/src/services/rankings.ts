import type { Match, Ranking, RankingDetail, User } from '../../../shared/types.ts';
import { mapUser } from '../auth.ts';
import { config } from '../config.ts';
import { pool, withTransaction, type Queryable } from '../db.ts';
import { drawRoundRobin } from '../domain/draw.ts';
import { currentMonth, dateToMonth, monthToDate } from '../domain/months.ts';
import { computeStandings } from '../domain/standings.ts';
import { badRequest, conflict, notFound } from '../errors.ts';
import { notify } from './notifications.ts';

export function mapMatch(r: any): Match {
  return {
    id: r.id, rankingId: r.ranking_id, roundNumber: r.round_number, month: dateToMonth(r.month),
    player1Id: r.player1_id, player2Id: r.player2_id, status: r.status, resultType: r.result_type,
    winnerId: r.winner_id, woPlayerIds: r.wo_player_ids ?? [], sets: r.sets, reportedBy: r.reported_by,
    reportedAt: r.reported_at, confirmedBy: r.confirmed_by, confirmedAt: r.confirmed_at,
    resolvedBy: r.resolved_by, rejectionReason: r.rejection_reason, updatedAt: r.updated_at,
  };
}

export function mapRanking(r: any): Ranking {
  return {
    id: r.id, name: r.name, status: r.status, startMonth: dateToMonth(r.start_month),
    matchesPerMonth: r.matches_per_month, pointsWin: r.points_win, pointsLoss: r.points_loss,
    pointsWo: r.points_wo, createdBy: r.created_by, createdAt: r.created_at, drawnAt: r.drawn_at,
    participantCount: r.participant_count ?? 0, isParticipant: r.is_participant ?? false,
  };
}

const RANKING_SELECT = `
  SELECT r.*,
    (SELECT count(*)::int FROM ranking_participants rp WHERE rp.ranking_id = r.id) AS participant_count,
    EXISTS (SELECT 1 FROM ranking_participants rp WHERE rp.ranking_id = r.id AND rp.user_id = $1) AS is_participant
  FROM rankings r`;

export async function listRankings(viewerId: string): Promise<Ranking[]> {
  const { rows } = await pool.query(`${RANKING_SELECT} ORDER BY r.created_at DESC`, [viewerId]);
  return rows.map(mapRanking);
}

export async function getRanking(db: Queryable, id: string, viewerId: string): Promise<Ranking> {
  const { rows } = await db.query(`${RANKING_SELECT} WHERE r.id = $2`, [viewerId, id]);
  if (!rows[0]) throw notFound('Ranking não encontrado');
  return mapRanking(rows[0]);
}

export async function getRankingDetail(id: string, viewerId: string): Promise<RankingDetail> {
  const ranking = await getRanking(pool, id, viewerId);
  const [participants, matches] = await Promise.all([
    pool.query(
      `SELECT u.* FROM users u JOIN ranking_participants rp ON rp.user_id = u.id
       WHERE rp.ranking_id = $1 ORDER BY rp.seed NULLS LAST, u.name`,
      [id],
    ),
    pool.query('SELECT * FROM matches WHERE ranking_id = $1 ORDER BY month, round_number, id', [id]),
  ]);
  const users: User[] = participants.rows.map(mapUser);
  const ms = matches.rows.map(mapMatch);
  const standings = computeStandings(users.map((u) => ({ id: u.id, name: u.name })), ms, ranking);
  const months = [...new Set(ms.map((m) => m.month))].sort();
  return { ranking, participants: users, matches: ms, standings, months, currentMonth: currentMonth(config.timeZone) };
}

export interface RankingInput {
  name: string;
  startMonth: string;
  matchesPerMonth: number;
  pointsWin: number;
  pointsLoss: number;
  pointsWo: number;
  participantIds: string[];
}

async function replaceParticipants(db: Queryable, rankingId: string, participantIds: string[]) {
  const ids = [...new Set(participantIds)];
  const { rowCount } = await db.query('SELECT 1 FROM users WHERE id = ANY($1::uuid[])', [ids]);
  if (rowCount !== ids.length) throw badRequest('Participante inexistente');
  await db.query('DELETE FROM ranking_participants WHERE ranking_id = $1', [rankingId]);
  if (ids.length) {
    await db.query(
      'INSERT INTO ranking_participants (ranking_id, user_id) SELECT $1, unnest($2::uuid[])',
      [rankingId, ids],
    );
  }
}

export async function createRanking(input: RankingInput, creatorId: string): Promise<Ranking> {
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `INSERT INTO rankings (name, start_month, matches_per_month, points_win, points_loss, points_wo, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [input.name, monthToDate(input.startMonth), input.matchesPerMonth, input.pointsWin, input.pointsLoss, input.pointsWo, creatorId],
    );
    await replaceParticipants(db, rows[0].id, input.participantIds);
    return getRanking(db, rows[0].id, creatorId);
  });
}

export async function updateRanking(id: string, input: RankingInput, editorId: string): Promise<Ranking> {
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT status FROM rankings WHERE id = $1 FOR UPDATE', [id]);
    if (!rows[0]) throw notFound('Ranking não encontrado');
    if (rows[0].status !== 'draft') throw conflict('Ranking já sorteado não pode ser alterado');
    await db.query(
      `UPDATE rankings SET name = $2, start_month = $3, matches_per_month = $4, points_win = $5, points_loss = $6, points_wo = $7
       WHERE id = $1`,
      [id, input.name, monthToDate(input.startMonth), input.matchesPerMonth, input.pointsWin, input.pointsLoss, input.pointsWo],
    );
    await replaceParticipants(db, id, input.participantIds);
    return getRanking(db, id, editorId);
  });
}

/** The draw: irreversible. Generates every match and freezes the ranking (ADR 0004). */
export async function drawRanking(id: string, adminId: string): Promise<Ranking> {
  return withTransaction(async (db) => {
    const { rows } = await db.query('SELECT * FROM rankings WHERE id = $1 FOR UPDATE', [id]);
    const r = rows[0];
    if (!r) throw notFound('Ranking não encontrado');
    if (r.status !== 'draft') throw conflict('Ranking já foi sorteado');
    const parts = await db.query('SELECT user_id FROM ranking_participants WHERE ranking_id = $1', [id]);
    const ids: string[] = parts.rows.map((p) => p.user_id);
    if (ids.length < 2) throw badRequest('O ranking precisa de pelo menos 2 participantes');

    const draw = drawRoundRobin(ids, dateToMonth(r.start_month), r.matches_per_month);
    for (const s of draw.seeds) {
      await db.query('UPDATE ranking_participants SET seed = $3 WHERE ranking_id = $1 AND user_id = $2', [id, s.userId, s.seed]);
    }
    for (const m of draw.matches) {
      await db.query(
        'INSERT INTO matches (ranking_id, round_number, month, player1_id, player2_id) VALUES ($1, $2, $3, $4, $5)',
        [id, m.roundNumber, monthToDate(m.month), m.player1Id, m.player2Id],
      );
    }
    await db.query(`UPDATE rankings SET status = 'drawn', drawn_at = now() WHERE id = $1`, [id]);

    await notify(db, {
      userIds: ids,
      type: 'ranking_drawn',
      title: `Ranking "${r.name}" sorteado`,
      body: `Seus jogos foram definidos: ${draw.months.length} ${draw.months.length === 1 ? 'mês' : 'meses'} a partir de ${dateToMonth(r.start_month)}.`,
      rankingId: id,
    });
    return getRanking(db, id, adminId);
  });
}

export async function deleteRanking(id: string): Promise<void> {
  const { rowCount } = await pool.query('DELETE FROM rankings WHERE id = $1', [id]);
  if (!rowCount) throw notFound('Ranking não encontrado');
}
