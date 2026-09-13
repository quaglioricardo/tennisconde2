import { describe, expect, it } from 'vitest';
import type { Match } from '../../shared/types.ts';
import { computeStandings, pointsFor } from '../src/domain/standings.ts';

const scheme = { pointsWin: 3, pointsLoss: 1, pointsWo: -1 };
const P = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bia' },
  { id: 'c', name: 'Caio' },
];

let n = 0;
function match(p1: string, p2: string, overrides: Partial<Match>): Match {
  return {
    id: `m${++n}`, rankingId: 'r', roundNumber: 1, month: '2026-10', player1Id: p1, player2Id: p2,
    status: 'confirmed', resultType: 'played', winnerId: p1, woPlayerIds: [], sets: [{ p1: 6, p2: 4 }],
    reportedBy: null, reportedAt: null, confirmedBy: null, confirmedAt: null, resolvedBy: 'players',
    rejectionReason: null, updatedAt: '', ...overrides,
  };
}

describe('pointsFor', () => {
  it('loss still scores, WO scores less than a loss', () => {
    const played = match('a', 'b', {});
    expect(pointsFor(played, 'a', scheme)).toBe(3);
    expect(pointsFor(played, 'b', scheme)).toBe(1);
    const wo = match('a', 'b', { resultType: 'wo', winnerId: 'a', woPlayerIds: ['b'], sets: null });
    expect(pointsFor(wo, 'a', scheme)).toBe(3);
    expect(pointsFor(wo, 'b', scheme)).toBe(-1);
    const dbl = match('a', 'b', { resultType: 'wo', winnerId: null, woPlayerIds: ['a', 'b'], sets: null });
    expect(pointsFor(dbl, 'a', scheme)).toBe(-1);
    expect(pointsFor(dbl, 'b', scheme)).toBe(-1);
  });
  it('ignores unconfirmed matches', () => {
    expect(pointsFor(match('a', 'b', { status: 'reported' }), 'a', scheme)).toBe(0);
  });
});

describe('computeStandings', () => {
  it('sorts by points then tiebreakers', () => {
    const matches = [
      match('a', 'b', {}), // a beats b
      match('c', 'a', { winnerId: 'a', sets: [{ p1: 4, p2: 6 }, { p1: 2, p2: 6 }] }), // a beats c
      match('b', 'c', { resultType: 'wo', winnerId: null, woPlayerIds: ['b', 'c'], sets: null }), // double WO
    ];
    const rows = computeStandings(P, matches, scheme);
    expect(rows.map((r) => [r.name, r.points, r.position])).toEqual([
      ['Ana', 6, 1],
      ['Bia', 0, 2], // 1 (loss) - 1 (wo)
      ['Caio', 0, 3],
    ]);
    // Bia vs Caio tie on points, wins, wos -> head-to-head is double WO (tie) -> set diff: Bia -1, Caio -2
    expect(rows[1].setsFor - rows[1].setsAgainst).toBe(-1);
    expect(rows[2].setsFor - rows[2].setsAgainst).toBe(-2);
    expect(rows[0].played).toBe(2);
    expect(rows[1].wos).toBe(1);
  });

  it('head-to-head decides an otherwise perfect tie', () => {
    const P2 = [{ id: 'a', name: 'Zed' }, { id: 'b', name: 'Amy' }];
    const rows = computeStandings(P2, [match('b', 'a', { winnerId: 'a', sets: [{ p1: 4, p2: 6 }] })], scheme);
    expect(rows[0].name).toBe('Zed');
  });
});
