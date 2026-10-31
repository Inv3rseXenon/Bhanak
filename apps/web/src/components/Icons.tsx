/** Small inline icons (no icon font, no network). All decorative: the text carries the meaning. */
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
} as const;

export const PhoneIcon = () => (
  <svg {...base}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
);

export const PinIcon = () => (
  <svg {...base}>
    <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const BackIcon = () => (
  <svg {...base}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const ShareIcon = () => (
  <svg {...base}>
    <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
  </svg>
);

export const RestartIcon = () => (
  <svg {...base}>
    <path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4" />
  </svg>
);

export const ForwardIcon = () => (
  <svg {...base}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...base}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const FamilyIcon = () => (
  <svg {...base}>
    <circle cx="9" cy="8" r="3" />
    <circle cx="17" cy="9.5" r="2.2" />
    <path d="M3 19a6 6 0 0 1 12 0M15 19a4 4 0 0 1 6 0" />
  </svg>
);

export const ShieldIcon = () => (
  <svg {...base}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6l-7-3Z" />
    <path d="M12 9v6M9 12h6" />
  </svg>
);

export const WordsIcon = () => (
  <svg {...base}>
    <path d="M4 6h16v10H9l-5 4V6Z" />
    <path d="M8 10h8M8 13h5" />
  </svg>
);

export const LockIcon = () => (
  <svg {...base}>
    <rect x="5" y="10.500" width="14" height="10" rx="2" />
    <path d="M8 10.500V8a4 4 0 0 1 8 0v2.500" />
  </svg>
);
