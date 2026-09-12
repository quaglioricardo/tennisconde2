// Writes credentials.txt (git-ignored) with every seeded player's login. Run: npm run credentials
import fs from 'node:fs';
import { credentials } from '../server/src/seed.ts';

const rows = credentials();
const width = Math.max(...rows.map((r) => r.username.length));
const lines = [
  'Tennis Conde 2 — acessos (http://localhost:3000)',
  '',
  ...rows.map((r, i) => `${String(i + 1).padStart(2)}. usuário: ${r.username.padEnd(width)}  senha: ${r.password}`),
  '',
];
fs.writeFileSync('credentials.txt', lines.join('\n'));
console.log(lines.join('\n'));
