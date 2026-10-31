/**
 * Original illustrations of an Indian city hospital: a trilingual-signboard kind of place with a
 * 108 ambulance, a black-and-yellow auto-rickshaw, a neem tree and a family walking to the
 * entrance. Drawn as SVG, so there is nothing to download, no licence to track and no image
 * request. The sun is the brand's orange "hint".
 *
 * To use real photographs instead, put licensed files in apps/web/public/photos and swap the
 * scene for an <img> in Landing.tsx and Wizard.tsx (see docs/runbooks/tester-deploy.md).
 */
import { memo } from 'react';

const INK = '#0F2229';
const TEAL = '#0A6B66';
const TEAL_DEEP = '#064B47';
const HINT = '#B54708';
const SLATE = '#2F4858';
const GLASS = '#7DBDB8';
const KERB = '#C3D1D3';

function Tree({ x, scale = 1 }: { x: number; scale?: number }) {
  return (
    <g transform={`translate(${String(x)} 500) scale(${String(scale)})`}>
      <rect x="-7" y="-90" width="14" height="92" rx="4" fill="#6B4A33" />
      <circle cx="0" cy="-120" r="52" fill="#2F7D5B" />
      <circle cx="-38" cy="-92" r="34" fill="#2F7D5B" />
      <circle cx="40" cy="-94" r="36" fill="#2F7D5B" />
      <circle cx="-14" cy="-140" r="30" fill="#3E9470" />
      <circle cx="26" cy="-118" r="22" fill="#3E9470" />
    </g>
  );
}

function Person({
  x,
  height,
  cloth,
  skin,
  stick = false,
}: {
  x: number;
  height: number;
  cloth: string;
  skin: string;
  stick?: boolean;
}) {
  const top = 500 - height;
  return (
    <g>
      <rect x={x - 6} y={500 - height * 0.34} width="5" height={height * 0.34} rx="2" fill={INK} />
      <rect x={x + 1} y={500 - height * 0.34} width="5" height={height * 0.34} rx="2" fill={INK} />
      <path
        d={`M${String(x - 11)} ${String(top + height * 0.66)} q0 -${String(height * 0.5)} 11 -${String(height * 0.5)} t11 ${String(height * 0.5)}z`}
        fill={cloth}
      />
      <circle cx={x} cy={top + 9} r={height > 40 ? 9 : 7} fill={skin} />
      <path d={`M${String(x - 9)} ${String(top + 8)} q9 -14 18 0 q-9 -4 -18 0z`} fill={INK} />
      {stick ? (
        <rect
          x={x + 12}
          y={top + height * 0.4}
          width="3"
          height={height * 0.62}
          rx="1.500"
          fill="#6B4A33"
        />
      ) : null}
    </g>
  );
}

