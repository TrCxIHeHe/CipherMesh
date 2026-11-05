import { Key, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react'

interface KeyDisplayProps {
  keyValue: string
  onChange: (val: string) => void
  label?: string
  placeholder?: string
  onGenerateRandom?: () => void
  generating?: boolean
  validationMessage?: string | null
  isValid?: boolean
  description?: string
  maxLength?: number
}

export function KeyDisplay({
  keyValue,
  onChange,
  label = 'Secret Key',
  placeholder = 'Enter key...',
  onGenerateRandom,
  generating = false,
  validationMessage,
  isValid = true,
  description,
  maxLength,
}: KeyDisplayProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-1.5 font-medium text-ink">
          <Key size={13} className="text-accent" />
          <span>{label}</span>
        </label>
        {onGenerateRandom && (
          <button
            type="button"
            onClick={onGenerateRandom}
            disabled={generating}
            className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={11} className={generating ? 'animate-spin' : ''} />
            <span>Generate Random Key</span>
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={keyValue}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-bg px-3.5 py-2 font-mono text-sm tracking-wider text-ink outline-none transition-colors placeholder:text-muted/50 ${
            isValid
              ? 'border-line focus:border-accent/60'
              : 'border-danger/60 focus:border-danger'
          }`}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-muted">
          {validationMessage ? (
            <span
              className={`flex items-center gap-1 text-[11px] ${
                isValid ? 'text-ok' : 'text-danger'
              }`}
            >
              {isValid ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              <span>{validationMessage}</span>
            </span>
          ) : (
            <span className="font-mono text-[11px]">{keyValue.length} chars</span>
          )}
        </div>
      </div>

      {description && <p className="text-[11px] text-muted">{description}</p>}
    </div>
  )
}

