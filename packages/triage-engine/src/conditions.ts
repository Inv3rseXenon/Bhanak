import { flagValue, thresholdValue, triRef, type Ctx } from './ctx.js';
import type { Cmp, Condition, DangerSign } from './types.js';

type Handlers = {
  [K in Condition['op']]: (condition: Extract<Condition, { op: K }>, ctx: Ctx) => boolean;
};

const COMPARATORS: Record<Cmp, (left: number, right: number) => boolean> = {
  lt: (left, right) => left < right,
  lte: (left, right) => left <= right,
  gt: (left, right) => left > right,
  gte: (left, right) => left >= right,
  eq: (left, right) => left === right,
};

/** The number a comparison uses: a literal, else a named threshold. null = not decided. */
export function operand(
  source: { threshold?: string | undefined; value?: number | undefined },
  ctx: Ctx,
): number | null {
  if (source.value !== undefined) return source.value;
  return source.threshold === undefined ? null : thresholdValue(ctx.protocol, source.threshold);
}

/** A missing field or an undecided threshold never satisfies a comparison. */
export function compareField(
  field: string,
  cmp: Cmp,
  source: { threshold?: string | undefined; value?: number | undefined },
  ctx: Ctx,
): boolean {
  const left = ctx.num.get(field);
  const right = operand(source, ctx);
  return left !== undefined && right !== null && COMPARATORS[cmp](left, right);
}

const HANDLERS: Handlers = {
  all: (c, ctx) => c.of.every((child) => evaluateCondition(child, ctx)),
  any: (c, ctx) => c.of.some((child) => evaluateCondition(child, ctx)),
  not: (c, ctx) => !evaluateCondition(c.of, ctx),
  tri: (c, ctx) => triRef(ctx, c.ref) === c.is,
  num: (c, ctx) => compareField(c.field, c.cmp, c, ctx),
  flag: (c, ctx) => flagValue(ctx, c.name),
  trend: (c, ctx) => {
    const pair = ctx.trends.get(c.field);
    if (pair === undefined) return false;
    const directionMatches =
      c.dir === 'rising' ? pair.current > pair.previous : pair.current < pair.previous;
    if (!directionMatches || c.minRelativeChange === undefined) return directionMatches;
    const minimum = thresholdValue(ctx.protocol, c.minRelativeChange);
    return minimum !== null && Math.abs(pair.current - pair.previous) >= minimum * pair.previous;
  },
};

export function evaluateCondition(condition: Condition, ctx: Ctx): boolean {
  const handler = HANDLERS[condition.op] as (c: Condition, ctx: Ctx) => boolean;
  return handler(condition, ctx);
}

export type SignState = 'PRESENT' | 'ABSENT' | 'UNKNOWN';

/** Is this danger sign present, absent, or unanswered? Unanswered is never treated as absent. */
export function signState(sign: DangerSign, ctx: Ctx): SignState {
  const state = rawSignState(sign, ctx);
  // A question that does not apply (e.g. periods for a male patient) may be skipped when
  // unanswered, but a stated danger answer is never ignored.
  const applicable =
    sign.applicableWhen === undefined || evaluateCondition(sign.applicableWhen, ctx);
  return state === 'UNKNOWN' && !applicable ? 'ABSENT' : state;
}

function rawSignState(sign: DangerSign, ctx: Ctx): SignState {
  const test = sign.test;
  if (test.kind === 'tri') {
    const answer = triRef(ctx, test.ref);
    if (answer === 'UNKNOWN') return 'UNKNOWN';
    return answer === test.is ? 'PRESENT' : 'ABSENT';
  }
  if (!ctx.num.has(test.field)) return 'UNKNOWN';
  return compareField(test.field, test.cmp, test, ctx) ? 'PRESENT' : 'ABSENT';
}