/** The shared artwork, drawn once in a 1440 x 640 space. Callers choose what part to show. */
function HospitalArt() {
  const skyline = [
    [20, 90, 150],
    [120, 70, 210],
    [200, 80, 120],
    [300, 60, 260],
    [380, 90, 170],
    [490, 70, 220],
    [580, 80, 140],
    [670, 70, 190],
  ] as const;
  const dashes = Array.from({ length: 13 }, (_, i) => i * 120 + 20);
  return (
    <>
      {/* sun: the brand's hint orange */}
      <circle cx="1250" cy="96" r="66" fill={HINT} opacity="0.14" />
      <circle cx="1250" cy="96" r="34" fill={HINT} />

      {/* city behind */}
      {skyline.map(([x, w, h]) => (
        <rect key={x} x={x} y={500 - h} width={w} height={h} rx="3" fill="#A9D0CA" opacity="0.6" />
      ))}

      {/* hospital */}
      <rect x="840" y="262" width="92" height="238" fill="#E7F0EE" />
      <rect x="1188" y="262" width="92" height="238" fill="#E7F0EE" />
      <rect x="930" y="150" width="260" height="350" fill="#FFFFFF" />
      <rect x="1190" y="150" width="6" height="350" fill="#D4E3E0" />
      <rect x="920" y="142" width="280" height="14" rx="4" fill={TEAL_DEEP} />
      <rect x="830" y="254" width="112" height="12" rx="4" fill={TEAL_DEEP} />
      <rect x="1178" y="254" width="112" height="12" rx="4" fill={TEAL_DEEP} />
      <circle cx="1060" cy="104" r="38" fill={TEAL} />
      <path d="M1048 104h24M1060 92v24" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
      <rect x="930" y="170" width="260" height="42" fill={TEAL_DEEP} />
      <path
        d="M946 192h44l8-12 10 24 10-12h34"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="1140" cy="188" r="7" fill={HINT} />
      {[230, 290, 350].flatMap((y, row) =>
        [950, 998, 1046, 1094, 1142].map((x, col) => (
          <rect
            key={`${String(x)}-${String(y)}`}
            x={x}
            y={y}
            width="32"
            height="38"
            rx="5"
            fill={(row * 5 + col) % 4 === 1 ? '#FFD79A' : '#CFE7E3'}
          />
        )),
      )}
      {[290, 350, 410].flatMap((y) =>
        [858, 894, 1210, 1246].map((x) => (
          <rect
            key={`w${String(x)}-${String(y)}`}
            x={x}
            y={y}
            width="26"
            height="34"
            rx="4"
            fill="#CFE7E3"
          />
        )),
      )}
      <rect x="1000" y="398" width="120" height="16" rx="3" fill={HINT} />
      <rect x="1006" y="414" width="6" height="86" fill={KERB} />
      <rect x="1108" y="414" width="6" height="86" fill={KERB} />
      <rect x="1018" y="414" width="84" height="86" rx="4" fill="#1F4B52" />
      <rect x="1023" y="420" width="35" height="80" fill={GLASS} />
      <rect x="1062" y="420" width="35" height="80" fill={GLASS} />
      <rect x="994" y="496" width="132" height="8" fill={KERB} />

      {/* trees */}
      <Tree x={770} scale={0.9} />
      <Tree x={1352} />
      <Tree x={70} scale={1.1} />

      {/* footpath and road */}
      <rect x="0" y="500" width="1440" height="22" fill="#DCE6E5" />
      <rect x="0" y="522" width="1440" height="118" fill={SLATE} />
      {dashes.map((x) => (
        <rect key={x} x={x} y="584" width="60" height="6" rx="3" fill="#EAF1F0" />
      ))}

      {/* 108 ambulance, facing the hospital */}
      <g transform="translate(420 0)">
        <rect x="320" y="508" width="180" height="76" rx="8" fill="#fff" />
        <path d="M500 528h34l26 24v32h-60z" fill="#fff" />
        <path d="M508 536h22l18 16h-40z" fill={GLASS} />
        <rect x="320" y="556" width="240" height="10" fill={TEAL} />
        <rect x="396" y="498" width="44" height="10" rx="3" fill={TEAL} />
        <rect x="408" y="492" width="20" height="7" rx="3" fill={HINT} />
        <text
          x="352"
          y="546"
          fontSize="30"
          fontWeight="800"
          fill={TEAL_DEEP}
          fontFamily="system-ui, sans-serif"
        >
          108
        </text>
        <circle cx="464" cy="540" r="13" fill={TEAL} />
        <path d="M457 540h14M464 533v14" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        <circle cx="370" cy="586" r="18" fill="#1B2A30" />
        <circle cx="370" cy="586" r="7" fill={KERB} />
        <circle cx="524" cy="586" r="18" fill="#1B2A30" />
        <circle cx="524" cy="586" r="7" fill={KERB} />
      </g>

      {/* a black-and-yellow auto-rickshaw */}
      <g transform="translate(560 0)">
        <path d="M650 532q8-34 62-34h42q16 0 26 34z" fill="#F2B705" />
        <path d="M650 532h128v46h-128z" fill="#1B1B1B" />
        <path d="M778 532l22 20v26h-22z" fill="#1B1B1B" />
        <rect x="668" y="540" width="76" height="26" rx="4" fill={SLATE} />
        <circle cx="798" cy="558" r="5" fill="#FFE08A" />
        <circle cx="690" cy="590" r="16" fill="#1B2A30" />
        <circle cx="690" cy="590" r="6" fill={KERB} />
        <circle cx="786" cy="592" r="14" fill="#1B2A30" />
        <circle cx="786" cy="592" r="5" fill={KERB} />
      </g>

      {/* a family walking to the entrance */}
      <Person x={928} height={74} cloth={TEAL} skin="#C68E64" />
      <Person x={960} height={44} cloth={HINT} skin="#D9A57C" />
      <Person x={992} height={70} cloth="#E9D9B7" skin="#A9714B" stick />
    </>
  );
}

/** Wide hero scene: fills its box, anchored to the bottom right. */
export const HospitalScene = memo(function HospitalScene() {
  return (
    <svg
      className="scene"
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMaxYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <HospitalArt />
    </svg>
  );
});

/** Close crop of the entrance: for "where to go" and beside the questions. */
export const EntranceScene = memo(function EntranceScene() {
  return (
    <svg
      className="scene scene-framed"
      viewBox="840 250 480 390"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <HospitalArt />
    </svg>
  );
});
