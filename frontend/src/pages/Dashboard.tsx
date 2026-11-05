import { Link, useNavigate } from 'react-router-dom'
import { Activity, BadgeCheck, FileCheck2, Lock, MessageSquareLock, ShieldAlert, Users } from 'lucide-react'
import { DashboardCard, DemoBadge, StatusIndicator } from '../components/ui'
import { ActivityChart, EventTimeline, ModuleCard, NetworkGraph, type EventItem, type ModuleInfo } from '../components/viz'
import { groups } from '../data/nav'

const kpis = [
  { label: 'Active user sessions', value: '2', delta: 'Alice, Bob', icon: Users },
  { label: 'Encrypted messages', value: '348', delta: '+12 today', icon: MessageSquareLock },
  { label: 'Certificates issued', value: '9', delta: '2 revoked', icon: BadgeCheck },
  { label: 'Integrity verifications', value: '1,204', delta: '99.6% passed', icon: FileCheck2 },
  { label: 'Security events', value: '57', delta: '4 need review', icon: ShieldAlert },
]

const events: EventItem[] = [
  { time: '09:42:11', title: 'User authentication', detail: 'alice signed in (Argon2id verified)', tone: 'ok' },
  { time: '09:43:02', title: 'Certificate issuance', detail: 'End-entity cert issued to bob@ciphermesh.local', tone: 'info' },
  { time: '09:44:20', title: 'Key exchange', detail: 'ECDH P-256 session established', tone: 'info' },
  { time: '09:45:07', title: 'Message encryption', detail: 'AES-256-GCM envelope sealed, key wrapped (RSA-OAEP)', tone: 'ok' },
  { time: '09:45:09', title: 'Signature verification', detail: 'ECDSA signature valid for envelope 7f3a…', tone: 'ok' },
  { time: '09:51:33', title: 'Failed validation', detail: 'Certificate chain rejected: untrusted issuer', tone: 'danger' },
  { time: '09:52:48', title: 'Integrity alert', detail: 'GCM tag mismatch: ciphertext modified in transit', tone: 'warn' },
]

// counts computed from the real navigation registry so progress cannot drift from reality
const phaseFeatures = (prefixes: string[]) =>
  groups.flatMap(g => g.items).filter(i => prefixes.some(p => i.path.startsWith(p)))
const mod = (n: number, title: string, blurb: string, prefixes: string[], to: string): ModuleInfo => {
  const items = phaseFeatures(prefixes)
  return { n, title, blurb, features: items.length, done: items.filter(i => i.implemented).length, to }
}
const modules: ModuleInfo[] = [
  mod(1, 'Classical & Symmetric Cryptography', 'Substitution ciphers, OTP, steganography, DES and block cipher principles.', ['/lab/classical', '/lab/des'], '/lab/classical'),
  mod(2, 'Public-Key Cryptography', 'RNGs, RSA, Diffie-Hellman with MITM, and elliptic curves.', ['/lab/rsa', '/lab/rng', '/lab/dh', '/lab/ecc'], '/lab/rsa'),
  mod(3, 'Hashing & Trust Centre', 'Digests, key distribution, certificate authority and PKI.', ['/trust'], '/trust/ca'),
  mod(4, 'Identity, TLS & Email Security', 'Authentication, Kerberos, TLS, PGP and S/MIME.', ['/identity', '/transport', '/email/pgp', '/email/smime'], '/identity/auth'),
  mod(5, 'Email & IP Security', 'DKIM, IPsec policy, ESP packets and IKE.', ['/email/dkim', '/email/threats', '/network'], '/network/esp'),
]

export default function Dashboard() {
  const nav = useNavigate()
  return (
    <div className="space-y-6">
      <section className="panel relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <StatusIndicator label="All systems nominal (frontend demo)" />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">CipherMesh Security Command Centre</h1>
            <p className="mt-2 max-w-xl text-sm text-muted">Monitor cryptographic operations, trust infrastructure and secure communications.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => nav('/secure/messaging')} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-2">
              <Lock size={14} /> New secure message</button>
            <button onClick={() => nav('/trust/ca')} className="rounded-lg border border-line bg-card px-4 py-2 text-sm hover:border-accent/40">Open Certificate Authority</button>
            <button onClick={() => nav('/lab/classical')} className="rounded-lg border border-line bg-card px-4 py-2 text-sm hover:border-accent/40">Cryptography Lab</button>
          </div>
        </div>
      </section>

      <div className="flex items-center gap-2"><DemoBadge /><span className="text-xs text-muted">Figures below are illustrative until the backend is connected. They are not real metrics.</span></div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {kpis.map(k => (
          <div key={k.label} className="panel p-4">
            <div className="flex items-center justify-between text-muted"><span className="text-xs">{k.label}</span><k.icon size={14} className="text-accent" /></div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{k.value}</p>
            <p className="text-xs text-muted">{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <DashboardCard title="Secure communication topology" className="xl:col-span-2" action={<span className="text-[11px] text-muted">Click a node</span>}>
          <NetworkGraph />
        </DashboardCard>
        <DashboardCard title="Security events" action={<DemoBadge />}>
          <EventTimeline events={events} />
        </DashboardCard>
      </div>

      <DashboardCard title="Cryptographic activity" action={<span className="flex items-center gap-2"><Activity size={14} className="text-accent" /><DemoBadge /></span>}>
        <ActivityChart />
      </DashboardCard>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Syllabus modules</h2>
          <Link to="/docs" className="text-xs text-accent hover:underline">Syllabus mapping</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{modules.map(m => <ModuleCard key={m.n} m={m} />)}</div>
        <p className="mt-2 text-xs text-muted">Progress counts only pages that contain working functionality.</p>
      </div>
    </div>
  )
}
