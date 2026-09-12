import type { Match, StandingRow } from '../../../shared/types.ts';

export interface PointsScheme {
  pointsWin: number;
  pointsLoss: number;
  pointsWo: number;
}

interface Participant {
  id: string;
  name: string;
}

/** Points a single confirmed match awards to `userId`. */
export function pointsFor(match: Match, userId: string, scheme: PointsScheme): number {
  if (match.status !== 'confirmed') return 0;
  if (match.resultType === 'wo') {
    return match.woPlayerIds.includes(userId) ? scheme.pointsWo : scheme.pointsWin;
  }
  return match.winnerId === userId ? scheme.pointsWin : scheme.pointsLoss;
}

/**
 * Standings are derived from confirmed matches on every read (ADR 0003).
 * Tiebreakers: points, wins, fewer WOs, head-to-head, set diff, game diff, name.
 */
export function computeStandings(participants: Participant[], matches: Match[], scheme: PointsScheme): StandingRow[] {
  const rows = new Map<string, StandingRow>();
  for (const p of participants) {
    rows.set(p.id, {
      userId: p.id, name: p.name, position: 0, points: 0, played: 0,
      wins: 0, losses: 0, wos: 0, setsFor: 0, setsAgainst: 0, gamesFor: 0, gamesAgainst: 0,
    });
  }

  const confirmed = matches.filter((m) => m.status === 'confirmed');
  for (const m of confirmed) {
    const r1 = rows.get(m.player1Id);
    const r2 = rows.get(m.player2Id);
    if (!r1 || !r2) continue;
    r1.points += pointsFor(m, m.player1Id, scheme);
    r2.points += pointsFor(m, m.player2Id, scheme);

    if (m.resultType === 'wo') {
      for (const [r, id] of [[r1, m.player1Id], [r2, m.player2Id]] as const) {
        if (m.woPlayerIds.includes(id)) r.wos++;
        else r.wins++;
      }
      continue;
    }

    r1.played++;
    r2.played++;
    if (m.winnerId === m.player1Id) { r1.wins++; r2.losses++; } else { r2.wins++; r1.losses++; }
    for (const s of m.sets ?? []) {
      r1.gamesFor += s.p1; r1.gamesAgainst += s.p2;
      r2.gamesFor += s.p2; r2.gamesAgainst += s.p1;
      if (s.p1 > s.p2) { r1.setsFor++; r2.setsAgainst++; } else { r2.setsFor++; r1.setsAgainst++; }
    }
  }

  const headToHead = (a: StandingRow, b: StandingRow): number => {
    const m = confirmed.find(
      (x) => (x.player1Id === a.userId && x.player2Id === b.userId) || (x.player1Id === b.userId && x.player2Id === a.userId),
    );
    if (!m) return 0;
    const pa = pointsFor(m, a.userId, scheme);
    const pb = pointsFor(m, b.userId, scheme);
    return pb - pa;
  };

  const sorted = [...rows.values()].sort(
    (a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      a.wos - b.wos ||
      headToHead(a, b) ||
      (b.setsFor - b.setsAgainst) - (a.setsFor - a.setsAgainst) ||
      (b.gamesFor - b.gamesAgainst) - (a.gamesFor - a.gamesAgainst) ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
  sorted.forEach((r, i) => (r.position = i + 1));
  return sorted;
}
