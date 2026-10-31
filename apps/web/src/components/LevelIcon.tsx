import type { Level } from '@bhanak/triage-engine';

/** Shape plus colour plus a text label: the level is never conveyed by colour alone (spec 6). */
export function LevelIcon({ level }: { level: Level }) {
  const common = {
    width: 36,
    height: 36,
    viewBox: '0 0 36 36',
    'aria-hidden': true,
    focusable: false,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 3,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  } as const;
  switch (level) {
    case 'EMERGENCY_NOW':
      return (
        <svg {...common}>
          <path d="M18 4 33 31H3Z" />
          <path d="M18 14v8M18 26.5v.5" />
        </svg>
      );
    case 'SEE_DOCTOR_TODAY':
      return (
        <svg {...common}>
          <circle cx="18" cy="18" r="14" />
          <path d="M18 9v9l6 4" />
        </svg>
      );
    case 'TEST_AND_MONITOR':
      return (
        <svg {...common}>
          <circle cx="15" cy="15" r="9" />
          <path d="m22 22 10 10" />
        </svg>
      );
    case 'HOME_CARE_WITH_TRIGGERS':
      return (
        <svg {...common}>
          <path d="M4 17 18 5l14 12M8 15v16h20V15" />
        </svg>
      );
  }
}
