import { config } from '../config.ts';
import { withTransaction } from '../db.ts';
import { currentMonth, dateToMonth } from '../domain/months.ts';
import { notify } from './notifications.ts';

/**
 * Every match whose month is over and that was never confirmed becomes a
 * double WO (ADR 0004). Idempotent; safe to run on any schedule.
 */
export async function sweepExpiredMatches(now: Date = new Date()): Promise<number> {
  const cutoff = `${currentMonth(config.timeZone, now)}-01`;
  return withTransaction(async (db) => {
    const { rows } = await db.query(
      `UPDATE matches m
         SET status = 'confirmed', result_type = 'wo', winner_id = NULL,
             wo_player_ids = ARRAY[m.player1_id, m.player2_id], sets = NULL,
             resolved_by = 'system', confirmed_at = now(), updated_at = now()
       WHERE m.status <> 'confirmed' AND m.month < $1::date
       RETURNING m.id, m.ranking_id, m.month, m.player1_id, m.player2_id`,
      [cutoff],
    );
    for (const m of rows) {
      const rk = await db.query('SELECT name FROM rankings WHERE id = $1', [m.ranking_id]);
      await notify(db, {
        userIds: [m.player1_id, m.player2_id],
        type: 'double_wo',
        title: 'WO duplo aplicado',
        body: `${rk.rows[0].name}: o jogo de ${dateToMonth(m.month)} não foi confirmado até o fim do mês. Ambos receberam WO.`,
        rankingId: m.ranking_id,
        matchId: m.id,
      });
    }
    if (rows.length) console.log(`[sweep] applied double WO to ${rows.length} match(es)`);
    return rows.length;
  });
}

export function startSweepScheduler() {
  const run = () => sweepExpiredMatches().catch((err) => console.error('[sweep] failed', err));
  run();
  const timer = setInterval(run, config.sweepIntervalMs);
  timer.unref();
}

