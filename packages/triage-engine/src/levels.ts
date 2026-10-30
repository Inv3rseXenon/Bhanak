import { LEVELS, type Level } from './types.js';

export const levelRank = (level: Level): number => LEVELS.indexOf(level);

/** Ranks outside 0..3 are clamped, so callers can add steps without bounds checks. */
export function levelFromRank(rank: number): Level {
  return LEVELS[Math.max(0, Math.min(LEVELS.length - 1, rank)) as 0 | 1 | 2 | 3];
}

export const maxLevel = (a: Level, b: Level): Level => (levelRank(a) >= levelRank(b) ? a : b);
