import { memo } from "react";
import type { FretboardPosition } from "@/lib/engine";

export interface ActiveFret {
  /** 0 = lowest string (same convention as FretboardPosition). */
  string: number;
  fret: number;
}

interface Props {
  positions: FretboardPosition[];
  fretRange?: [number, number];
  /** Notes sounding right now (e.g. during playback). */
  active?: ActiveFret[];
  stringCount?: number;
  /** Open-string names, low → high, drawn at the nut. */
  tuning?: string[];
  compact?: boolean;
  className?: string;
}

const FRET_SPACING = 36;
const LEFT_MARGIN = 28;
const TOP_MARGIN = 14;
const CIRCLE_R = 8;
const INLAYS = new Set([3, 5, 7, 9, 15, 17, 19, 21]);

function Fretboard({ positions, fretRange = [0, 15], active = [], stringCount = 6, tuning, compact, className = "w-full" }: Props) {
  const [minFret, maxFret] = fretRange;
  const stringSpacing = compact ? 16 : 20;
  const fretCount = maxFret - minFret + 1;
  const width = LEFT_MARGIN + fretCount * FRET_SPACING + 12;
  const boardHeight = (stringCount - 1) * stringSpacing;
  const height = TOP_MARGIN + boardHeight + 18;

  const x = (fret: number) => LEFT_MARGIN + (fret - minFret) * FRET_SPACING + FRET_SPACING / 2;
  // string 0 = lowest (drawn at the bottom, like looking down at the guitar)
  const y = (s: number) => TOP_MARGIN + (stringCount - 1 - s) * stringSpacing;
  const activeKeys = new Set(active.map(a => `${a.string}:${a.fret}`));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={`${className} select-none`} role="img" aria-label="Fretboard diagram">
      {/* Inlays */}
      {Array.from({ length: fretCount }, (_, i) => {
        const fret = minFret + i;
        if (fret === 0) return null;
        const cy = TOP_MARGIN + boardHeight / 2;
        if (fret % 12 === 0) {
          return (
            <g key={`inlay-${fret}`} fill="#27272a">
              <circle cx={x(fret)} cy={cy - stringSpacing} r={4} />
              <circle cx={x(fret)} cy={cy + stringSpacing} r={4} />
            </g>
          );
        }
        return INLAYS.has(fret) ? (
          <circle key={`inlay-${fret}`} cx={x(fret)} cy={cy} r={4} fill="#27272a" />
        ) : null;
      })}

      {/* Fret wires */}
      {Array.from({ length: fretCount + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={LEFT_MARGIN + i * FRET_SPACING} y1={TOP_MARGIN}
          x2={LEFT_MARGIN + i * FRET_SPACING} y2={TOP_MARGIN + boardHeight}
          stroke={i === 0 && minFret === 0 ? "#a1a1aa" : "#3f3f46"}
          strokeWidth={i === 0 && minFret === 0 ? 4 : 1}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: stringCount }, (_, i) => (
        <g key={`string-${i}`}>
          <line
            x1={LEFT_MARGIN} y1={y(i)}
            x2={LEFT_MARGIN + fretCount * FRET_SPACING} y2={y(i)}
            stroke="#52525b" strokeWidth={i < stringCount / 2 ? 1.6 : 1}
          />
          {tuning?.[i] && (
            <text x={10} y={y(i)} dominantBaseline="central" textAnchor="middle" fontSize="9" fill="#71717a">
              {tuning[i]}
            </text>
          )}
        </g>
      ))}

      {/* Fret numbers */}
      {Array.from({ length: fretCount }, (_, i) => {
        const fret = minFret + i;
        if (!(INLAYS.has(fret) || fret % 12 === 0 || fret === minFret)) return null;
        return (
          <text key={`fret-num-${fret}`} x={x(fret)} y={height - 3} textAnchor="middle" fontSize="9" fill="#71717a">
            {fret}
          </text>
        );
      })}

      {/* Scale / note map */}
      {positions.map((pos, idx) => {
        const on = activeKeys.has(`${pos.string}:${pos.fret}`);
        return (
          <g key={idx}>
            <circle
              className={pos.isRoot ? "root-note" : "scale-note"}
              cx={x(pos.fret)} cy={y(pos.string)} r={CIRCLE_R}
              fill={on ? "#f59e0b" : pos.isRoot ? "#f4f4f5" : "#18181b"}
              stroke={on ? "#fbbf24" : pos.isRoot ? "#f4f4f5" : "#71717a"}
              strokeWidth={1.5}
            />
            <text
              x={x(pos.fret)} y={y(pos.string)}
              textAnchor="middle" dominantBaseline="central" fontSize="8"
              fill={on || pos.isRoot ? "#09090b" : "#d4d4d8"}
              style={{ pointerEvents: "none" }}
            >
              {pos.note}
            </text>
          </g>
        );
      })}

      {/* Active notes that aren't part of the map (outside notes) */}
      {active
        .filter(a => !positions.some(p => p.string === a.string && p.fret === a.fret))
        .filter(a => a.fret >= minFret && a.fret <= maxFret)
        .map(a => (
          <circle
            key={`active-${a.string}-${a.fret}`}
            cx={x(a.fret)} cy={y(a.string)} r={CIRCLE_R}
            fill="#f59e0b" stroke="#fbbf24" strokeWidth={1.5}
          />
        ))}
    </svg>
  );
}

export default memo(Fretboard);
