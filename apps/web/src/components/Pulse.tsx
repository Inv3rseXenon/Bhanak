/**
 * The brand's heartbeat line: a calm line, a small orange bump (the first hint), and much later
 * the big spike. Decorative on the landing page; functional as the progress meter in the intake.
 */

/** Large line for the landing page. Draws itself once; static when motion is reduced. */
export function PulseHero() {
  return (
    <svg
      className="pulse-hero"
      viewBox="0 14 640 124"
      preserveAspectRatio="xMinYMid meet"
      aria-hidden="true"
      focusable="false"
    >
      <path className="pulse-draw pulse-a" pathLength="1" d="M0 82H104" />
      <path className="pulse-draw pulse-hint" pathLength="1" d="M104 82q12-26 28-26t28 26" />
      <path
        className="pulse-draw pulse-b"
        pathLength="1"
        d="M160 82H322l12-2 11-58 17 112 14-84 9 32H640"
      />
      <circle className="pulse-dot" cx="132" cy="56" r="7" />
    </svg>
  );
}

const BEATS = 6;
const WIDTH = 300;

/** A line with beats along it; the part up to `value / max` is drawn in teal. */
export function PulseProgress({ value, max }: { value: number; max: number }) {
  const fraction = Math.min(1, Math.max(0, value / max));
  const x = Math.round(fraction * WIDTH);
  let d = 'M0 16';
  for (let i = 0; i < BEATS; i += 1) {
    const start = Math.round((i + 0.45) * (WIDTH / BEATS));
    d += `H${String(start)}l3-3 4 14 4-17 3 6`;
  }
  d += `H${String(WIDTH)}`;
  return (
    <svg
      className="pulse-progress"
      viewBox={`0 0 ${String(WIDTH)} 32`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id="pulse-done">
          <rect x="0" y="0" width={x} height="32" />
        </clipPath>
      </defs>
      <path d={d} className="pulse-track" />
      <path d={d} className="pulse-done" clipPath="url(#pulse-done)" />
    </svg>
  );
}
