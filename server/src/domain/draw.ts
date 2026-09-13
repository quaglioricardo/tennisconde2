import { addMonths } from './months.ts';

export interface DrawnMatch {
  roundNumber: number; // 1-based
  month: string; // YYYY-MM
  player1Id: string;
  player2Id: string;
}

export interface DrawResult {
  seeds: { userId: string; seed: number }[];
  matches: DrawnMatch[];
  months: string[];
}

export function shuffle<T>(items: T[], random: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Who provides the balls (listed as player 1). Orients every pair of K_n so each
 * player's count is n/2 or n/2-1 (a near-regular tournament), i.e. balanced within 1.
 * `i`, `j` are seed indices in [0, n).
 */
export function providesBalls(i: number, j: number, n: number): boolean {
  const d = (j - i + n) % n;
  if (n % 2 === 1) return d <= (n - 1) / 2;
  if (d === n / 2) return i < j;
  return d < n / 2;
}

/**
 * Circle-method round robin. Every participant meets every other exactly once,
 * at most one match per round. Odd counts get a bye per round.
 * Rounds are grouped into months of `matchesPerMonth` rounds starting at `startMonth`.
 */
export function drawRoundRobin(
  participantIds: string[],
  startMonth: string,
  matchesPerMonth: number,
  random: () => number = Math.random,
): DrawResult {
  if (participantIds.length < 2) throw new Error('A ranking needs at least 2 participants');
  if (matchesPerMonth < 1) throw new Error('matchesPerMonth must be >= 1');

  const BYE = null;
  const order = shuffle(participantIds, random);
  const seeds = order.map((userId, i) => ({ userId, seed: i + 1 }));

  const indexOf = new Map(order.map((id, i) => [id, i]));
  const players = order.length;
  const slots: (string | null)[] = [...order];
  if (slots.length % 2 === 1) slots.push(BYE);
  const n = slots.length;
  const rounds = n - 1;

  const matches: DrawnMatch[] = [];
  const monthsSet = new Set<string>();
  // Standard rotation: keep slots[0] fixed, rotate the rest clockwise.
  let rotating = slots.slice(1);
  for (let r = 0; r < rounds; r++) {
    const current = [slots[0], ...rotating];
    const roundNumber = r + 1;
    const month = addMonths(startMonth, Math.floor(r / matchesPerMonth));
    for (let i = 0; i < n / 2; i++) {
      const a = current[i];
      const b = current[n - 1 - i];
      if (a === BYE || b === BYE) continue;
      // Player 1 provides the balls; keep that load balanced across the ranking.
      const [p1, p2] = providesBalls(indexOf.get(a)!, indexOf.get(b)!, players) ? [a, b] : [b, a];
      matches.push({ roundNumber, month, player1Id: p1, player2Id: p2 });
      monthsSet.add(month);
    }
    rotating = [rotating[rotating.length - 1], ...rotating.slice(0, -1)];
  }

  return { seeds, matches, months: [...monthsSet].sort() };
}
