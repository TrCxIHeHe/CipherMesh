interface HighlightCoord {
  row: number
  col: number
  label?: string
  color?: 'accent' | 'teal' | 'warn' | 'ok'
}

interface MatrixVisualizerProps {
  matrix: (string | number)[][]
  title?: string
  subtitle?: string
  highlightCoords?: HighlightCoord[]
  onCellClick?: (row: number, col: number, val: string | number) => void
}

export function MatrixVisualizer({
  matrix,
  title = 'Key Matrix',
  subtitle,
  highlightCoords = [],
  onCellClick,
}: MatrixVisualizerProps) {
  if (!matrix || matrix.length === 0) return null

  const rows = matrix.length
  const cols = matrix[0].length

  const getHighlight = (r: number, c: number) =>
    highlightCoords.find((h) => h.row === r && h.col === c)

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</h4>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        <span className="font-mono text-[11px] text-accent">
          {rows}&times;{cols} Matrix
        </span>
      </div>

      <div className="flex justify-center p-2">
        <div className="inline-block rounded-xl border border-line bg-bg p-3 shadow-inner">
          <table className="border-collapse font-mono">
            <thead>
              <tr>
                <th className="p-1 text-[10px] text-muted"></th>
                {Array.from({ length: cols }, (_, c) => (
                  <th key={c} className="p-1 text-center text-[10px] text-muted/70">
                    C{c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, r) => (
                <tr key={r}>
                  <td className="p-1 pr-2 text-right text-[10px] text-muted/70">R{r}</td>
                  {row.map((val, c) => {
                    const h = getHighlight(r, c)
                    const colorClass = h?.color === 'teal'
                      ? 'border-teal bg-teal/20 text-teal ring-1 ring-teal'
                      : h?.color === 'warn'
                      ? 'border-warn bg-warn/20 text-warn ring-1 ring-warn'
                      : h
                      ? 'border-accent bg-accent/25 text-accent ring-1 ring-accent'
                      : 'border-line/40 bg-card/60 text-ink hover:border-accent/40'

                    return (
                      <td key={c} className="p-1">
                        <button
                          type="button"
                          onClick={() => onCellClick?.(r, c, val)}
                          className={`relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg border font-mono text-sm font-semibold transition-all ${colorClass}`}
                        >
                          <span>{val}</span>
                          {h?.label && (
                            <span className="absolute -top-1.5 -right-1.5 rounded bg-accent px-1 text-[8px] text-bg font-bold">
                              {h.label}
                            </span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

