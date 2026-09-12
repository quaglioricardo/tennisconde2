import type { AdminResultInput, Match, PendingAction, ReportInput, User } from '../../../shared/types.ts';
import { config } from '../config.ts';
import { pool, withTransaction } from '../db.ts';
import { compareMonths, currentMonth } from '../domain/months.ts';
import { formatSets, ScoreError, validateSets } from '../domain/score.ts';
import { badRequest, conflict, forbidden, notFound } from '../errors.ts';
import { notify } from './notifications.ts';
import { mapMatch } from './rankings.ts';

interface Loaded {
  match: Match;
  rankingName: string;
  names: Record<string, string>;
}

async function load(db: { query: typeof pool.query }, id: string, lock = false): Promise<Loaded> {
  const { rows } = await db.query(`SELECT m.* FROM matches m WHERE m.id = $1 ${lock ? 'FOR UPDATE' : ''}`, [id]);
  if (!rows[0]) throw notFound('Jogo não encontrado');
  const match = mapMatch(rows[0]);
  const [rk, us] = await Promise.all([
    db.query('SELECT name FROM rankings WHERE id = $1', [match.rankingId]),
    db.query('SELECT id, name FROM users WHERE id = ANY($1::uuid[])', [[match.player1Id, match.player2Id]]),
  ]);
  const names: Record<string, string> = {};
  for (const u of us.rows) names[u.id] = u.name;
  return { match, rankingName: rk.rows[0].name, names };
}

function assertParticipant(match: Match, user: User) {
  if (match.player1Id !== user.id && match.player2Id !== user.id) throw forbidden('Você não joga este jogo');
}

function assertMonthOpen(match: Match) {
  if (compareMonths(match.month, currentMonth(config.timeZone)) < 0) {
    throw conflict('O mês deste jogo já encerrou; apenas um admin pode alterar o resultado');
  }
}

function opponentOf(match: Match, userId: string) {
  return match.player1Id === userId ? match.player2Id : match.player1Id;
}

interface Resolved {
  resultType: 'played' | 'wo';
  winnerId: string | null;
  woPlayerIds: string[];
  sets: { p1: number; p2: number }[] | null;
}

function resolvePlayed(match: Match, sets: { p1: number; p2: number }[]): Resolved {
  try {
    const side = validateSets(sets);
    return { resultType: 'played', winnerId: side === 'p1' ? match.player1Id : match.player2Id, woPlayerIds: [], sets };
  } catch (e) {
    if (e instanceof ScoreError) throw badRequest(e.message);
    throw e;
  }
}

function resolveWo(match: Match, woPlayerIds: string[]): Resolved {
  const ids = [...new Set(woPlayerIds)];
  const valid = ids.every((id) => id === match.player1Id || id === match.player2Id);
  if (ids.length < 1 || ids.length > 2 || !valid) throw badRequest('WO inválido');
  const winnerId = ids.length === 1 ? opponentOf(match, ids[0]) : null;
  return { resultType: 'wo', winnerId, woPlayerIds: ids, sets: null };
}

function describe(r: Resolved, names: Record<string, string>): string {
  if (r.resultType === 'wo') {
    return r.woPlayerIds.length === 2 ? 'WO duplo' : `WO de ${names[r.woPlayerIds[0]]} — vitória de ${names[r.winnerId!]}`;
  }
  return `${names[r.winnerId!]} venceu por ${formatSets(r.sets)}`;
}

/** A participant reports a result; the opponent must confirm. */
export async function reportResult(id: string, input: ReportInput, user: User): Promise<Match> {
  return withTransaction(async (db) => {
    const { match, rankingName, names } = await load(db, id, true);
    assertParticipant(match, user);
    assertMonthOpen(match);
    if (match.status !== 'pending') throw conflict('Este jogo já tem um resultado reportado ou confirmado');

    const r = input.type === 'played' ? resolvePlayed(match, input.sets) : resolveWo(match, [input.woPlayerId]);
    await db.query(
      `UPDATE matches SET status = 'reported', result_type = $2, winner_id = $3, wo_player_ids = $4, sets = $5,
         reported_by = $6, reported_at = now(), confirmed_by = NULL, confirmed_at = NULL, resolved_by = NULL,
         rejection_reason = NULL, updated_at = now()
       WHERE id = $1`,
      [id, r.resultType, r.winnerId, r.woPlayerIds, r.sets ? JSON.stringify(r.sets) : null, user.id],
    );
    await notify(db, {
      userIds: [opponentOf(match, user.id)],
      type: 'score_reported',
      title: `${user.name} reportou um resultado`,
      body: `${rankingName}: ${describe(r, names)}. Confirme ou rejeite.`,
      rankingId: match.rankingId,
      matchId: id,
    });
    return (await load(db, id)).match;
  });
}

