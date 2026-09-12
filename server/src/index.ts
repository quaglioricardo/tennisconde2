import cookieParser from 'cookie-parser';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { attachUser } from './auth.ts';
import { config } from './config.ts';
import { migrate, waitForDb } from './db.ts';
import { HttpError } from './errors.ts';
import { api } from './routes/api.ts';
import { seedAdmins, seedPlayers } from './seed.ts';
import { startSweepScheduler } from './services/sweep.ts';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(attachUser);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', api);

app.use('/api', (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.errors[0]?.message ?? 'Dados inválidos' });
  }
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Erro interno' });
});

// In Docker the API also serves the built SPA.
if (config.serveStatic) {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  } else {
    console.warn(`[web] ${dist} not found; run "npm run build" (or use the Vite dev server)`);
  }
}

async function main() {
  await waitForDb();
  await migrate();
  if (config.seedPlayers) await seedPlayers();
  await seedAdmins();
  startSweepScheduler();
  app.listen(config.port, () => console.log(`[api] listening on http://localhost:${config.port}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
