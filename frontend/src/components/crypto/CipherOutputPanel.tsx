import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

interface CipherOutputPanelProps {
  output: string
  label?: string
  operation?: 'encryption' | 'decryption'
  hex?: string
  binary?: string
  auxInfo?: string
}

export function CipherOutputPanel({
  output,
  label = 'Cipher Output',
  operation = 'encryption',
  hex,
  binary,
  auxInfo,
}: CipherOutputPanelProps) {
  const [copied, setCopied] = useState(false)
  const [format, setFormat] = useState<'text' | 'hex' | 'binary'>('text')

  const copyToClipboard = () => {
    const textToCopy = format === 'hex' && hex ? hex : format === 'binary' && binary ? binary : output
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayedContent =
    format === 'hex' && hex ? hex : format === 'binary' && binary ? binary : output

  return (
    <div className="rounded-xl border border-line bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-line bg-elevated/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-accent" />
          <span className="text-xs font-semibold uppercase tracking-wider text-ink">{label}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider ${
              operation === 'encryption'
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-teal/15 text-teal border border-teal/30'
            }`}
          >
            {operation}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {(hex || binary) && (
            <div className="flex rounded-md border border-line bg-bg p-0.5 text-[11px]">
              <button
                onClick={() => setFormat('text')}
                className={`rounded px-2 py-0.5 transition-colors ${
                  format === 'text' ? 'bg-accent/20 text-accent font-medium' : 'text-muted hover:text-ink'
                }`}
              >
                Text
              </button>
              {hex && (
                <button
                  onClick={() => setFormat('hex')}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    format === 'hex' ? 'bg-accent/20 text-accent font-medium' : 'text-muted hover:text-ink'
                  }`}
                >
                  HEX
                </button>
              )}
              {binary && (
                <button
                  onClick={() => setFormat('binary')}
                  className={`rounded px-2 py-0.5 transition-colors ${
                    format === 'binary' ? 'bg-accent/20 text-accent font-medium' : 'text-muted hover:text-ink'
                  }`}
                >
                  BIN
                </button>
              )}
            </div>
          )}
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 rounded-md border border-line bg-card px-2.5 py-1 text-xs text-muted hover:border-accent/40 hover:text-ink transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check size={12} className="text-ok" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      <div className="p-4">
        <pre className="min-h-[4rem] max-h-48 overflow-auto rounded-lg border border-line/80 bg-bg p-3.5 font-mono text-sm leading-relaxed text-accent-2 select-all break-all whitespace-pre-wrap">
          {displayedContent || <span className="text-muted/50 italic">Execute an operation to generate output...</span>}
        </pre>
        <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted">
          <span>
            Length: <strong className="font-mono text-ink">{output.length}</strong> chars
            {hex && (
              <>
                {' '}&bull; Bytes: <strong className="font-mono text-ink">{hex.length / 2}</strong>
              </>
            )}
          </span>
          {auxInfo && <span>{auxInfo}</span>}
        </div>
      </div>
    </div>
  )
}

