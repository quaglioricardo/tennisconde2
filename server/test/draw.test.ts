import { describe, expect, it } from 'vitest';
import { drawRoundRobin, providesBalls } from '../src/domain/draw.ts';

function seeded(seed: number) {
  // Mulberry32: deterministic PRNG for reproducible draws in tests.
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ids = (n: number) => Array.from({ length: n }, (_, i) => `u${i + 1}`);

describe('drawRoundRobin', () => {
  it.each([2, 3, 4, 5, 7, 8, 10])('with %i players everyone meets everyone exactly once', (n) => {
    const { matches } = drawRoundRobin(ids(n), '2026-10', 3, seeded(n));
    expect(matches).toHaveLength((n * (n - 1)) / 2);
    const pairs = new Set(matches.map((m) => [m.player1Id, m.player2Id].sort().join('-')));
    expect(pairs.size).toBe(matches.length);
    expect(matches.every((m) => m.player1Id !== m.player2Id)).toBe(true);
  });

  it('never schedules a player twice in the same round', () => {
    const { matches } = drawRoundRobin(ids(7), '2026-10', 3, seeded(7));
    const byRound = new Map<number, string[]>();
    for (const m of matches) {
      const list = byRound.get(m.roundNumber) ?? [];
      list.push(m.player1Id, m.player2Id);
      byRound.set(m.roundNumber, list);
    }
    for (const players of byRound.values()) expect(new Set(players).size).toBe(players.length);
    expect(byRound.size).toBe(7); // odd count -> n rounds with a bye each
  });

  it('groups 3 rounds per month and rolls over the year', () => {
    const { matches, months } = drawRoundRobin(ids(8), '2026-11', 3, seeded(8));
    // 7 rounds -> months: 2026-11 (r1-3), 2026-12 (r4-6), 2027-01 (r7)
    expect(months).toEqual(['2026-11', '2026-12', '2027-01']);
    expect(matches.filter((m) => m.month === '2027-01').every((m) => m.roundNumber === 7)).toBe(true);
    // each player plays at most 3 matches in a full month
    for (const p of ids(8)) {
      const inNov = matches.filter((m) => m.month === '2026-11' && (m.player1Id === p || m.player2Id === p));
      expect(inNov.length).toBeLessThanOrEqual(3);
    }
  });

  it.each([2, 3, 4, 5, 7, 8, 9, 20])('with %i players the ball-provider load (player 1) is balanced within 1', (n) => {
    const { matches } = drawRoundRobin(ids(n), '2026-10', 3, seeded(n));
    const count = new Map(ids(n).map((id) => [id, 0]));
    for (const m of matches) count.set(m.player1Id, count.get(m.player1Id)! + 1);
    const values = [...count.values()];
    expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(1);
  });

  it('providesBalls orients every pair exactly one way', () => {
    for (const n of [2, 5, 6, 20]) {
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) expect(providesBalls(i, j, n)).toBe(!providesBalls(j, i, n));
    }
  });

  it('is random: different seeds give different orders', () => {
    const a = drawRoundRobin(ids(6), '2026-10', 3, seeded(1)).seeds.map((s) => s.userId).join();
    const b = drawRoundRobin(ids(6), '2026-10', 3, seeded(2)).seeds.map((s) => s.userId).join();
    expect(a).not.toBe(b);
  });

  it('rejects fewer than 2 participants', () => {
    expect(() => drawRoundRobin(['u1'], '2026-10', 3)).toThrow();
  });
});
