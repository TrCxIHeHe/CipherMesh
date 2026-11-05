import { useState } from 'react'

interface FrequencyChartProps {
  inputFreqs?: Record<string, number>
  outputFreqs?: Record<string, number>
  standardFreqs?: Record<string, number>
}

export function FrequencyChart({
  inputFreqs = {},
  outputFreqs = {},
  standardFreqs = {},
}: FrequencyChartProps) {
  const [showStandard, setShowStandard] = useState(true)
  const [showInput, setShowInput] = useState(true)
  const [showOutput, setShowOutput] = useState(true)
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null)

  const letters = Array.from({ length: 26 }, (_, i) => chr(ord('A') + i))
  function ord(c: string) { return c.charCodeAt(0) }
  function chr(n: number) { return String.fromCharCode(n) }

  const W = 720
  const H = 200
  const PAD_LEFT = 30
  const PAD_BOTTOM = 25
  const PAD_TOP = 15
  const PAD_RIGHT = 15
  const MAX_PCT = 15 // English max is ~13% for E

  const chartW = W - PAD_LEFT - PAD_RIGHT
  const chartH = H - PAD_TOP - PAD_BOTTOM
  const colW = chartW / 26
  const barW = Math.max(2, (colW - 3) / 3)

  const getY = (val: number) => {
    const clamped = Math.min(val, MAX_PCT)
    return PAD_TOP + chartH - (clamped / MAX_PCT) * chartH
  }

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Letter Frequency Analysis</h4>
          <p className="text-[11px] text-muted">Comparison against natural language English distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-[11px] transition-colors ${
              showInput ? 'bg-accent/15 text-accent border-accent/40' : 'text-muted/60 opacity-60'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-accent" /> Input
          </button>
          <button
            type="button"
            onClick={() => setShowOutput((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-[11px] transition-colors ${
              showOutput ? 'bg-teal/15 text-teal border-teal/40' : 'text-muted/60 opacity-60'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-teal" /> Output
          </button>
          <button
            type="button"
            onClick={() => setShowStandard((v) => !v)}
            className={`flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-[11px] transition-colors ${
              showStandard ? 'bg-warn/15 text-warn border-warn/40' : 'text-muted/60 opacity-60'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-warn" /> English Standard
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[600px]" role="img" aria-label="Frequency Chart">
          {/* Grid lines */}
          {[0, 5, 10, 15].map((level) => {
            const y = getY(level)
            return (
              <g key={level}>
                <line x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y} stroke="rgba(148,163,184,.12)" strokeWidth="1" />
                <text x={PAD_LEFT - 6} y={y + 3} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="monospace">
                  {level}%
                </text>
              </g>
            )
          })}

          {/* Letter columns */}
          {letters.map((letter, i) => {
            const colX = PAD_LEFT + i * colW
            const inVal = inputFreqs[letter] || 0
            const outVal = outputFreqs[letter] || 0
            const stdVal = standardFreqs[letter] || 0
            const isHovered = hoveredLetter === letter

            return (
              <g
                key={letter}
                onMouseEnter={() => setHoveredLetter(letter)}
                onMouseLeave={() => setHoveredLetter(null)}
                className="cursor-pointer"
              >
                {/* Highlight background on hover */}
                {isHovered && (
                  <rect
                    x={colX}
                    y={PAD_TOP}
                    width={colW}
                    height={chartH}
                    fill="rgba(56,189,248,0.06)"
                    rx="3"
                  />
                )}

                {/* Input bar */}
                {showInput && inVal > 0 && (
                  <rect
                    x={colX + 1}
                    y={getY(inVal)}
                    width={barW}
                    height={Math.max(1, PAD_TOP + chartH - getY(inVal))}
                    fill="#38bdf8"
                    rx="1"
                    opacity={isHovered ? 1 : 0.85}
                  />
                )}

                {/* Output bar */}
                {showOutput && outVal > 0 && (
                  <rect
                    x={colX + 1 + barW}
                    y={getY(outVal)}
                    width={barW}
                    height={Math.max(1, PAD_TOP + chartH - getY(outVal))}
                    fill="#2dd4bf"
                    rx="1"
                    opacity={isHovered ? 1 : 0.85}
                  />
                )}

                {/* Standard reference marker / bar */}
                {showStandard && stdVal > 0 && (
                  <rect
                    x={colX + 1 + barW * 2}
                    y={getY(stdVal)}
                    width={barW}
                    height={Math.max(1, PAD_TOP + chartH - getY(stdVal))}
                    fill="#fbbf24"
                    rx="1"
                    opacity={0.65}
                  />
                )}

                {/* X axis letter label */}
                <text
                  x={colX + colW / 2}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="monospace"
                  fill={isHovered ? '#38bdf8' : '#94a3b8'}
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {letter}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {hoveredLetter && (
        <div className="mt-2 flex items-center justify-between rounded-lg border border-line bg-bg/80 px-3 py-1.5 text-xs">
          <span className="font-mono font-semibold text-accent">Letter '{hoveredLetter}'</span>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="text-accent">Input: {(inputFreqs[hoveredLetter] || 0).toFixed(2)}%</span>
            <span className="text-teal">Output: {(outputFreqs[hoveredLetter] || 0).toFixed(2)}%</span>
            <span className="text-warn">Standard: {(standardFreqs[hoveredLetter] || 0).toFixed(2)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

