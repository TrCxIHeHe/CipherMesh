import type { AlphabetMappingItem } from '../../lib/api'

interface AlphabetVisualizerProps {
  mapping: AlphabetMappingItem[]
  activePlainChar?: string
  activeCipherChar?: string
  title?: string
}

export function AlphabetVisualizer({
  mapping,
  activePlainChar,
  activeCipherChar,
  title = 'Alphabet Mapping Table (A-Z Substitution)',
}: AlphabetVisualizerProps) {
  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">{title}</h4>
        <span className="text-[11px] text-muted">26 Alphabetic Positions (mod 26)</span>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[720px] gap-1">
          {mapping.map((m) => {
            const isActive =
              (activePlainChar && m.plain === activePlainChar.toUpperCase()) ||
              (activeCipherChar && m.cipher === activeCipherChar.toUpperCase())

            return (
              <div
                key={m.plain}
                className={`flex-1 rounded-md border p-1 text-center transition-all ${
                  isActive
                    ? 'border-accent bg-accent/20 ring-1 ring-accent'
                    : 'border-line/60 bg-bg/60 hover:border-accent/40'
                }`}
              >
                <div className="font-mono text-[10px] text-muted">{m.plain_index}</div>
                <div className="my-0.5 font-mono text-xs font-semibold text-ink">{m.plain}</div>
                <div className="h-px w-full bg-line/80 my-0.5" />
                <div className="my-0.5 font-mono text-xs font-semibold text-accent-2">{m.cipher}</div>
                <div className="font-mono text-[10px] text-muted">{m.cipher_index}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink" /> Plaintext letter (top)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-2" /> Ciphertext letter (bottom)
          </span>
        </div>
        <span>Formula: <code className="text-accent font-mono">C = (P + K) mod 26</code></span>
      </div>
    </div>
  )
}

