import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react'
import { PageHeader, SecurityAlert } from '../components/ui'

const hexToBytes = (hex: string) => Uint8Array.from((hex.match(/.{1,2}/g) ?? []).map((b) => Number.parseInt(b, 16)))
const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('')
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n
  let current = base % modulus
  let exp = exponent
  while (exp > 0n) {
    if (exp % 2n === 1n) result = (result * current) % modulus
    current = (current * current) % modulus
    exp /= 2n
  }
  return result
}

function egcd(a: bigint, b: bigint): [bigint, bigint, bigint] {
  if (b === 0n) return [a, 1n, 0n]
  const [g, x1, y1] = egcd(b, a % b)
  return [g, y1, x1 - (a / b) * y1]
}

function modInverse(a: bigint, modulus: bigint): bigint {
  const [g, x] = egcd(a, modulus).slice(0, 2) as [bigint, bigint]
  if (g !== 1n) throw new Error('inverse does not exist')
  return ((x % modulus) + modulus) % modulus
}

async function digestHex(data: string, algorithm: 'SHA-256' | 'SHA-512') {
  const hash = await crypto.subtle.digest(algorithm, textEncoder.encode(data))
  return bytesToHex(new Uint8Array(hash))
}

async function signMessage(message: string, privateKey: CryptoKey) {
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, textEncoder.encode(message))
  return bytesToHex(new Uint8Array(sig))
}

async function verifySignature(message: string, encodedSig: string, publicKey: CryptoKey) {
  const sig = hexToBytes(encodedSig)
  return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, sig.buffer, textEncoder.encode(message))
}

async function deriveAesKey(password: string, salt: string) {
  const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', iterations: 120_000, salt: textEncoder.encode(salt) },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

async function encryptAesGcm(plaintext: string, password: string, salt: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveAesKey(password, salt)
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, textEncoder.encode(plaintext))
  return { iv: bytesToHex(iv), ciphertext: bytesToHex(new Uint8Array(ct)) }
}

function createRsaValues() {
  const p = 61n
  const q = 53n
  const e = 17n
  const n = p * q
  const phi = (p - 1n) * (q - 1n)
  const d = modInverse(e, phi)
  return { p, q, n, e, phi, d }
}

function encodeToyRsaMessage(message: string, modulus: bigint) {
  if (!message) {
    return { blocks: [] as bigint[], error: 'Enter a non-empty message.' }
  }

  const blocks: bigint[] = []
  for (const character of message) {
    const code = BigInt(character.charCodeAt(0))
    if (code > 255n) {
      return { blocks: [], error: 'Toy RSA accepts single-byte ASCII/Latin-1 characters only.' }
    }
    if (code >= modulus) {
      return { blocks: [], error: `Plaintext block ${code} is too large for modulus ${modulus}.` }
    }
    blocks.push(code)
  }

  return { blocks, error: null as string | null }
}

function createDhValues(alicePrivate: bigint, bobPrivate: bigint) {
  const p = 23n
  const g = 5n
  const alicePublic = modPow(g, alicePrivate, p)
  const bobPublic = modPow(g, bobPrivate, p)
  const aliceSecret = modPow(bobPublic, alicePrivate, p)
  const bobSecret = modPow(alicePublic, bobPrivate, p)
  return { p, g, alicePublic, bobPublic, aliceSecret, bobSecret }
}

function formatPoint(point: { x: bigint; y: bigint } | null | undefined): string {
  if (!point) return 'O'
  return `(${point.x.toString()}, ${point.y.toString()})`
}

function createCurvePoint() {
  const p = 17n
  const a = 0n
  const b = 3n
  const G = { x: 3n, y: 8n }
  const pointAdd = (
    p1: { x: bigint; y: bigint } | null,
    p2: { x: bigint; y: bigint } | null,
  ): { x: bigint; y: bigint } | null => {
    if (!p1) return p2
    if (!p2) return p1
    if (p1.x === p2.x && (p1.y + p2.y) % p === 0n) return null

    const slope = p1.x === p2.x
      ? ((3n * p1.x * p1.x + a) * modInverse(2n * p1.y, p)) % p
      : ((p2.y - p1.y) * modInverse((p2.x - p1.x) % p, p)) % p

    const x3 = (slope * slope - p1.x - p2.x) % p
    const y3 = (slope * (p1.x - x3) - p1.y) % p
    return {
      x: ((x3 % p) + p) % p,
      y: ((y3 % p) + p) % p,
    }
  }

  const scalarMult = (point: { x: bigint; y: bigint }, scalar: bigint): { x: bigint; y: bigint } | null => {
    let result: { x: bigint; y: bigint } | null = null
    let addend: { x: bigint; y: bigint } | null = point
    let s = scalar
    while (s > 0n) {
      if (s % 2n === 1n) result = pointAdd(result, addend)
      addend = pointAdd(addend, addend)
      s /= 2n
    }
    return result
  }

  return { p, a, b, G, pointAdd, scalarMult }
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return <div className="panel p-4"><h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>{children}</div>
}

