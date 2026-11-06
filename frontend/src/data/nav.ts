import {
  LayoutDashboard, MessageSquareLock, FileLock2, History, FlaskConical, Binary, KeyRound,
  Dices, Handshake, Spline, ShieldCheck, Hash, KeySquare, BadgeCheck, FileBadge, Network,
  UserCheck, Ticket, Fingerprint, Lock, Globe, Mail, MailCheck, Stamp, MailWarning,
  Route, Database, PackageOpen, Repeat, BarChart3, ScrollText, Gauge, FileCheck2, BookOpen,
  Settings, type LucideIcon,
} from 'lucide-react'

export type Phase = 1 | 2 | 3 | 4 | 5

export interface NavLeaf {
  path: string
  label: string
  icon: LucideIcon
  /** build phase in which the real functionality lands */
  phase: Phase
  summary: string
  /** concrete things the finished page will do */
  scope: string[]
  /** true once the page contains working functionality */
  implemented?: boolean
}
export interface NavGroup {
  label: string
  icon: LucideIcon
  items: NavLeaf[]
}

export const overview: NavLeaf = {
  path: '/', label: 'Overview', icon: LayoutDashboard, phase: 1,
  summary: 'Security command centre', scope: [], implemented: true,
}

export const groups: NavGroup[] = [
  { label: 'Secure Operations', icon: ShieldCheck, items: [
    { path: '/secure/messaging', label: 'Secure Messaging', icon: MessageSquareLock, phase: 3,
      summary: 'Hybrid-encrypted Alice → Bob messaging with signed envelopes.',
      scope: ['AES-256-GCM data key per message', 'RSA-OAEP key wrapping for recipient', 'ECDSA envelope signature', 'Tamper demos: ciphertext, signature, expired/revoked/untrusted cert, replay'] },
    { path: '/secure/files', label: 'File Encryption', icon: FileLock2, phase: 3,
      summary: 'Encrypt and decrypt files with authenticated encryption.',
      scope: ['AES-256-GCM streaming for files', 'Passphrase mode via scrypt/Argon2 KDF', 'Integrity verification on decrypt'] },
    { path: '/secure/history', label: 'Communication History', icon: History, phase: 3,
      summary: 'Encrypted envelope log with verification results.',
      scope: ['Envelope metadata only, never plaintext', 'Per-message verification outcome', 'Replay detection record'] },
  ]},
  { label: 'Cryptography Laboratory', icon: FlaskConical, items: [
    { path: '/lab/classical', label: 'Classical Ciphers', icon: FlaskConical, phase: 2,
      summary: 'Caesar, monoalphabetic, Playfair, Hill, polyalphabetic, one-time pad, steganography.',
      scope: ['Alphabet-shift and Playfair matrix visualisations', 'Hill matrix modular arithmetic', 'OTP XOR view', 'LSB image steganography'],
      implemented: true },
    { path: '/lab/des', label: 'DES Workbench', icon: Binary, phase: 2,
      summary: 'Educational DES with round-by-round Feistel trace and avalanche effect.',
      scope: ['16 round keys', 'Expansion, S-box, permutation trace', 'Avalanche experiment'],
      implemented: true },
    { path: '/lab/rsa', label: 'RSA Laboratory', icon: KeyRound, phase: 2,
      summary: 'Step-by-step toy RSA plus real RSA-OAEP via vetted library.',
      scope: ['p, q, n, φ(n), e, d walkthrough', 'Toy parameter experiments', 'Real RSA-OAEP comparison'] },
    { path: '/lab/rng', label: 'Random Number Generators', icon: Dices, phase: 2,
      summary: 'LCG and Blum Blum Shub with statistical exploration and clear insecurity warnings.',
      scope: ['Seed and parameter controls', 'Sequence and distribution plots', 'Why these must not generate real keys'] },
    { path: '/lab/dh', label: 'Diffie-Hellman', icon: Handshake, phase: 2,
      summary: 'Animated Alice/Bob exchange and a man-in-the-middle demonstration.',
      scope: ['Public parameters and private values', 'Shared secret derivation', 'Unauthenticated MITM attack'] },
    { path: '/lab/ecc', label: 'Elliptic Curve Cryptography', icon: Spline, phase: 2,
      summary: 'Toy curve point arithmetic and real ECDH via vetted library.',
      scope: ['Curve plot and point addition', 'Scalar multiplication', 'ECDH shared secret'] },
  ]},
  { label: 'Trust Centre', icon: BadgeCheck, items: [
    { path: '/trust/hashing', label: 'Hashing Laboratory', icon: Hash, phase: 2,
      summary: 'SHA-256/512, educational hashes, file hashing and modification detection.',
      scope: ['Digest comparison', 'Bit-difference visualisation', 'File integrity check'] },
    { path: '/trust/keys', label: 'Key Management', icon: KeySquare, phase: 3,
      summary: 'Symmetric, asymmetric and public-key distribution protocol diagrams.',
      scope: ['Interactive protocol flows', 'Comparison of trust assumptions'] },
    { path: '/trust/ca', label: 'Certificate Authority', icon: BadgeCheck, phase: 3,
      summary: 'Local demonstration CA: CSRs, issuance, revocation and CRL.',
      scope: ['Root CA generation', 'CSR and X.509 issuance', 'Revocation list'] },
    { path: '/trust/x509', label: 'X.509 Certificates', icon: FileBadge, phase: 3,
      summary: 'Certificate field inspector and chain validation.',
      scope: ['Parse and display fields', 'Validity and chain checks', 'Fingerprints'] },
    { path: '/trust/pki', label: 'PKI Explorer', icon: Network, phase: 3,
      summary: 'Interactive Root → Intermediate → End-entity hierarchy.',
      scope: ['Clickable hierarchy', 'Per-node certificate details'] },
  ]},
  { label: 'Identity & Authentication', icon: UserCheck, items: [
    { path: '/identity/auth', label: 'User Authentication', icon: UserCheck, phase: 3,
      summary: 'Registration, Argon2id login and session handling.',
      scope: ['Argon2id password hashing', 'Session management', 'Failure handling'] },
    { path: '/identity/kerberos', label: 'Kerberos Simulator', icon: Ticket, phase: 4,
      summary: 'Animated AS / TGS / service exchange (simulation).',
      scope: ['TGT and service ticket flow', 'Per-step protocol state'] },
    { path: '/identity/asymmetric', label: 'Asymmetric Authentication', icon: Fingerprint, phase: 3,
      summary: 'Signature-based challenge-response.',
      scope: ['Server nonce', 'Client signs challenge', 'Server verifies'] },
  ]},
  { label: 'Transport Security', icon: Lock, items: [
    { path: '/transport/tls', label: 'TLS Inspector', icon: Lock, phase: 4,
      summary: 'Handshake explainer backed by a real TLS connection.',
      scope: ['ClientHello to Finished', 'Negotiated cipher and certificate view'] },
    { path: '/transport/web', label: 'Web Security', icon: Globe, phase: 4,
      summary: 'Web security headers and transport hardening checks.',
      scope: ['Header inspection', 'Explanations of each control'] },
  ]},
  { label: 'Email Security', icon: Mail, items: [
    { path: '/email/pgp', label: 'PGP', icon: Mail, phase: 4,
      summary: 'GnuPG key generation, signing and encryption where available.',
      scope: ['Key generation and export', 'Sign / verify', 'Encrypt / decrypt'] },
    { path: '/email/smime', label: 'S/MIME', icon: MailCheck, phase: 4,
      summary: 'OpenSSL CMS signing and encryption.',
      scope: ['Sign / verify', 'Encrypt / decrypt', 'Certificate inspection'] },
    { path: '/email/dkim', label: 'DKIM', icon: Stamp, phase: 4,
      summary: 'Functional DKIM signing and verification with DNS TXT simulation.',
      scope: ['Canonicalisation', 'Signature generation and verification', 'Tamper detection'] },
    { path: '/email/threats', label: 'Email Threat Analysis', icon: MailWarning, phase: 4,
      summary: 'Controlled examples of spoofing and tampering.',
      scope: ['Spoofed sender', 'Signature mismatch', 'Certificate trust failure'] },
  ]},
  { label: 'Network Security', icon: Route, items: [
    { path: '/network/policy', label: 'IP Security Policy', icon: Route, phase: 4,
      summary: 'Security Policy Database simulation.',
      scope: ['Policy rules', 'Traffic selector matching'] },
    { path: '/network/sa', label: 'Security Associations', icon: Database, phase: 4,
      summary: 'Security Association Database with SPI and replay window.',
      scope: ['SA records', 'Sequence numbers and replay protection'] },
    { path: '/network/esp', label: 'ESP Packet Inspector', icon: PackageOpen, phase: 4,
      summary: 'ESP packet layout, transport vs tunnel mode.',
      scope: ['Header, payload, ICV fields', 'Mode comparison'] },
    { path: '/network/ike', label: 'IKE Simulator', icon: Repeat, phase: 4,
      summary: 'Initiator/responder state machine (simulation).',
      scope: ['Negotiation stages', 'Key derivation', 'SA establishment'] },
  ]},
  { label: 'Security Analytics', icon: BarChart3, items: [
    { path: '/analytics/audit', label: 'Audit Events', icon: ScrollText, phase: 5,
      summary: 'Searchable security event log.',
      scope: ['Event table with filters', 'No plaintext or keys logged'] },
    { path: '/analytics/bench', label: 'Cryptographic Benchmarks', icon: Gauge, phase: 5,
      summary: 'Measured throughput of primitives on this machine.',
      scope: ['AES-GCM, SHA, RSA, ECDSA timings'] },
    { path: '/analytics/integrity', label: 'Integrity Reports', icon: FileCheck2, phase: 5,
      summary: 'Verification outcomes and tamper-test results.',
      scope: ['Pass/fail summaries', 'Attack demonstration results'] },
  ]},
]

export const docsItem: NavLeaf = {
  path: '/docs', label: 'Documentation', icon: BookOpen, phase: 5,
  summary: 'Project documentation and syllabus mapping.',
  scope: ['Syllabus mapping with honest implementation status', 'Security notes and limitations'],
}
export const settingsItem: NavLeaf = {
  path: '/settings', label: 'Settings', icon: Settings, phase: 5,
  summary: 'Preferences and demo-mode controls.',
  scope: ['Theme density', 'Demo data toggle'],
}

export const allLeaves: NavLeaf[] = [overview, ...groups.flatMap(g => g.items), docsItem, settingsItem]
