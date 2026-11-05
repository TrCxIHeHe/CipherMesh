import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Bell, ChevronDown, ChevronLeft, ChevronRight, Search, ShieldHalf, User, LogOut, ChevronRight as Crumb } from 'lucide-react'
import { allLeaves, docsItem, groups, overview, settingsItem, type NavLeaf } from '../data/nav'
import { StatusIndicator } from './ui'

function itemClass(active: boolean, collapsed: boolean) {
  return `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${collapsed ? 'justify-center' : ''} ${
    active ? 'bg-accent/10 text-accent shadow-[inset_2px_0_0_var(--color-accent)]' : 'text-muted hover:bg-elevated/60 hover:text-ink'
  }`
}

function SideLink({ leaf, collapsed, end }: { leaf: NavLeaf; collapsed: boolean; end?: boolean }) {
  const Icon = leaf.icon
  return (
    <NavLink to={leaf.path} end={end} title={collapsed ? leaf.label : undefined}
      className={({ isActive }) => itemClass(isActive, collapsed)}>
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{leaf.label}</span>}
    </NavLink>
  )
}

function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const isOpen = (label: string, items: NavLeaf[]) =>
    open[label] ?? items.some(i => pathname.startsWith(i.path))

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-line bg-bg-2 transition-[width] duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex h-16 items-center gap-3 border-b border-line px-4">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-accent to-teal text-bg">
          <ShieldHalf size={20} />
        </div>
        {!collapsed && (
          <div className="leading-tight">
            <p className="text-sm font-semibold">CipherMesh</p>
            <p className="text-[10px] uppercase tracking-widest text-muted">CNS Workbench</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <SideLink leaf={overview} collapsed={collapsed} end />
        {groups.map(g => {
          const GIcon = g.icon
          const expanded = isOpen(g.label, g.items)
          if (collapsed) {
            return (
              <div key={g.label} className="space-y-1 pt-2">
                {g.items.slice(0, 1).map(i => (
                  <NavLink key={i.path} to={i.path} title={g.label}
                    className={() => itemClass(g.items.some(x => pathname.startsWith(x.path)), true)}>
                    <GIcon size={16} />
                  </NavLink>
                ))}
              </div>
            )
          }
          return (
            <div key={g.label} className="pt-2">
              <button onClick={() => setOpen(o => ({ ...o, [g.label]: !expanded }))}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-ink">
                <GIcon size={14} />
                <span className="flex-1 text-left">{g.label}</span>
                <ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
              </button>
              {expanded && <div className="ml-2 space-y-0.5 border-l border-line pl-2">
                {g.items.map(i => <SideLink key={i.path} leaf={i} collapsed={false} />)}
              </div>}
            </div>
          )
        })}
        <div className="space-y-1 pt-3">
          <SideLink leaf={docsItem} collapsed={collapsed} />
          <SideLink leaf={settingsItem} collapsed={collapsed} />
        </div>
      </nav>
      <button onClick={onToggle} className="flex h-12 items-center justify-center border-t border-line text-muted hover:text-ink"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="ml-2 text-xs">Collapse</span></>}
      </button>
    </aside>
  )
}

function Breadcrumbs() {
  const { pathname } = useLocation()
  const leaf = allLeaves.find(l => l.path === pathname)
  const group = groups.find(g => g.items.some(i => i.path === pathname))
  const parts = [{ label: 'CipherMesh', to: '/' }, ...(group ? [{ label: group.label, to: group.items[0].path }] : []), ...(leaf && leaf.path !== '/' ? [{ label: leaf.label, to: leaf.path }] : [])]
  return (
    <ol className="flex items-center gap-1.5 text-sm text-muted">
      {parts.map((p, i) => (
        <li key={p.to + i} className="flex items-center gap-1.5">
          {i > 0 && <Crumb size={12} />}
          {i === parts.length - 1 ? <span className="text-ink">{p.label}</span> : <Link to={p.to} className="hover:text-ink">{p.label}</Link>}
        </li>
      ))}
    </ol>
  )
}

function SearchBox() {
  const [q, setQ] = useState('')
  const [focus, setFocus] = useState(false)
  const nav = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  const results = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return []
    return allLeaves.filter(l => l.label.toLowerCase().includes(t) || l.summary.toLowerCase().includes(t)).slice(0, 7)
  }, [q])
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus() } }
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h)
  }, [])
  const go = (p: string) => { nav(p); setQ(''); ref.current?.blur() }
  return (
    <div className="relative w-72">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input ref={ref} value={q} onChange={e => setQ(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setTimeout(() => setFocus(false), 120)}
        onKeyDown={e => { if (e.key === 'Enter' && results[0]) go(results[0].path) }}
        placeholder="Search modules…  Ctrl+K"
        className="w-full rounded-lg border border-line bg-card py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted focus:border-accent/50" />
      {focus && q && (
        <ul className="absolute mt-2 w-full overflow-hidden rounded-lg border border-line bg-elevated shadow-xl">
          {results.length === 0 && <li className="px-3 py-2 text-sm text-muted">No matching modules</li>}
          {results.map(r => (
            <li key={r.path}><button onMouseDown={() => go(r.path)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-card">
              <r.icon size={14} className="text-accent" />{r.label}</button></li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Popover({ button, children, label }: { button: React.ReactNode; children: React.ReactNode; label: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label={label} className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-card text-muted hover:text-ink">{button}</button>
      {open && <div className="absolute right-0 mt-2 w-72 rounded-xl border border-line bg-elevated p-3 shadow-xl">{children}</div>}
    </div>
  )
}

function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-bg/80 px-6 backdrop-blur">
      <Breadcrumbs />
      <div className="flex items-center gap-3">
        <SearchBox />
        <StatusIndicator label="Demo mode" tone="info" />
        <Popover label="Notifications" button={<Bell size={16} />}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Notifications</p>
          <p className="text-sm text-muted">No live notifications. Event feeds connect to the backend in Phase 5.</p>
        </Popover>
        <Popover label="Profile menu" button={<User size={16} />}>
          <p className="text-sm font-medium">Local developer</p>
          <p className="mb-3 text-xs text-muted">Authentication arrives in Phase 3.</p>
          <Link to="/settings" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted hover:bg-card hover:text-ink">Settings</Link>
          <button disabled className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted/50"><LogOut size={14} />Sign out (not yet available)</button>
        </Popover>
      </div>
    </header>
  )
}

export default function Shell() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="min-h-full bg-bg grid-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className={`transition-[padding] duration-200 ${collapsed ? 'pl-16' : 'pl-64'}`}>
        <TopBar />
        <main className="mx-auto max-w-[1400px] p-6"><Outlet /></main>
      </div>
    </div>
  )
}
