import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { config } from './config.ts';
import { pool } from './db.ts';

export const PLAYER_NAMES = [
  'taka', 'nilton', 'andre', 'cesar', 'rogerio', 'fred', 'cris', 'marcelo', 'caio', 'thales',
  'anderson', 'ricardo', 'guilherme', 'guedes', 'carlos', 'lucas', 'cauê', 'leandro', 'antonio', 'vitor',
];

/** Login = the name, accents stripped so it is typeable anywhere: "cauê" -> "caue". */
export function usernameFor(name: string): string {
  return name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** Password = first 8 hex chars of sha256(username). Deterministic, so it can be regenerated. */
export function passwordFor(name: string): string {
  return createHash('sha256').update(usernameFor(name)).digest('hex').slice(0, 8);
}

export function displayName(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function credentials(): { name: string; username: string; password: string }[] {
  return PLAYER_NAMES.map((n) => ({ name: displayName(n), username: usernameFor(n), password: passwordFor(n) }));
}

/** Idempotent: creates the club's players once; never touches existing accounts. */
export async function seedPlayers(): Promise<void> {
  let created = 0;
  for (const c of credentials()) {
    const hash = await bcrypt.hash(c.password, 10);
    const { rowCount } = await pool.query(
      `INSERT INTO users (name, username, password_hash, role) VALUES ($1, $2, $3, 'player') ON CONFLICT (username) DO NOTHING`,
      [c.name, c.username, hash],
    );
    created += rowCount ?? 0;
  }
  console.log(`[seed] players: ${created} created, ${PLAYER_NAMES.length - created} already existed`);
}

/** Idempotent: exactly the ADMIN_USERNAMES accounts that exist are admins. */
export async function seedAdmins(): Promise<void> {
  await pool.query(`UPDATE users SET role = 'admin' WHERE username::text = ANY($1::text[]) AND role <> 'admin'`, [config.adminUsernames]);
  await pool.query(`UPDATE users SET role = 'player' WHERE role = 'admin' AND NOT (username::text = ANY($1::text[]))`, [config.adminUsernames]);
  const { rows } = await pool.query(`SELECT username FROM users WHERE role = 'admin' ORDER BY username`);
  console.log(`[seed] admins: ${rows.map((r) => r.username).join(', ') || '(none yet)'}`);
}
