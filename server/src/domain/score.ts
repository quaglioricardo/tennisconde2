import type { SetScore } from '../../../shared/types.ts';

export const MAX_SET_GAMES = 7;
export const MAX_TIEBREAK_POINTS = 30;

export class ScoreError extends Error {}

const setWinner = (s: SetScore): 'p1' | 'p2' => (s.p1 > s.p2 ? 'p1' : 'p2');

function checkGames(s: SetScore, max: number, what: string) {
  if (!Number.isInteger(s.p1) || !Number.isInteger(s.p2) || s.p1 < 0 || s.p2 < 0 || s.p1 > max || s.p2 > max) {
    throw new ScoreError(`${what}: valores devem ser inteiros entre 0 e ${max}`);
  }
  if (s.p1 === s.p2) throw new ScoreError(`${what}: precisa ter um vencedor`);
}

/**
 * Best of 3: two sets, or two split sets decided by a super tie-break (10 points, listed as the 3rd set).
 * Returns which side won ('p1' | 'p2').
 */
export function validateSets(sets: SetScore[]): 'p1' | 'p2' {
  if (!Array.isArray(sets) || sets.length < 2 || sets.length > 3) {
    throw new ScoreError('O placar é melhor de 3: dois sets, ou dois sets e um super tie-break');
  }
  checkGames(sets[0], MAX_SET_GAMES, '1º set');
  checkGames(sets[1], MAX_SET_GAMES, '2º set');
  const w1 = setWinner(sets[0]);
  const w2 = setWinner(sets[1]);
  if (w1 === w2) {
    if (sets.length === 3) throw new ScoreError('Com 2 sets a 0 não há super tie-break');
    return w1;
  }
  if (sets.length !== 3) throw new ScoreError('Sets empatados em 1 a 1: informe o super tie-break');
  checkGames(sets[2], MAX_TIEBREAK_POINTS, 'Super tie-break');
  return setWinner(sets[2]);
}

export function formatSets(sets: SetScore[] | null): string {
  if (!sets) return '';
  return sets.map((s, i) => (i === 2 ? `[${s.p1}/${s.p2}]` : `${s.p1}/${s.p2}`)).join(' ');
}
