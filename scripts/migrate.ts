// Apply pending SQL migrations and exit. Same logic the server runs on boot;
// useful as a pre-deploy step or to migrate a remote DB without starting the app.
import { migrate, pool, waitForDb } from '../server/src/db.ts';

await waitForDb();
await migrate();
const { rows } = await pool.query('SELECT name, applied_at FROM schema_migrations ORDER BY name');
console.log('[db] applied migrations:', rows.map((r) => r.name).join(', ') || '(none)');
await pool.end();
