import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

/* ---------- Network graph ---------- */
interface GNode { id: string; label: string; x: number; y: number; role: string; tone: string }
const nodes: GNode[] = [
  { id: 'alice', label: 'Alice', x: 80, y: 80, role: 'Sender client. Wraps a fresh AES key for Bob.', tone: '#38bdf8' },
  { id: 'bob', label: 'Bob', x: 80, y: 250, role: 'Recipient client. Verifies signature, unwraps key.', tone: '#38bdf8' },
  { id: 'gw', label: 'Security Gateway', x: 260, y: 165, role: 'Terminates TLS and enforces policy.', tone: '#22d3ee' },
  { id: 'relay', label: 'Message Relay', x: 460, y: 80, role: 'Stores encrypted envelopes; never sees plaintext.', tone: '#2dd4bf' },
  { id: 'kex', label: 'Key Exchange', x: 460, y: 250, role: 'Public-key directory and key agreement.', tone: '#22d3ee' },
  { id: 'ca', label: 'Certificate Authority', x: 640, y: 165, role: 'Issues and revokes certificates; signs the CRL.', tone: '#2dd4bf' },
]
const links: [string, string][] = [['alice', 'gw'], ['bob', 'gw'], ['gw', 'relay'], ['gw', 'kex'], ['kex', 'ca'], ['relay', 'ca']]

export function NetworkGraph() {
  const [sel, setSel] = useState<GNode>(nodes[2])
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]))
  return (
    <div>
      <svg viewBox="0 0 720 330" className="w-full" role="img" aria-label="Logical secure communication topology">
        <defs>
          <radialGradient id="glow"><stop offset="0%" stopColor="#38bdf8" stopOpacity=".35" /><stop offset="100%" stopColor="#38bdf8" stopOpacity="0" /></radialGradient>
        </defs>
        {links.map(([a, b]) => (
          <g key={a + b}>
            <line x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} stroke="rgba(148,163,184,.2)" strokeWidth="1.5" />
            <line x1={byId[a].x} y1={byId[a].y} x2={byId[b].x} y2={byId[b].y} stroke="#22d3ee" strokeWidth="1.5" className="flow" opacity=".7" />
          </g>
        ))}
        {nodes.map(n => (
          <g key={n.id} onClick={() => setSel(n)} className="cursor-pointer" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setSel(n)}>
            {sel.id === n.id && <circle cx={n.x} cy={n.y} r="38" fill="url(#glow)" />}
            <circle cx={n.x} cy={n.y} r="22" fill="#111c2d" stroke={n.tone} strokeWidth={sel.id === n.id ? 2.5 : 1.5} />
            <circle cx={n.x} cy={n.y} r="5" fill={n.tone} />
            <text x={n.x} y={n.y + 40} textAnchor="middle" fontSize="12" fill="#eaf2ff">{n.label}</text>
          </g>
        ))}
      </svg>
      <div className="mt-2 rounded-lg border border-line bg-bg/60 p-3 text-sm">
        <span className="font-medium text-accent">{sel.label}</span>
        <span className="text-muted"> — {sel.role}</span>
      </div>
    </div>
  )
}

