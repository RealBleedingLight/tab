"use client"
import type { FretPosition } from "@/lib/types"

interface Props {
  positions: FretPosition[]
  frets?: number
}

// Display order: high e on top (string index 5 → 0)
const DISPLAY_ORDER = [5, 4, 3, 2, 1, 0]
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"]

const FRET_W = 48
const STRING_H = 30
const LEFT = 28
const TOP = 16

export function FretboardDiagram({ positions, frets = 12 }: Props) {
  const width = LEFT + frets * FRET_W + FRET_W + 16
  const height = TOP + 5 * STRING_H + 32

  const posMap = new Map<string, FretPosition>()
  for (const p of positions) posMap.set(`${p.string}-${p.fret}`, p)

  return (
    <svg width={width} height={height} className="select-none overflow-visible">
      {/* Fret lines */}
      {Array.from({ length: frets + 1 }, (_, i) => {
        const x = LEFT + i * FRET_W + FRET_W / 2
        return (
          <line key={i}
            x1={x} y1={TOP}
            x2={x} y2={TOP + 5 * STRING_H}
            stroke={i === 0 ? "#a1a1aa" : "#3f3f46"}
            strokeWidth={i === 0 ? 2.5 : 1}
          />
        )
      })}

      {/* Fret markers (3, 5, 7, 9, 12) */}
      {[3, 5, 7, 9, 12].filter(f => f <= frets).map(f => (
        <text key={f}
          x={LEFT + f * FRET_W}
          y={height - 4}
          textAnchor="middle" fontSize={10} fill="#52525b">
          {f}
        </text>
      ))}

      {/* Strings */}
      {DISPLAY_ORDER.map((stringIdx, row) => {
        const y = TOP + row * STRING_H
        return (
          <g key={stringIdx}>
            <text x={LEFT - 8} y={y + 4}
              textAnchor="end" fontSize={11} fill="#71717a">
              {STRING_NAMES[stringIdx]}
            </text>
            <line
              x1={LEFT + FRET_W / 2} y1={y}
              x2={LEFT + frets * FRET_W + FRET_W / 2} y2={y}
              stroke="#3f3f46" strokeWidth={1}
            />
            {Array.from({ length: frets + 1 }, (_, fret) => {
              const pos = posMap.get(`${stringIdx}-${fret}`)
              if (!pos) return null
              const cx = LEFT + fret * FRET_W + FRET_W / 2
              return (
                <g key={fret}>
                  <circle cx={cx} cy={y} r={11}
                    fill={pos.is_root ? "#2563eb" : "#27272a"}
                    stroke={pos.is_root ? "#3b82f6" : "#71717a"}
                    strokeWidth={1.5}
                  />
                  {pos.is_root && (
                    <text x={cx} y={y + 4}
                      textAnchor="middle" fontSize={9}
                      fill="white" fontWeight="bold">
                      R
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}
    </svg>
  )
}
