import type { Notification, NotificationType } from '../../../shared/types.ts';
import { pool, type Queryable } from '../db.ts';

export interface NotifyInput {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  rankingId?: string | null;
  matchId?: string | null;
}

export async function notify(db: Queryable, input: NotifyInput): Promise<void> {
  const ids = [...new Set(input.userIds)];
  if (ids.length === 0) return;
  await db.query(
    `INSERT INTO notifications (user_id, type, title, body, ranking_id, match_id)
     SELECT unnest($1::uuid[]), $2, $3, $4, $5, $6`,
    [ids, input.type, input.title, input.body, input.rankingId ?? null, input.matchId ?? null],
  );
}

function mapNotification(r: any): Notification {
  return {
    id: r.id, type: r.type, title: r.title, body: r.body, rankingId: r.ranking_id,
    matchId: r.match_id, readAt: r.read_at, createdAt: r.created_at,
  };
}

export async function listNotifications(userId: string): Promise<{ items: Notification[]; unread: number }> {
  const [{ rows }, count] = await Promise.all([
    pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
    pool.query('SELECT count(*)::int AS n FROM notifications WHERE user_id = $1 AND read_at IS NULL', [userId]),
  ]);
  return { items: rows.map(mapNotification), unread: count.rows[0].n };
}

export async function markRead(userId: string, ids?: string[]): Promise<void> {
  if (ids && ids.length) {
    await pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL AND id = ANY($2::uuid[])', [userId, ids]);
  } else {
    await pool.query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [userId]);
  }
}
