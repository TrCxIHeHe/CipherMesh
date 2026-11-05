import { useLocation } from 'react-router-dom'
import { CheckCircle2, Hourglass } from 'lucide-react'
import { allLeaves } from '../data/nav'
import { DashboardCard, PageHeader, SecurityAlert } from '../components/ui'

const phaseName = { 1: 'Shell', 2: 'Cryptography foundation', 3: 'Trust and communication', 4: 'Protocol laboratories', 5: 'Analytics and documentation' } as const

/** Honest scaffold: the route and spec exist, the functionality does not yet. */
export default function PlannedPage() {
  const { pathname } = useLocation()
  const leaf = allLeaves.find(l => l.path === pathname)
  if (!leaf) return <SecurityAlert kind="warning" title="Page not found">That route does not exist in CipherMesh.</SecurityAlert>
  const Icon = leaf.icon
  return (
    <div>
      <PageHeader title={leaf.label} subtitle={leaf.summary} />
      <SecurityAlert kind="info" title={`Not yet implemented — scheduled for Phase ${leaf.phase} (${phaseName[leaf.phase]})`}>
        This page is routed and specified but contains no working functionality yet. It is deliberately not faked.
      </SecurityAlert>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <DashboardCard title="Planned scope" className="lg:col-span-2">
          <ul className="space-y-3">
            {leaf.scope.map(s => (
              <li key={s} className="flex items-start gap-3 text-sm"><Hourglass size={14} className="mt-0.5 text-muted" /><span>{s}</span></li>
            ))}
          </ul>
        </DashboardCard>
        <DashboardCard title="Status">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent"><Icon size={18} /></div>
            <div><p className="text-sm font-medium">Planned</p><p className="text-xs text-muted">Phase {leaf.phase}</p></div></div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted"><CheckCircle2 size={12} className="text-ok" />Route and navigation wired</p>
        </DashboardCard>
      </div>
    </div>
  )
}
