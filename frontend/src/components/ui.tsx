import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle, FlaskConical } from 'lucide-react'

export function StatusIndicator({ tone = 'ok', label }: { tone?: 'ok' | 'warn' | 'danger' | 'info'; label: string }) {
  const color = { ok: 'bg-ok', warn: 'bg-warn', danger: 'bg-danger', info: 'bg-accent' }[tone]
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted">
      <span className={`h-2 w-2 rounded-full ${color} pulse-dot`} />
      {label}
    </span>
  )
}

export function DemoBadge({ text = 'Demo data' }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-warn/30 bg-warn/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-warn">
      <FlaskConical size={10} /> {text}
    </span>
  )
}

export function DashboardCard({ title, action, children, className = '' }: {
  title?: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={`panel p-5 ${className}`}>
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">{title}</h3>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

const alertStyles = {
  info: { c: 'border-accent/30 bg-accent/5 text-accent', i: Info },
  success: { c: 'border-ok/30 bg-ok/5 text-ok', i: CheckCircle2 },
  warning: { c: 'border-warn/30 bg-warn/5 text-warn', i: AlertTriangle },
  danger: { c: 'border-danger/30 bg-danger/5 text-danger', i: XCircle },
}
export function SecurityAlert({ kind = 'info', title, children }: {
  kind?: keyof typeof alertStyles; title: string; children?: ReactNode
}) {
  const { c, i: Icon } = alertStyles[kind]
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${c}`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      </div>
    </div>
  )
}

export function CodeBlock({ children }: { children: ReactNode }) {
  return <pre className="overflow-x-auto rounded-lg border border-line bg-bg p-3 font-mono text-xs leading-relaxed text-accent-2">{children}</pre>
}
