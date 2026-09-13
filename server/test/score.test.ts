import { describe, expect, it } from 'vitest';
import { formatSets, validateSets } from '../src/domain/score.ts';

describe('validateSets (best of 3, super tie-break as 3rd set)', () => {
  it('accepts 2-0 and 1-1 + super tie-break', () => {
    expect(validateSets([{ p1: 6, p2: 4 }, { p1: 7, p2: 5 }])).toBe('p1');
    expect(validateSets([{ p1: 2, p2: 6 }, { p1: 4, p2: 6 }])).toBe('p2');
    expect(validateSets([{ p1: 6, p2: 4 }, { p1: 3, p2: 6 }, { p1: 10, p2: 8 }])).toBe('p1');
    expect(validateSets([{ p1: 6, p2: 4 }, { p1: 3, p2: 6 }, { p1: 7, p2: 10 }])).toBe('p2');
  });
  it('rejects a super tie-break after 2-0, and a missing one after 1-1', () => {
    expect(() => validateSets([{ p1: 6, p2: 4 }, { p1: 6, p2: 4 }, { p1: 10, p2: 8 }])).toThrow(/2 sets a 0/);
    expect(() => validateSets([{ p1: 6, p2: 4 }, { p1: 4, p2: 6 }])).toThrow(/super tie-break/);
  });
  it('rejects tied sets, out-of-range games, and wrong set counts', () => {
    expect(() => validateSets([{ p1: 6, p2: 6 }, { p1: 6, p2: 4 }])).toThrow(/vencedor/);
    expect(() => validateSets([{ p1: 8, p2: 4 }, { p1: 6, p2: 4 }])).toThrow(/entre 0 e 7/);
    expect(() => validateSets([{ p1: 6, p2: 4 }])).toThrow(/melhor de 3/);
    expect(() => validateSets([])).toThrow(/melhor de 3/);
  });
  it('formats the super tie-break in brackets', () => {
    expect(formatSets([{ p1: 6, p2: 4 }, { p1: 3, p2: 6 }, { p1: 10, p2: 8 }])).toBe('6/4 3/6 [10/8]');
  });
});