/* ---------- Activity chart ---------- */
const series = [
  { key: 'Encryptions', color: '#38bdf8', data: [12, 18, 15, 24, 30, 27, 35, 41, 38, 46, 52, 48] },
  { key: 'Decryptions', color: '#2dd4bf', data: [10, 16, 14, 21, 27, 25, 31, 37, 36, 42, 47, 45] },
  { key: 'Signature verifications', color: '#a5b4fc', data: [8, 11, 12, 15, 19, 18, 22, 26, 25, 30, 33, 31] },
  { key: 'Failed verifications', color: '#f87171', data: [0, 1, 0, 2, 1, 0, 3, 1, 2, 1, 4, 2] },
]
export function ActivityChart() {
  const [hidden, setHidden] = useState<Record<string, boolean>>({})
  const W = 640, H = 220, P = 28
  const max = 60
  const x = (i: number) => P + (i * (W - P * 2)) / 11
  const y = (v: number) => H - P - (v / max) * (H - P * 2)
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Cryptographic activity over 12 intervals (demo data)">
        {[0, 20, 40, 60].map(t => (
          <g key={t}>
            <line x1={P} x2={W - P} y1={y(t)} y2={y(t)} stroke="rgba(148,163,184,.12)" />
            <text x={4} y={y(t) + 4} fontSize="10" fill="#94a3b8">{t}</text>
          </g>
        ))}
        {series.filter(s => !hidden[s.key]).map(s => (
          <polyline key={s.key} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round"
            points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
        ))}
        {Array.from({ length: 12 }, (_, i) => (
          <text key={i} x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="#94a3b8">{`${i * 2}h`}</text>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap gap-2">
        {series.map(s => (
          <button key={s.key} onClick={() => setHidden(h => ({ ...h, [s.key]: !h[s.key] }))}
            className={`flex items-center gap-2 rounded-md border border-line px-2 py-1 text-xs ${hidden[s.key] ? 'opacity-40' : ''}`}>
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.key}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- Event timeline ---------- */
export interface EventItem { time: string; title: string; detail: string; tone: 'ok' | 'info' | 'danger' | 'warn' }
export function EventTimeline({ events }: { events: EventItem[] }) {
  const color = { ok: 'bg-ok', info: 'bg-accent', danger: 'bg-danger', warn: 'bg-warn' }
  return (
    <ol className="relative space-y-4 border-l border-line pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative">
          <span className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-card ${color[e.tone]}`} />
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-medium">{e.title}</p>
            <span className="font-mono text-[11px] text-muted">{e.time}</span>
          </div>
          <p className="text-xs text-muted">{e.detail}</p>
        </li>
      ))}
    </ol>
  )
}

/* ---------- Module cards with distinct illustrations ---------- */
const illos: Record<number, React.ReactNode> = {
  1: ( // cipher wheel / blocks
    <svg viewBox="0 0 120 60" className="h-full w-full">
      {'CIPHER'.split('').map((c, i) => (
        <g key={i}><rect x={6 + i * 18} y="12" width="15" height="18" rx="3" fill="#162338" stroke="#38bdf8" strokeOpacity=".5" />
          <text x={13.5 + i * 18} y="25" fontSize="10" textAnchor="middle" fill="#38bdf8" fontFamily="monospace">{c}</text>
          <rect x={6 + i * 18} y="36" width="15" height="12" rx="3" fill="none" stroke="#2dd4bf" strokeOpacity=".5" strokeDasharray="2 2" /></g>
      ))}
    </svg>
  ),
  2: ( // key exchange curve
    <svg viewBox="0 0 120 60" className="h-full w-full">
      <path d="M10 50 C40 -10, 80 70, 110 10" fill="none" stroke="#22d3ee" strokeWidth="1.5" />
      <circle cx="30" cy="30" r="3" fill="#38bdf8" /><circle cx="70" cy="34" r="3" fill="#2dd4bf" /><circle cx="95" cy="22" r="3" fill="#38bdf8" />
      <line x1="30" y1="30" x2="95" y2="22" stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity=".6" />
    </svg>
  ),
  3: ( // PKI hierarchy
    <svg viewBox="0 0 120 60" className="h-full w-full">
      <g stroke="#94a3b8" strokeOpacity=".5"><line x1="60" y1="14" x2="30" y2="34" /><line x1="60" y1="14" x2="90" y2="34" /><line x1="30" y1="34" x2="18" y2="52" /><line x1="30" y1="34" x2="42" y2="52" /></g>
      <circle cx="60" cy="12" r="6" fill="#111c2d" stroke="#2dd4bf" /><circle cx="30" cy="34" r="5" fill="#111c2d" stroke="#38bdf8" /><circle cx="90" cy="34" r="5" fill="#111c2d" stroke="#38bdf8" />
      <circle cx="18" cy="52" r="4" fill="#38bdf8" /><circle cx="42" cy="52" r="4" fill="#38bdf8" />
    </svg>
  ),
  4: ( // handshake sequence
    <svg viewBox="0 0 120 60" className="h-full w-full">
      <line x1="20" y1="6" x2="20" y2="56" stroke="#94a3b8" strokeOpacity=".5" /><line x1="100" y1="6" x2="100" y2="56" stroke="#94a3b8" strokeOpacity=".5" />
      <path d="M20 16 L100 22" stroke="#38bdf8" /><path d="M100 30 L20 36" stroke="#2dd4bf" /><path d="M20 44 L100 50" stroke="#22d3ee" />
    </svg>
  ),
  5: ( // packet layout
    <svg viewBox="0 0 120 60" className="h-full w-full">
      <rect x="6" y="20" width="22" height="20" rx="3" fill="#162338" stroke="#94a3b8" strokeOpacity=".5" />
      <rect x="30" y="20" width="18" height="20" rx="3" fill="#162338" stroke="#38bdf8" />
      <rect x="50" y="20" width="44" height="20" rx="3" fill="#162338" stroke="#2dd4bf" strokeDasharray="3 2" />
      <rect x="96" y="20" width="18" height="20" rx="3" fill="#162338" stroke="#22d3ee" />
    </svg>
  ),
}

export interface ModuleInfo { n: number; title: string; blurb: string; features: number; done: number; to: string }
export function ModuleCard({ m }: { m: ModuleInfo }) {
  const pct = Math.round((m.done / m.features) * 100)
  return (
    <Link to={m.to} className="panel group block p-4">
      <div className="mb-3 h-14 rounded-lg border border-line bg-bg/60 p-1.5">{illos[m.n]}</div>
      <div className="flex items-start justify-between">
        <span className="font-mono text-xs text-accent">MODULE {m.n}</span>
        <ArrowUpRight size={14} className="text-muted transition-colors group-hover:text-accent" />
      </div>
      <h4 className="mt-1 text-sm font-semibold">{m.title}</h4>
      <p className="mt-1 min-h-[3rem] text-xs leading-relaxed text-muted">{m.blurb}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-muted">
        <span>{m.done} of {m.features} features built</span><span className="font-mono">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-teal" style={{ width: `${pct}%` }} />
      </div>
    </Link>
  )
}