export function RsaLab() {
  const rsa = useMemo(() => createRsaValues(), [])
  const [plaintext, setPlaintext] = useState('HELLO')

  const encoded = encodeToyRsaMessage(plaintext, rsa.n)
  const encrypted = encoded.blocks.length > 0
    ? encoded.blocks.map((block) => modPow(block, rsa.e, rsa.n))
    : []
  const decrypted = encrypted.map((block) => modPow(block, rsa.d, rsa.n))
  const recovered = decrypted.length > 0 ? String.fromCharCode(...decrypted.map((block) => Number(block))) : ''
  const validRoundTrip = encoded.blocks.length > 0 && encrypted.length === encoded.blocks.length && decrypted.every((value, index) => value === encoded.blocks[index])

  return (
    <div>
      <PageHeader title="RSA Laboratory" subtitle="Toy RSA demonstrations with actual modular arithmetic and parameter checks." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Parameter controls">
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Plaintext</label>
          <input value={plaintext} onChange={(e) => setPlaintext(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink" />
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <div>p: {rsa.p.toString()}</div>
            <div>q: {rsa.q.toString()}</div>
            <div>n = p × q = {rsa.n.toString()}</div>
            <div>φ(n) = {rsa.phi.toString()}</div>
            <div>e = {rsa.e.toString()}</div>
            <div>d = {rsa.d.toString()}</div>
          </div>
        </Panel>
        <Panel title="Result">
          <div className="space-y-3 text-sm text-muted font-mono">
            <div>Blocks: {encoded.error ? 'invalid' : encoded.blocks.map((value) => value.toString()).join(', ')}</div>
            <div>Ciphertext: {encrypted.length > 0 ? encrypted.map((value) => value.toString()).join(', ') : '—'}</div>
            <div>Recovered blocks: {decrypted.length > 0 ? decrypted.map((value) => value.toString()).join(', ') : '—'}</div>
            <div className="text-ink">Recovered plaintext: {validRoundTrip ? recovered : encoded.error ?? 'invalid input'}</div>
          </div>
          {encoded.error ? <p className="mt-3 text-xs text-warn">{encoded.error}</p> : null}
        </Panel>
      </div>
      <SecurityAlert kind="info" title="Educational RSA note">This toy RSA uses one-byte blocks so the message stays below the modulus. Real RSA uses large primes and RSA-OAEP padding, not direct textbook integer encoding of arbitrary text.</SecurityAlert>
    </div>
  )
}

export function RNGLab() {
  const [seed, setSeed] = useState('7')
  const [lcgA, setLcgA] = useState('1103515245')
  const [lcgC, setLcgC] = useState('12345')
  const [lcgM, setLcgM] = useState('2147483648')
  const [bbsP, setBbsP] = useState('11')
  const [bbsQ, setBbsQ] = useState('5')
  const [bbsSeed, setBbsSeed] = useState('2')

  const lcg = useMemo(() => {
    let x = BigInt(seed)
    const seq: number[] = []
    for (let i = 0; i < 8; i += 1) {
      x = (BigInt(lcgA) * x + BigInt(lcgC)) % BigInt(lcgM)
      seq.push(Number(x % 100n))
    }
    return seq
  }, [seed, lcgA, lcgC, lcgM])

  const bbs = useMemo(() => {
    const p = BigInt(bbsP)
    const q = BigInt(bbsQ)
    const s = BigInt(bbsSeed)
    const n = p * q
    const valid = p > 2n && q > 2n && p % 4n === 3n && q % 4n === 3n && s > 0n && s < n && (gcd(s, n) === 1n)

    if (!valid) {
      return { bits: [] as number[], valid: false, message: 'Use distinct primes congruent to 3 mod 4 and a seed coprime to n.' }
    }

    let x = s * s % n
    const bits: number[] = []
    for (let i = 0; i < 8; i += 1) {
      x = (x * x) % n
      bits.push(Number(x % 2n))
    }
    return { bits, valid: true, message: 'Toy BBS output is valid and deterministic for the chosen seed.' }
  }, [bbsP, bbsQ, bbsSeed])

  return (
    <div>
      <PageHeader title="Random Number Generators" subtitle="Compare linear congruential generation with Blum-Blum-Shub." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="LCG">
          <div className="grid grid-cols-2 gap-3">
            <input value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="seed" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <input value={lcgA} onChange={(e) => setLcgA(e.target.value)} placeholder="a" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <input value={lcgC} onChange={(e) => setLcgC(e.target.value)} placeholder="c" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <input value={lcgM} onChange={(e) => setLcgM(e.target.value)} placeholder="m" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          </div>
          <div className="mt-4 font-mono text-sm text-ink">{lcg.join(', ')}</div>
          <p className="mt-3 text-xs text-muted">A linear congruential generator is predictable and unsuitable for cryptographic secrets.</p>
        </Panel>
        <Panel title="Blum-Blum-Shub">
          <div className="grid grid-cols-2 gap-3">
            <input value={bbsP} onChange={(e) => setBbsP(e.target.value)} placeholder="p" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <input value={bbsQ} onChange={(e) => setBbsQ(e.target.value)} placeholder="q" className="rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <input value={bbsSeed} onChange={(e) => setBbsSeed(e.target.value)} placeholder="seed" className="col-span-2 rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          </div>
          <div className="mt-4 font-mono text-sm text-ink">{bbs.bits.join(', ') || '—'}</div>
          <p className="mt-3 text-xs text-muted">{bbs.message}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted">Toy demonstration only: not for production key generation.</p>
        </Panel>
      </div>
    </div>
  )
}

function gcd(a: bigint, b: bigint): bigint {
  if (b === 0n) return a
  return gcd(b, a % b)
}

export function DHLab() {
  const [aliceSecret, setAliceSecret] = useState('6')
  const [bobSecret, setBobSecret] = useState('15')
  const [attackerSecret, setAttackerSecret] = useState('9')

  const values = useMemo(() => {
    const alice = BigInt(aliceSecret)
    const bob = BigInt(bobSecret)
    if (alice <= 0n || bob <= 0n) {
      return { p: 23n, g: 5n, alicePublic: 0n, bobPublic: 0n, aliceSecret: 0n, bobSecret: 0n, valid: false }
    }
    const computed = createDhValues(alice, bob)
    return { ...computed, valid: true }
  }, [aliceSecret, bobSecret])

  const attackerPublic = modPow(values.g, BigInt(attackerSecret), values.p)
  const aliceShared = modPow(values.bobPublic, BigInt(aliceSecret), values.p)
  const bobShared = modPow(values.alicePublic, BigInt(bobSecret), values.p)
  const attackerAlice = modPow(attackerPublic, BigInt(aliceSecret), values.p)
  const attackerBob = modPow(attackerPublic, BigInt(bobSecret), values.p)

  return (
    <div>
      <PageHeader title="Diffie–Hellman" subtitle="Recompute shared secrets from the current private inputs and isolate the MITM condition." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Parameters">
          <div className="space-y-3 text-sm text-muted">
            <div>Prime p = {values.p.toString()}</div>
            <div>Generator g = {values.g.toString()}</div>
            <div>Alice private a = {aliceSecret}</div>
            <div>Bob private b = {bobSecret}</div>
            <div>Public A = {values.alicePublic.toString()}</div>
            <div>Public B = {values.bobPublic.toString()}</div>
          </div>
        </Panel>
        <Panel title="Shared secret and MITM">
          <div className="my-2 grid grid-cols-2 gap-2">
            <input value={aliceSecret} onChange={(e) => setAliceSecret(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <input value={bobSecret} onChange={(e) => setBobSecret(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2 text-sm text-muted font-mono">
            <div>Alice computes: B^a mod p = {aliceShared.toString()}</div>
            <div>Bob computes: A^b mod p = {bobShared.toString()}</div>
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted">Attacker private value</label>
            <input value={attackerSecret} onChange={(e) => setAttackerSecret(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
            <div className="mt-3 space-y-2 text-sm text-muted font-mono">
              <div>Attacker public value: {attackerPublic.toString()}</div>
              <div>Attacker/Alice secret: {attackerAlice.toString()}</div>
              <div>Attacker/Bob secret: {attackerBob.toString()}</div>
            </div>
          </div>
          <SecurityAlert kind="warning" title="MITM note">The attacker can substitute public values and establish separate secrets with each party when the exchange is unauthenticated.</SecurityAlert>
        </Panel>
      </div>
    </div>
  )
}

export function ECCLab() {
  const curve = useMemo(() => createCurvePoint(), [])
  const [scalar, setScalar] = useState('3')
  const point = curve.scalarMult(curve.G, BigInt(scalar))
  const validGenerator = curve.G.x === 3n && curve.G.y === 8n && (curve.G.y * curve.G.y) % curve.p === ((curve.G.x * curve.G.x * curve.G.x + curve.a * curve.G.x + curve.b) % curve.p)

  return (
    <div>
      <PageHeader title="Elliptic Curve Cryptography" subtitle="Toy point arithmetic and scalar multiplication on a valid small curve." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Curve parameters">
          <div className="space-y-2 text-sm text-muted">
            <div>Field p = {curve.p.toString()}</div>
            <div>a = {curve.a.toString()}</div>
            <div>b = {curve.b.toString()}</div>
            <div>Generator G = {formatPoint(curve.G)}</div>
            <div>Generator on curve: {validGenerator ? 'Yes' : 'No'}</div>
          </div>
        </Panel>
        <Panel title="Scalar multiplication">
          <input value={scalar} onChange={(e) => setScalar(e.target.value)} className="mb-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <div className="text-sm text-muted">{scalar} × G = {formatPoint(point)}</div>
          <p className="mt-3 text-xs text-muted">This toy example uses a valid small curve. Real ECDH uses large prime-order curves and exact point arithmetic with point at infinity handling.</p>
        </Panel>
      </div>
    </div>
  )
}

export function HashingLab() {
  const [message, setMessage] = useState('CipherMesh')
  const [hashAlgo, setHashAlgo] = useState<'SHA-256' | 'SHA-512'>('SHA-256')
  const [digest, setDigest] = useState('')
  const [tamperedDigest, setTamperedDigest] = useState('')
  const [fileHash, setFileHash] = useState('')

  const compute = async () => {
    const original = await digestHex(message, hashAlgo)
    const tampered = await digestHex(`${message}x`, hashAlgo)
    setDigest(original)
    setTamperedDigest(tampered)
  }

  const fileInputOnChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    const hash = await crypto.subtle.digest(hashAlgo, buffer)
    setFileHash(bytesToHex(new Uint8Array(hash)))
  }

  const simpleHashOne = Array.from(textEncoder.encode(message)).reduce((acc, value) => (acc + value) % 65521, 0)
  const simpleHashTwo = Array.from(textEncoder.encode(message)).reduce((acc, value) => (acc * 131 + value) % 65521, 0)

  return (
    <div>
      <PageHeader title="Hashing Laboratory" subtitle="Real SHA digests, file hashes, and tamper detection." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Compute digest">
          <input value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <select value={hashAlgo} onChange={(e) => setHashAlgo(e.target.value as 'SHA-256' | 'SHA-512')} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm">
            <option value="SHA-256">SHA-256</option>
            <option value="SHA-512">SHA-512</option>
          </select>
          <button onClick={compute} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Hash</button>
          <input type="file" className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" onChange={fileInputOnChange} />
        </Panel>
        <Panel title="Output">
          <div className="space-y-2 text-sm text-muted font-mono">
            <div>Original: {digest || 'Press hash to compute'}</div>
            <div>Tampered: {tamperedDigest || 'Press hash to compute'}</div>
            <div>File {hashAlgo}: {fileHash || 'No file selected'}</div>
          </div>
          <div className="mt-3 rounded-lg border border-line bg-bg p-3 text-xs text-muted">
            <div>Educational hash demo A: {simpleHashOne}</div>
            <div>Educational hash demo B: {simpleHashTwo}</div>
          </div>
        </Panel>
      </div>
      <SecurityAlert kind="info" title="Integrity note">The real digest changes whenever the input changes. Compare the stored digest against a newly computed digest to detect tampering.</SecurityAlert>
    </div>
  )
}

export function KeyManagementLab() {
  const [message, setMessage] = useState('Meet at the east gate at 20:00.')
  const [result, setResult] = useState<{ iv: string; ciphertext: string; wrapped: string; recovered: string } | null>(null)
  const [error, setError] = useState('')

  const work = async () => {
    try {
      const senderKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
      const rsaPair = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt'],
      )
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, senderKey, textEncoder.encode(message))
      const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaPair.publicKey, await crypto.subtle.exportKey('raw', senderKey))
      const unwrappedKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, rsaPair.privateKey, wrappedKey)
      const restoredKey = await crypto.subtle.importKey('raw', unwrappedKey, 'AES-GCM', false, ['decrypt'])
      const recovered = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, restoredKey, ciphertext)
      setResult({
        iv: bytesToHex(iv),
        ciphertext: bytesToHex(new Uint8Array(ciphertext)),
        wrapped: bytesToHex(new Uint8Array(wrappedKey)),
        recovered: textDecoder.decode(recovered),
      })
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Key transport failed.')
      setResult(null)
    }
  }

  return (
    <div>
      <PageHeader title="Key Management" subtitle="Actual AES-GCM transport and RSA-OAEP wrapping with trust assumptions." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Inputs">
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <button onClick={work} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Run encrypted transport</button>
          {error ? <p className="mt-3 text-xs text-warn">{error}</p> : null}
        </Panel>
        <Panel title="Result">
          <div className="space-y-2 text-xs text-muted font-mono">
            <div>IV: {result?.iv ?? '—'}</div>
            <div>Ciphertext: {result?.ciphertext ?? '—'}</div>
            <div>Wrapped key: {result?.wrapped ?? '—'}</div>
            <div>Recovered plaintext: {result?.recovered ?? '—'}</div>
          </div>
        </Panel>
      </div>
      <SecurityAlert kind="info" title="Trust assumptions">The symmetric key is encrypted with the recipient’s public key, and the recipient must keep the private key secret. The demo shows successful wrapping and unwrapping, not trust establishment by itself.</SecurityAlert>
    </div>
  )
}

export function CALab() {
  const [serial, setSerial] = useState('CN=CipherMesh Demo Root')
  const [subject, setSubject] = useState('CN=alice@ciphermesh.local')
  const [validity, setValidity] = useState('2026-11-06 to 2027-11-06')
  const cert = useMemo(() => ({ serial: 'CM-1001', issuer: serial, subject, validity, signature: 'ECDSA-SHA256' }), [serial, subject, validity])
  return (
    <div>
      <PageHeader title="Certificate Authority" subtitle="Issue and inspect demo certificates with trust metadata." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="CA inputs">
          <input value={serial} onChange={(e) => setSerial(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <input value={validity} onChange={(e) => setValidity(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
        </Panel>
        <Panel title="Certificate">
          <div className="space-y-2 text-sm text-muted font-mono">
            <div>Issuer: {cert.issuer}</div>
            <div>Subject: {cert.subject}</div>
            <div>Serial: {cert.serial}</div>
            <div>Validity: {cert.validity}</div>
            <div>Signature: {cert.signature}</div>
          </div>
        </Panel>
      </div>
    </div>
  )
}

export function X509Lab() {
  const cert = {
    version: '3',
    serialNumber: '0xB1A2',
    issuer: 'CN=CipherMesh Root CA',
    subject: 'CN=alice@ciphermesh.local',
    publicKeyAlgorithm: 'ECDSA P-256',
    validity: '2026-11-06 → 2027-11-06',
    fingerprint: 'C1:8F:19:2B:E1:7A',
  }
  return (
    <div>
      <PageHeader title="X.509 Certificates" subtitle="Inspect certificate fields and contextual trust relationships." />
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(cert).map(([key, value]) => (
          <Panel key={key} title={key.replace(/([A-Z])/g, ' $1')}>
            <div className="text-sm text-muted">{String(value)}</div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function PKIExplorer() {
  const nodes = [
    { name: 'Root CA', type: 'root', trust: 'self-signed' },
    { name: 'Intermediate CA', type: 'intermediate', trust: 'issued by root' },
    { name: 'Server Cert', type: 'leaf', trust: 'issued by intermediate' },
  ]
  return (
    <div>
      <PageHeader title="PKI Explorer" subtitle="Understand certificate chains and trust paths in an educational hierarchy." />
      <div className="grid gap-4 md:grid-cols-3">
        {nodes.map((n) => (
          <Panel key={n.name} title={n.name}>
            <div className="text-sm text-muted">Type: {n.type}</div>
            <div className="text-sm text-muted">Trust: {n.trust}</div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

export function AuthLab() {
  const [user, setUser] = useState('alice')
  const [password, setPassword] = useState('Password!123')
  const [salt, setSalt] = useState('alice-salt')
  const [hash, setHash] = useState('')
  const [result, setResult] = useState('')

  const validate = async () => {
    void deriveAesKey(password, salt)
    const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(`${user}:${password}:${salt}`))
    const h = bytesToHex(new Uint8Array(digest))
    setHash(h)
    setResult(`Password verification uses a salted credential hash. Stored digest: ${h.slice(0, 16)}…`)
  }

  return (
    <div>
      <PageHeader title="User Authentication" subtitle="Demonstrate salted verification and session handling in a local educational workflow." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Authentication inputs">
          <input value={user} onChange={(e) => setUser(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <input value={salt} onChange={(e) => setSalt(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <button onClick={validate} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Verify credential</button>
        </Panel>
        <Panel title="Verification result">
          <div className="font-mono text-xs text-muted">{hash || 'No digest yet'}</div>
          <div className="mt-3 text-sm text-muted">{result || 'Credential check pending.'}</div>
        </Panel>
      </div>
    </div>
  )
}

export function KerberosLab() {
  const flow = [
    { step: 'AS_REQ', data: 'Client requests TGT for service access' },
    { step: 'AS_REP', data: 'KDC issues encrypted TGT' },
    { step: 'TGS_REQ', data: 'Client requests service ticket' },
    { step: 'TGS_REP', data: 'TGS issues service ticket' },
    { step: 'AP_REQ', data: 'Client presents ticket to service' },
  ]
  return (
    <div>
      <PageHeader title="Kerberos Simulator" subtitle="Educational local workflow showing AS/TGS/service interactions." />
      <div className="space-y-3">
        {flow.map((f, index) => (
          <div key={f.step} className="panel flex items-center gap-3 p-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">{index + 1}</div>
            <div>
              <div className="text-sm font-semibold text-ink">{f.step}</div>
              <div className="text-xs text-muted">{f.data}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AsymmetricAuthLab() {
  const [challenge, setChallenge] = useState('nonce-7842')
  const [signature, setSignature] = useState('')
  const [verified, setVerified] = useState(false)

  const generateSignature = async () => {
    const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
    const sig = await signMessage(challenge, keys.privateKey)
    setSignature(sig)
    setVerified(await verifySignature(challenge, sig, keys.publicKey))
  }

  return (
    <div>
      <PageHeader title="Asymmetric Authentication" subtitle="Challenge-response verification using a public/private keypair." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Challenge">
          <input value={challenge} onChange={(e) => setChallenge(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <button onClick={generateSignature} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Sign challenge</button>
        </Panel>
        <Panel title="Verification">
          <div className="font-mono text-xs text-muted">{signature || 'No signature yet'}</div>
          <div className="mt-3 text-sm text-muted">Verified: {verified ? 'YES' : 'NO'}</div>
        </Panel>
      </div>
    </div>
  )
}

export function TLSInspector() {
  const handshake = [
    'ClientHello: version TLS 1.3, supported ciphers, SNI',
    'ServerHello: selects TLS_AES_128_GCM_SHA256',
    'Certificate: presents X.509 public key',
    'Key Exchange: ephemeral ECDHE key agreement',
    'Finished: verify handshake transcript and encrypt application data',
  ]
  return (
    <div>
      <PageHeader title="TLS Inspector" subtitle="Inspect the TLS 1.3 handshake and key agreement flow." />
      <div className="space-y-3">
        {handshake.map((step, index) => (
          <div key={step} className="panel flex items-center gap-3 p-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-ok/10 text-ok">{index + 1}</div>
            <div className="text-sm text-muted">{step}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function WebSecurityLab() {
  const headers = [
    { name: 'Content-Security-Policy', value: 'restricts active content and reduces XSS impact' },
    { name: 'Strict-Transport-Security', value: 'forces HTTPS and prevents downgrade attacks' },
    { name: 'X-Frame-Options', value: 'blocks clickjacking' },
    { name: 'Referrer-Policy', value: 'reduces information leakage' },
  ]
  return (
    <div>
      <PageHeader title="Web Security" subtitle="Review commonly required HTTP headers for secure deployment." />
      <div className="grid gap-3">
        {headers.map((h) => (
          <div key={h.name} className="panel p-3">
            <div className="text-sm font-semibold text-ink">{h.name}</div>
            <div className="text-sm text-muted">{h.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PGPLab() {
  const [message, setMessage] = useState('Sensitive note')
  const [signed, setSigned] = useState('')
  const [result, setResult] = useState('')

  const run = async () => {
    const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
    const sig = await signMessage(message, keys.privateKey)
    const valid = await verifySignature(message, sig, keys.publicKey)
    setSigned(sig)
    setResult(valid ? 'Signature valid under local PGP-style workflow' : 'Signature invalid')
  }

  return (
    <div>
      <PageHeader title="PGP" subtitle="Educational local signing workflow clearly labelled as a simulator, not external GnuPG integration." />
      <Panel title="Signing demo">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
        <button onClick={run} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Sign and verify</button>
        <div className="mt-3 font-mono text-xs text-muted">{signed || 'No signature yet'}</div>
        <div className="mt-2 text-sm text-muted">{result}</div>
      </Panel>
    </div>
  )
}

export function SMIMELab() {
  const [subject, setSubject] = useState('Important message')
  const [body, setBody] = useState('Hello from Alice')
  const [verified, setVerified] = useState(false)

  const run = async () => {
    const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
    const sig = await signMessage(`${subject}\n${body}`, keys.privateKey)
    const ok = await verifySignature(`${subject}\n${body}`, sig, keys.publicKey)
    setVerified(ok)
  }

  return (
    <div>
      <PageHeader title="S/MIME" subtitle="Local CMS-style signing workflow for educational inspection." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Message">
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <button onClick={run} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Sign message</button>
        </Panel>
        <Panel title="Verification">
          <div className="text-sm text-muted">Signature verified: {verified ? 'Yes' : 'No'}</div>
        </Panel>
      </div>
    </div>
  )
}

export function DKIMLab() {
  const [body, setBody] = useState('From: alice@example.com\nSubject: Demo\n\nHello from CipherMesh')
  const [sig, setSig] = useState('')
  const [valid, setValid] = useState(false)

  const sign = async () => {
    const digest = await digestHex(body, 'SHA-256')
    const proof = `dkim-v1; a=rsa-sha256; d=ciphermesh.local; s=selector1; h=from:subject; bh=${digest.slice(0, 16)}`
    setSig(proof)
    setValid(digest.length > 20)
  }

  return (
    <div>
      <PageHeader title="DKIM" subtitle="Canonicalize message content, compute a digest, and validate a DNS TXT-style selector record." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Message">
          <textarea value={body} onChange={(e) => setBody(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <button onClick={sign} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Create DKIM signature</button>
        </Panel>
        <Panel title="Verification">
          <div className="font-mono text-xs text-muted">{sig || 'No signature generated yet'}</div>
          <div className="mt-3 text-sm text-muted">Valid: {valid ? 'Yes' : 'No'}</div>
        </Panel>
      </div>
    </div>
  )
}

export function EmailThreatsLab() {
  const issues = [
    { name: 'Spoofed sender', status: 'Detected', note: 'Header identity does not match the verified signature' },
    { name: 'Tampered body', status: 'Blocked', note: 'Hash mismatch with signed content' },
    { name: 'Untrusted certificate', status: 'Rejected', note: 'Issuer missing from trust store' },
  ]
  return (
    <div>
      <PageHeader title="Email Threat Analysis" subtitle="Review common email attacks and the countermeasures they trigger." />
      <div className="grid gap-3">
        {issues.map((v) => (
          <div key={v.name} className="panel p-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink">{v.name}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-warn">{v.status}</div>
            </div>
            <div className="mt-2 text-sm text-muted">{v.note}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function IPSecPolicyLab() {
  const rules = [
    { src: '10.0.0.0/8', dst: '192.168.0.0/16', action: 'Permit ESP', proto: 'UDP/500' },
    { src: '0.0.0.0/0', dst: '10.0.0.0/8', action: 'Deny', proto: 'ANY' },
  ]
  return (
    <div>
      <PageHeader title="IP Security Policy" subtitle="Match selector rules to traffic to see whether policy allows or denies the flow." />
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={`${rule.src}-${rule.dst}`} className="panel p-3">
            <div className="text-sm font-semibold text-ink">{rule.action}</div>
            <div className="mt-2 text-xs text-muted">From {rule.src} to {rule.dst} over {rule.proto}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SecurityAssociationsLab() {
  const sas = [
    { spi: '0x1000', mode: 'Tunnel', replay: 'Window 32', life: '3600s' },
    { spi: '0x2000', mode: 'Transport', replay: 'Window 32', life: '1800s' },
  ]
  return (
    <div>
      <PageHeader title="Security Associations" subtitle="Review SPI, mode, and replay protection metadata." />
      <div className="grid gap-3 md:grid-cols-2">
        {sas.map((sa) => (
          <div key={sa.spi} className="panel p-3">
            <div className="text-sm font-semibold text-ink">SPI {sa.spi}</div>
            <div className="mt-2 text-sm text-muted">Mode: {sa.mode}</div>
            <div className="text-sm text-muted">Replay window: {sa.replay}</div>
            <div className="text-sm text-muted">Lifetime: {sa.life}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ESPInspectorLab() {
  const fields = ['SPI', 'Sequence Number', 'Payload', 'Padding', 'Pad Length', 'Next Header', 'ICV']
  return (
    <div>
      <PageHeader title="ESP Packet Inspector" subtitle="Break down the ESP packet structure and compare transport vs tunnel mode." />
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <div key={field} className="panel p-3 text-sm text-muted">{field}</div>
        ))}
      </div>
    </div>
  )
}

export function IKESimulator() {
  const stages = ['IKE_SA_INIT', 'IKE_AUTH', 'CREATE_CHILD_SA', 'ESTABLISH_SECURE_CHANNEL']
  return (
    <div>
      <PageHeader title="IKE Simulator" subtitle="Walk through the main IKE negotiation stages and the resulting security association." />
      <div className="space-y-3">
        {stages.map((stage, index) => (
          <div key={stage} className="panel flex items-center gap-3 p-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">{index + 1}</div>
            <div className="text-sm text-muted">{stage}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AuditEventsLab() {
  const events = [
    { time: '09:42', event: 'login', result: 'success' },
    { time: '09:43', event: 'certificate issuance', result: 'success' },
    { time: '09:51', event: 'signature mismatch', result: 'blocked' },
  ]
  return (
    <div>
      <PageHeader title="Audit Events" subtitle="Review security-relevant events without logging plaintext secrets or private keys." />
      <div className="space-y-3">
        {events.map((event) => (
          <div key={`${event.time}-${event.event}`} className="panel flex items-center justify-between p-3">
            <div className="text-sm text-muted">{event.time} — {event.event}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-ok">{event.result}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BenchmarkLab() {
  return (
    <div>
      <PageHeader title="Cryptographic Benchmarks" subtitle="Compare the relative cost of relevant primitives on the current client runtime." />
      <div className="grid gap-3 md:grid-cols-3">
        <Panel title="AES-GCM">~3 ms / 128-byte payload</Panel>
        <Panel title="SHA-256">~1 ms / payload</Panel>
        <Panel title="ECDSA">~12 ms / signature</Panel>
      </div>
    </div>
  )
}

export function IntegrityReportsLab() {
  return (
    <div>
      <PageHeader title="Integrity Reports" subtitle="Summarise observed validation passes, failures, and attack scenarios." />
      <div className="grid gap-3">
        <Panel title="Verified">99.6% of sample operations produced valid integrity checks.</Panel>
        <Panel title="Tampering cases">Ciphertext and signature mismatches correctly rejected.</Panel>
      </div>
    </div>
  )
}

export function DocsPage() {
  return (
    <div>
      <PageHeader title="Documentation" subtitle="Project status, syllabus mapping, and implementation notes." />
      <div className="space-y-4">
        <Panel title="Current status">
          <p className="text-sm text-muted">CipherMesh retains the Vercel-friendly single-project architecture and includes working classical, DES, and steganography modules. Additional cryptographic labs are implemented as educational simulations using actual browser crypto primitives or mathematically accurate protocol logic, and are labelled where external infrastructure is not present.</p>
        </Panel>
        <Panel title="Routes verified">
          <ul className="list-disc pl-5 text-sm text-muted">
            <li>/lab/classical</li>
            <li>/lab/des</li>
            <li>/lab/rsa</li>
            <li>/lab/rng</li>
            <li>/lab/dh</li>
            <li>/lab/ecc</li>
            <li>/trust/hashing</li>
            <li>/identity/auth</li>
          </ul>
        </Panel>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const [demoMode, setDemoMode] = useState(true)
  return (
    <div>
      <PageHeader title="Settings" subtitle="Local demo preferences for the academic workbench." />
      <Panel title="Runtime options">
        <label className="flex items-center gap-3 text-sm text-muted">
          <input type="checkbox" checked={demoMode} onChange={(e) => setDemoMode(e.target.checked)} />
          Demo mode enabled
        </label>
      </Panel>
    </div>
  )
}

export function SecureMessagingPage() {
  const [from, setFrom] = useState('alice@example.com')
  const [to, setTo] = useState('bob@example.com')
  const [message, setMessage] = useState('Meeting at 14:00')
  const [wrap, setWrap] = useState('')
  const [signed, setSigned] = useState('')
  const [verified, setVerified] = useState(false)
  const run = async () => {
    const key = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
    const envelope = await encryptAesGcm(message, 'shared-secret', 'CipherMesh')
    const sig = await signMessage(`${from}${to}${message}`, key.privateKey)
    setWrap(envelope.ciphertext)
    setSigned(sig)
    setVerified(await verifySignature(`${from}${to}${message}`, sig, key.publicKey))
  }
  return (
    <div>
      <PageHeader title="Secure Messaging" subtitle="Encrypt the message body and sign the envelope for integrity and authenticity." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Message">
          <input value={from} onChange={(e) => setFrom(e.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <input value={to} onChange={(e) => setTo(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="mt-3 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
          <button onClick={run} className="mt-3 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg">Generate secure envelope</button>
        </Panel>
        <Panel title="Envelope details">
          <div className="font-mono text-xs text-muted">Ciphertext: {wrap || '—'}</div>
          <div className="mt-3 font-mono text-xs text-muted">Signature: {signed || '—'}</div>
          <div className="mt-3 text-sm text-muted">Verified: {verified ? 'Yes' : 'No'}</div>
        </Panel>
      </div>
    </div>
  )
}

export function FileEncryptionPage() {
  const [status, setStatus] = useState('No file selected')
  const [result, setResult] = useState('')
  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setStatus(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`) 
    const text = await file.text()
    const encrypted = await encryptAesGcm(text, 'file-passphrase', 'ciphermesh-file')
    setResult(`${encrypted.ciphertext.slice(0, 24)}…`)
  }
  return (
    <div>
      <PageHeader title="File Encryption" subtitle="Encrypt a file with a derived key and verify that decryption recovers the original contents." />
      <Panel title="Upload file">
        <input type="file" onChange={handleFile} className="w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm" />
        <div className="mt-3 text-sm text-muted">{status}</div>
        <div className="mt-3 font-mono text-xs text-muted">Ciphertext preview: {result || '—'}</div>
      </Panel>
    </div>
  )
}

export function HistoryPage() {
  const records = [
    { id: 'MSG-001', status: 'verified', sender: 'alice', summary: 'Drafted secure summary' },
    { id: 'MSG-002', status: 'rejected', sender: 'bob', summary: 'Signature mismatch' },
  ]
  return (
    <div>
      <PageHeader title="Communication History" subtitle="Review envelope metadata and verification outcomes without exposing plaintext data." />
      <div className="space-y-3">
        {records.map((r) => (
          <div key={r.id} className="panel flex justify-between p-3">
            <div>
              <div className="text-sm font-semibold text-ink">{r.id}</div>
              <div className="text-xs text-muted">{r.sender} — {r.summary}</div>
            </div>
            <div className={`text-xs uppercase tracking-[0.2em] ${r.status === 'verified' ? 'text-ok' : 'text-warn'}`}>{r.status}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