export async function confirmResult(id: string, user: User): Promise<Match> {
  return withTransaction(async (db) => {
    const { match, rankingName, names } = await load(db, id, true);
    assertParticipant(match, user);
    if (match.status !== 'reported') throw conflict('Não há resultado aguardando confirmação');
    if (match.reportedBy === user.id) throw forbidden('Quem reportou não pode confirmar o próprio resultado');
    await db.query(
      `UPDATE matches SET status = 'confirmed', confirmed_by = $2, confirmed_at = now(), resolved_by = 'players', updated_at = now()
       WHERE id = $1`,
      [id, user.id],
    );
    const r: Resolved = { resultType: match.resultType!, winnerId: match.winnerId, woPlayerIds: match.woPlayerIds, sets: match.sets };
    await notify(db, {
      userIds: [match.reportedBy!],
      type: 'score_confirmed',
      title: `${user.name} confirmou o resultado`,
      body: `${rankingName}: ${describe(r, names)}. Pontos computados.`,
      rankingId: match.rankingId,
      matchId: id,
    });
    return (await load(db, id)).match;
  });
}

export async function rejectResult(id: string, reason: string | undefined, user: User): Promise<Match> {
  return withTransaction(async (db) => {
    const { match, rankingName } = await load(db, id, true);
    assertParticipant(match, user);
    if (match.status !== 'reported') throw conflict('Não há resultado aguardando confirmação');
    if (match.reportedBy === user.id) throw forbidden('Use "desfazer" para retirar o seu próprio reporte');
    await db.query(
      `UPDATE matches SET status = 'pending', result_type = NULL, winner_id = NULL, wo_player_ids = '{}', sets = NULL,
         rejection_reason = $2, updated_at = now() WHERE id = $1`,
      [id, reason?.trim() || null],
    );
    await notify(db, {
      userIds: [match.reportedBy!],
      type: 'score_rejected',
      title: `${user.name} rejeitou o resultado`,
      body: `${rankingName}: o jogo voltou a ficar pendente.${reason ? ` Motivo: ${reason}` : ''}`,
      rankingId: match.rankingId,
      matchId: id,
    });
    return (await load(db, id)).match;
  });
}

/** The reporter takes back their own report before it is confirmed. */
export async function withdrawReport(id: string, user: User): Promise<Match> {
  return withTransaction(async (db) => {
    const { match } = await load(db, id, true);
    if (match.status !== 'reported' || match.reportedBy !== user.id) throw conflict('Nada para desfazer');
    await db.query(
      `UPDATE matches SET status = 'pending', result_type = NULL, winner_id = NULL, wo_player_ids = '{}', sets = NULL,
         reported_by = NULL, reported_at = NULL, updated_at = now() WHERE id = $1`,
      [id],
    );
    return (await load(db, id)).match;
  });
}

/** Admins set (or override) any result; it is confirmed immediately. */
export async function adminSetResult(id: string, input: AdminResultInput, admin: User): Promise<Match> {
  return withTransaction(async (db) => {
    const { match, rankingName, names } = await load(db, id, true);
    const r = input.type === 'played' ? resolvePlayed(match, input.sets) : resolveWo(match, input.woPlayerIds);
    await db.query(
      `UPDATE matches SET status = 'confirmed', result_type = $2, winner_id = $3, wo_player_ids = $4, sets = $5,
         reported_by = $6, reported_at = now(), confirmed_by = $6, confirmed_at = now(), resolved_by = 'admin',
         rejection_reason = NULL, updated_at = now()
       WHERE id = $1`,
      [id, r.resultType, r.winnerId, r.woPlayerIds, r.sets ? JSON.stringify(r.sets) : null, admin.id],
    );
    await notify(db, {
      userIds: [match.player1Id, match.player2Id].filter((u) => u !== admin.id),
      type: 'result_set_by_admin',
      title: `Resultado definido pela administração`,
      body: `${rankingName}: ${describe(r, names)}.`,
      rankingId: match.rankingId,
      matchId: id,
    });
    return (await load(db, id)).match;
  });
}

/** Matches across all rankings where `user` still has to act. */
export async function pendingActions(user: User): Promise<PendingAction[]> {
  const { rows } = await pool.query(
    `SELECT m.*, r.name AS ranking_name,
            CASE WHEN m.player1_id = $1 THEN u2.name ELSE u1.name END AS opponent_name
     FROM matches m
     JOIN rankings r ON r.id = m.ranking_id
     JOIN users u1 ON u1.id = m.player1_id
     JOIN users u2 ON u2.id = m.player2_id
     WHERE (m.player1_id = $1 OR m.player2_id = $1)
       AND m.status <> 'confirmed'
       AND m.month >= $2::date
     ORDER BY m.month, m.round_number`,
    [user.id, `${currentMonth(config.timeZone)}-01`],
  );
  const cur = currentMonth(config.timeZone);
  return rows
    .map((row) => ({ match: mapMatch(row), rankingId: row.ranking_id, rankingName: row.ranking_name, opponentName: row.opponent_name }))
    .filter(({ match }) => match.status === 'reported' ? match.reportedBy !== user.id : match.month === cur)
    .map((x) => ({ ...x, action: x.match.status === 'reported' ? 'confirm' : 'report' }));
}

