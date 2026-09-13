import 'dotenv/config';

const env = process.env;

export const config = {
  port: Number(env.PORT ?? 3000),
  databaseUrl: env.DATABASE_URL ?? 'postgres://tennis:tennis@localhost:5432/tennis',
  jwtSecret: env.JWT_SECRET ?? 'dev-only-change-me',
  adminUsernames: (env.ADMIN_USERNAMES ?? 'thales,ricardo')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  seedPlayers: (env.SEED_PLAYERS ?? 'true') === 'true',
  timeZone: env.TZ_NAME ?? 'America/Sao_Paulo',
  sweepIntervalMs: Number(env.SWEEP_INTERVAL_MS ?? 10 * 60 * 1000),
  serveStatic: (env.SERVE_STATIC ?? 'true') === 'true',
  cookieSecure: (env.COOKIE_SECURE ?? 'false') === 'true',
};
