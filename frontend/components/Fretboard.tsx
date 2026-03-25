import type { FretboardPosition } from "@/lib/types";

interface Props {
  positions: FretboardPosition[];
  fretRange?: [number, number];
}

const STRING_COUNT = 6;
const FRET_SPACING = 36;
const STRING_SPACING = 20;
const LEFT_MARGIN = 28;
const TOP_MARGIN = 16;
const CIRCLE_R = 8;

export default function Fretboard({ positions, fretRange = [0, 15] }: Props) {
  const [minFret, maxFret] = fretRange;
  const fretCount = maxFret - minFret + 1;
  const width = LEFT_MARGIN + fretCount * FRET_SPACING + 20;
  const height = TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING + TOP_MARGIN;

  function x(fret: number) {
    return LEFT_MARGIN + (fret - minFret) * FRET_SPACING + FRET_SPACING / 2;
  }
  function y(string: number) {
    // string 0 = low E (bottom), 5 = high e (top) — flip for visual
    return TOP_MARGIN + (STRING_COUNT - 1 - string) * STRING_SPACING;
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      aria-label="Fretboard diagram"
    >
      {/* Fret lines */}
      {Array.from({ length: fretCount + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={LEFT_MARGIN + i * FRET_SPACING}
          y1={TOP_MARGIN}
          x2={LEFT_MARGIN + i * FRET_SPACING}
          y2={TOP_MARGIN + (STRING_COUNT - 1) * STRING_SPACING}
          stroke="#3f3f46"
          strokeWidth={i === 0 ? 3 : 1}
        />
      ))}

      {/* String lines */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={LEFT_MARGIN}
          y1={y(i)}
          x2={LEFT_MARGIN + fretCount * FRET_SPACING}
          y2={y(i)}
          stroke="#52525b"
          strokeWidth={1}
        />
      ))}

      {/* Fret numbers */}
      {Array.from({ length: fretCount }, (_, i) => {
        const fret = minFret + i;
        if (fret % 3 !== 0 && fret !== 12) return null;
        return (
          <text
            key={`fret-num-${fret}`}
            x={x(fret)}
            y={height - 2}
            textAnchor="middle"
            fontSize="9"
            fill="#71717a"
          >
            {fret}
          </text>
        );
      })}

      {/* Note positions */}
      {positions.map((pos, idx) => (
        <g key={idx}>
          <circle
            className={pos.is_root ? "root-note" : "scale-note"}
            cx={x(pos.fret)}
            cy={y(pos.string)}
            r={CIRCLE_R}
            fill={pos.is_root ? "#f4f4f5" : "none"}
            stroke={pos.is_root ? "#f4f4f5" : "#a1a1aa"}
            strokeWidth={1.5}
          />
          <text
            x={x(pos.fret)}
            y={y(pos.string)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="8"
            fill={pos.is_root ? "#09090b" : "#a1a1aa"}
            style={{ pointerEvents: "none" }}
          >
            {pos.note}
          </text>
        </g>
      ))}
    </svg>
  );
}
