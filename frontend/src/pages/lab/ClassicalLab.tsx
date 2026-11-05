import { useState, useEffect } from 'react'
import {
  Binary,
  Cpu,
  FileKey2,
  Grid3X3,
  KeyRound,
  Layers,
  Lock,
  Shield,
  Sliders,
  Unlock,
  AlertTriangle,
  Info,
} from 'lucide-react'
import { DashboardCard, PageHeader, SecurityAlert } from '../../components/ui'
import { CipherOutputPanel } from '../../components/crypto/CipherOutputPanel'
import { KeyDisplay } from '../../components/crypto/KeyDisplay'
import { AlphabetVisualizer } from '../../components/crypto/AlphabetVisualizer'
import { MatrixVisualizer } from '../../components/crypto/MatrixVisualizer'
import { FrequencyChart } from '../../components/crypto/FrequencyChart'
import { XORVisualizer } from '../../components/crypto/XORVisualizer'
import {
  classicalApi,
  type CaesarResponse,
  type MonoalphabeticResponse,
  type PlayfairResponse,
  type HillResponse,
  type VigenereResponse,
  type OTPResponse,
  type OTPReuseResponse,
} from '../../lib/api'

type TabType =
  | 'caesar'
  | 'monoalphabetic'
  | 'playfair'
  | 'hill'
  | 'vigenere'
  | 'otp'
  | 'stego'
  | 'models'

export default function ClassicalLab() {
  const [activeTab, setActiveTab] = useState<TabType>('caesar')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* --- Caesar State --- */
  const [caesarInput, setCaesarInput] = useState('THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG')
  const [caesarShift, setCaesarShift] = useState(3)
  const [caesarData, setCaesarData] = useState<CaesarResponse | null>(null)

  /* --- Monoalphabetic State --- */
  const [monoInput, setMonoInput] = useState('SECURITY THROUGH OBSCURITY IS NOT ENOUGH')
  const [monoKey, setMonoKey] = useState('QWERTYUIOPASDFGHJKLZXCVBNM')
  const [monoData, setMonoData] = useState<MonoalphabeticResponse | null>(null)

  /* --- Playfair State --- */
  const [playfairInput, setPlayfairInput] = useState('BALLOON TRIP AT DAWN')
  const [playfairKey, setPlayfairKey] = useState('MONARCHY')
  const [playfairData, setPlayfairData] = useState<PlayfairResponse | null>(null)

  /* --- Hill State --- */
  const [hillInput, setHillInput] = useState('HELP')
  const [hillDim, setHillDim] = useState<2 | 3>(2)
  const [hillMatrix2, setHillMatrix2] = useState<number[][]>([
    [9, 4],
    [5, 7],
  ])
  const [hillMatrix3, setHillMatrix3] = useState<number[][]>([
    [6, 24, 1],
    [13, 16, 10],
    [20, 17, 15],
  ])
  const [hillData, setHillData] = useState<HillResponse | null>(null)

  /* --- Vigenere State --- */
  const [vigenereInput, setVigenereInput] = useState('ATTACK AT DAWN ON THE BORDER')
  const [vigenereKey, setVigenereKey] = useState('LEMON')
  const [vigenereData, setVigenereData] = useState<VigenereResponse | null>(null)

  /* --- OTP State --- */
  const [otpInput, setOtpInput] = useState('TOP SECRET CIPHERMESH INTEL')
  const [otpKey, setOtpKey] = useState('')
  const [otpData, setOtpData] = useState<OTPResponse | null>(null)
  const [otpReuseData, setOtpReuseData] = useState<OTPReuseResponse | null>(null)

  // Auto-generate initial OTP key on load
  useEffect(() => {
    if (!otpKey) {
      classicalApi
        .generateOtpKey(otpInput.length)
        .then((res) => setOtpKey(res.key))
        .catch(() => {})
    }
  }, [otpInput.length, otpKey])

  /* ================= Execution Handlers ================= */

  // Caesar
  const handleCaesar = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const res = decrypt
        ? await classicalApi.decryptCaesar(caesarInput, caesarShift)
        : await classicalApi.encryptCaesar(caesarInput, caesarShift)
      setCaesarData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Monoalphabetic
  const handleMono = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const res = decrypt
        ? await classicalApi.decryptMono(monoInput, monoKey)
        : await classicalApi.encryptMono(monoInput, monoKey)
      setMonoData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateMonoKey = async () => {
    try {
      const res = await classicalApi.generateMonoKey()
      setMonoKey(res.key)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // Playfair
  const handlePlayfair = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const res = decrypt
        ? await classicalApi.decryptPlayfair(playfairInput, playfairKey)
        : await classicalApi.encryptPlayfair(playfairInput, playfairKey)
      setPlayfairData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Hill
  const handleHill = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const activeMatrix = hillDim === 2 ? hillMatrix2 : hillMatrix3
      const res = decrypt
        ? await classicalApi.decryptHill(hillInput, activeMatrix)
        : await classicalApi.encryptHill(hillInput, activeMatrix)
      setHillData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Vigenere
  const handleVigenere = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const res = decrypt
        ? await classicalApi.decryptVigenere(vigenereInput, vigenereKey)
        : await classicalApi.encryptVigenere(vigenereInput, vigenereKey)
      setVigenereData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // OTP
  const handleOtp = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const res = decrypt
        ? await classicalApi.decryptOtp(otpInput, otpKey)
        : await classicalApi.encryptOtp(otpInput, otpKey)
      setOtpData(res)
      setOtpReuseData(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateOtpKey = async () => {
    try {
      const res = await classicalApi.generateOtpKey(otpInput.length)
      setOtpKey(res.key)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleOtpReuseDemo = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await classicalApi.demonstrateOtpReuse(
        'ATTACKATDAWN',
        'RETREATNOWXX',
        'SECRETKEYONE'
      )
      setOtpReuseData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classical & Symmetric Cryptography Laboratory"
        subtitle="Explore substitution, transposition, polyalphabetic ciphers, modular linear algebra, and the symmetric cipher model (VTU BCS703 Module 1)."
      />

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {[
          { id: 'caesar', label: 'Caesar Cipher', icon: Sliders },
          { id: 'monoalphabetic', label: 'Monoalphabetic', icon: KeyRound },
          { id: 'playfair', label: 'Playfair Cipher', icon: Grid3X3 },
          { id: 'hill', label: 'Hill Cipher', icon: Layers },
          { id: 'vigenere', label: 'Vigenère (Polyalphabetic)', icon: FileKey2 },
          { id: 'otp', label: 'One-Time Pad', icon: Binary },
          { id: 'stego', label: 'Steganography (LSB)', icon: Cpu },
          { id: 'models', label: 'Symmetric Cipher Models', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as TabType)
                setError(null)
              }}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/40 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                  : 'border border-line/60 bg-card text-muted hover:border-accent/40 hover:text-ink'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Error Banner */}
      {error && (
        <SecurityAlert kind="danger" title="Operation Failed">
          {error}
        </SecurityAlert>
      )}

      {/* =========================================================================
          TAB 1: CAESAR CIPHER
      ========================================================================= */}
      {activeTab === 'caesar' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Input & Shift Key" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Input Text</label>
                <textarea
                  rows={3}
                  value={caesarInput}
                  onChange={(e) => setCaesarInput(e.target.value)}
                  placeholder="Enter plaintext or ciphertext..."
                  className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink outline-none focus:border-accent/60 placeholder:text-muted/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-ink">Shift Parameter (k)</span>
                  <span className="font-mono text-accent font-semibold">{caesarShift} (mod 26)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value, 10))}
                  className="w-full accent-accent cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-muted mt-1">
                  <span>0 (No shift)</span>
                  <span>13 (ROT13)</span>
                  <span>25</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleCaesar(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCaesar(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Decrypt</span>
                </button>
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={caesarData ? caesarData.output_text : ''}
                operation={caesarData ? caesarData.operation : 'encryption'}
                auxInfo={caesarData ? `Shift k = ${caesarData.shift}` : undefined}
              />

              {caesarData && (
                <AlphabetVisualizer
                  mapping={caesarData.alphabet_mapping}
                  title={`Alphabet Shift Mapping (k = ${caesarData.shift})`}
                />
              )}
            </div>
          </div>

          {caesarData && (
            <FrequencyChart
              inputFreqs={caesarData.frequencies.input}
              outputFreqs={caesarData.frequencies.output}
              standardFreqs={caesarData.frequencies.english_standard}
            />
          )}

          {caesarData && caesarData.steps.length > 0 && (
            <DashboardCard title="Step-by-Step Character Substitution Trace">
              <div className="overflow-x-auto max-h-56">
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-line text-left text-[11px] text-muted">
                      <th className="py-2 px-3">Pos</th>
                      <th className="py-2 px-3">Input</th>
                      <th className="py-2 px-3">Index</th>
                      <th className="py-2 px-3">Shift Formula</th>
                      <th className="py-2 px-3">Result Index</th>
                      <th className="py-2 px-3">Result Char</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/30">
                    {caesarData.steps.slice(0, 30).map((s, idx) => (
                      <tr key={idx} className="hover:bg-bg/40">
                        <td className="py-1.5 px-3 text-muted">{s.position}</td>
                        <td className="py-1.5 px-3 font-semibold text-ink">{s.char}</td>
                        <td className="py-1.5 px-3 text-muted">{s.orig_idx ?? '-'}</td>
                        <td className="py-1.5 px-3 text-accent">{s.formula}</td>
                        <td className="py-1.5 px-3 text-muted">{s.new_idx ?? '-'}</td>
                        <td className="py-1.5 px-3 font-semibold text-teal">{s.result_char}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: MONOALPHABETIC CIPHER
      ========================================================================= */}
      {activeTab === 'monoalphabetic' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Substitution Key & Input" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Input Text</label>
                <textarea
                  rows={3}
                  value={monoInput}
                  onChange={(e) => setMonoInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink outline-none focus:border-accent/60 placeholder:text-muted/40"
                />
              </div>

              <KeyDisplay
                label="26-Letter Substitution Alphabet"
                keyValue={monoKey}
                onChange={setMonoKey}
                maxLength={26}
                onGenerateRandom={handleGenerateMonoKey}
                description="Must contain all 26 uppercase letters without repetition."
                isValid={monoKey.length === 26 && new Set(monoKey.toUpperCase()).size === 26}
                validationMessage={
                  monoKey.length === 26 && new Set(monoKey.toUpperCase()).size === 26
                    ? 'Valid 26-char bijection'
                    : 'Requires 26 unique letters'
                }
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleMono(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleMono(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Decrypt</span>
                </button>
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={monoData ? monoData.output_text : ''}
                operation={monoData ? monoData.operation : 'encryption'}
                auxInfo="Arbitrary permutation of 26! ≈ 4.03 × 10²⁶ keys"
              />

              {monoData && (
                <AlphabetVisualizer
                  mapping={monoData.alphabet_mapping}
                  title="Monoalphabetic Bijection (Plaintext A-Z &rarr; Cipher Alphabet)"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: PLAYFAIR CIPHER
      ========================================================================= */}
      {activeTab === 'playfair' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Key & Digraph Input" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Input Text</label>
                <textarea
                  rows={3}
                  value={playfairInput}
                  onChange={(e) => setPlayfairInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink outline-none focus:border-accent/60 placeholder:text-muted/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Playfair Keyword</label>
                <input
                  type="text"
                  value={playfairKey}
                  onChange={(e) => setPlayfairKey(e.target.value.toUpperCase())}
                  placeholder="e.g. MONARCHY"
                  className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 font-mono text-sm tracking-wider text-ink outline-none focus:border-accent/60"
                />
                <p className="mt-1 text-[11px] text-muted">
                  I and J share a single matrix cell. Duplicate digraph letters receive filler 'X'.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handlePlayfair(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlayfair(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Decrypt</span>
                </button>
              </div>

              <div className="rounded-lg border border-line bg-bg p-3 text-xs space-y-1.5 text-muted">
                <p className="font-semibold text-ink">Three Transformation Rules:</p>
                <p><strong className="text-accent">1. Same Row:</strong> Shift right (enc) / left (dec) mod 5.</p>
                <p><strong className="text-teal">2. Same Column:</strong> Shift down (enc) / up (dec) mod 5.</p>
                <p><strong className="text-warn">3. Rectangle:</strong> Swap column coordinates.</p>
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={playfairData ? playfairData.output_text : ''}
                operation={playfairData ? playfairData.operation : 'encryption'}
                auxInfo={
                  playfairData
                    ? `Digraphs: ${playfairData.prepared_digraphs.join(' ')}`
                    : undefined
                }
              />

              {playfairData && (
                <MatrixVisualizer
                  matrix={playfairData.matrix}
                  title={`Playfair 5×5 Key Matrix (Key: "${playfairKey}")`}
                  subtitle="Letters arranged left-to-right, then alphabetical remainder (J omitted)"
                />
              )}
            </div>
          </div>

          {playfairData && playfairData.steps.length > 0 && (
            <DashboardCard title="Digraph Transformation Walkthrough">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {playfairData.steps.map((st) => (
                  <div key={st.pair_index} className="rounded-lg border border-line bg-bg p-3 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-ink">
                        Pair #{st.pair_index + 1}: {st.in_pair[0]}{st.in_pair[1]} &rarr;{' '}
                        <span className="text-accent">{st.out_pair[0]}{st.out_pair[1]}</span>
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase font-semibold ${
                          st.rule === 'same_row'
                            ? 'bg-accent/15 text-accent border border-accent/30'
                            : st.rule === 'same_col'
                            ? 'bg-teal/15 text-teal border border-teal/30'
                            : 'bg-warn/15 text-warn border border-warn/30'
                        }`}
                      >
                        {st.rule_name}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-relaxed">{st.explanation}</p>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: HILL CIPHER
      ========================================================================= */}
      {activeTab === 'hill' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Matrix Parameters & Plaintext" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Input Text</label>
                <textarea
                  rows={2}
                  value={hillInput}
                  onChange={(e) => setHillInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink outline-none focus:border-accent/60 placeholder:text-muted/40"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-ink">Matrix Dimension</span>
                  <div className="flex rounded-md border border-line bg-bg p-0.5 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setHillDim(2)}
                      className={`rounded px-2 py-0.5 ${hillDim === 2 ? 'bg-accent text-bg font-bold' : 'text-muted'}`}
                    >
                      2&times;2
                    </button>
                    <button
                      type="button"
                      onClick={() => setHillDim(3)}
                      className={`rounded px-2 py-0.5 ${hillDim === 3 ? 'bg-accent text-bg font-bold' : 'text-muted'}`}
                    >
                      3&times;3
                    </button>
                  </div>
                </div>

                <div className="rounded-lg border border-line bg-bg p-3 space-y-2">
                  <span className="text-[11px] text-muted block">Matrix Coefficients (mod 26):</span>
                  {hillDim === 2 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {hillMatrix2.map((row, r) =>
                        row.map((val, c) => (
                          <input
                            key={`${r}-${c}`}
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const newM = hillMatrix2.map((rw) => [...rw])
                              newM[r][c] = parseInt(e.target.value, 10) || 0
                              setHillMatrix2(newM)
                            }}
                            className="rounded border border-line bg-card p-1.5 text-center font-mono text-sm text-ink outline-none focus:border-accent"
                          />
                        ))
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {hillMatrix3.map((row, r) =>
                        row.map((val, c) => (
                          <input
                            key={`${r}-${c}`}
                            type="number"
                            value={val}
                            onChange={(e) => {
                              const newM = hillMatrix3.map((rw) => [...rw])
                              newM[r][c] = parseInt(e.target.value, 10) || 0
                              setHillMatrix3(newM)
                            }}
                            className="rounded border border-line bg-card p-1.5 text-center font-mono text-sm text-ink outline-none focus:border-accent"
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleHill(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleHill(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Decrypt</span>
                </button>
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={hillData ? hillData.output_text : ''}
                operation={hillData ? hillData.operation : 'encryption'}
                auxInfo={
                  hillData
                    ? `det(K) = ${hillData.determinant} (mod 26 = ${hillData.determinant_mod_26}) &bull; det⁻¹ = ${hillData.modular_inverse_det}`
                    : undefined
                }
              />

              {hillData && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <MatrixVisualizer
                    matrix={hillData.key_matrix}
                    title="Key Matrix K"
                    subtitle="Forward encryption transformation"
                  />
                  <MatrixVisualizer
                    matrix={hillData.inverse_matrix}
                    title="Modular Inverse Matrix K⁻¹ (mod 26)"
                    subtitle={`K⁻¹ = det⁻¹ · adj(K) mod 26 (${hillData.modular_inverse_det} · adj(K))` }
                  />
                </div>
              )}
            </div>
          </div>

          {hillData && (
            <DashboardCard title="Vector Modular Multiplication Trace (C = K · P mod 26)">
              <div className="space-y-3">
                {hillData.steps.map((st) => (
                  <div key={st.block_index} className="rounded-lg border border-line bg-bg p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-ink">
                        Block #{st.block_index + 1}: [{st.input_chars.join(', ')}] &rarr; [
                        {st.output_chars.join(', ')}]
                      </span>
                      <span className="font-mono text-muted text-[11px]">
                        Vector: [{st.input_vector.join(', ')}] &rarr; [{st.output_vector.join(', ')}]
                      </span>
                    </div>

                    <div className="divide-y divide-line/40 pt-1">
                      {st.arithmetic.map((ar, i) => (
                        <div key={i} className="py-1.5 font-mono text-xs text-accent-2 flex items-center justify-between">
                          <span>Row {ar.row_index}: {ar.formula}</span>
                          <span className="font-bold text-teal">{ar.result_char} ({ar.result_value})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: VIGENERE (POLYALPHABETIC) CIPHER
      ========================================================================= */}
      {activeTab === 'vigenere' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Keyword & Input" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Input Text</label>
                <textarea
                  rows={3}
                  value={vigenereInput}
                  onChange={(e) => setVigenereInput(e.target.value)}
                  placeholder="Enter text..."
                  className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink outline-none focus:border-accent/60 placeholder:text-muted/40"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Repeating Keyword</label>
                <input
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value.toUpperCase())}
                  placeholder="e.g. LEMON"
                  className="w-full rounded-lg border border-line bg-bg px-3.5 py-2 font-mono text-sm tracking-wider text-ink outline-none focus:border-accent/60"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleVigenere(false)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVigenere(true)}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Decrypt</span>
                </button>
              </div>

              <div className="rounded-lg border border-line bg-bg p-3 text-xs text-muted leading-relaxed">
                <p className="font-semibold text-ink mb-1">Polyalphabetic Principle:</p>
                Uses multiple substitution alphabets cyclically dictated by the keyword. Flatlines basic monoalphabetic frequency analysis.
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={vigenereData ? vigenereData.output_text : ''}
                operation={vigenereData ? vigenereData.operation : 'encryption'}
                auxInfo={
                  vigenereData
                    ? `Aligned Key: ${vigenereData.aligned_key}`
                    : undefined
                }
              />

              {vigenereData && (
                <DashboardCard title="Keyword Alignment Visualizer">
                  <div className="rounded-lg border border-line bg-bg p-3 font-mono text-xs overflow-x-auto">
                    <div className="text-muted tracking-widest whitespace-pre">
                      PLAIN : {vigenereData.input_text}
                    </div>
                    <div className="text-accent tracking-widest whitespace-pre">
                      KEY   : {vigenereData.aligned_key}
                    </div>
                    <div className="text-teal font-bold tracking-widest whitespace-pre">
                      CIPHER: {vigenereData.output_text}
                    </div>
                  </div>
                </DashboardCard>
              )}
            </div>
          </div>

          {vigenereData && (
            <DashboardCard title="Tabula Recta (26×26 Vigenère Tableau Preview)">
              <div className="overflow-x-auto max-h-60 border border-line rounded-lg">
                <table className="w-full border-collapse font-mono text-[10px]">
                  <tbody>
                    {vigenereData.tabula_recta.map((row, r) => (
                      <tr key={r} className="hover:bg-accent/10">
                        <td className="p-1 font-bold text-accent bg-card border-r border-line text-center w-6">
                          {chr(ord('A') + r)}
                        </td>
                        {row.map((val, c) => (
                          <td key={c} className="p-1 text-center text-muted/80">
                            {val}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: ONE-TIME PAD
      ========================================================================= */}
      {activeTab === 'otp' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Plaintext & Pad Key" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Input Text</label>
                <textarea
                  rows={2}
                  value={otpInput}
                  onChange={(e) => {
                    setOtpInput(e.target.value)
                  }}
                  placeholder="Enter message..."
                  className="w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs text-ink outline-none focus:border-accent/60 placeholder:text-muted/40"
                />
              </div>

              <KeyDisplay
                label="One-Time Pad Key (Exact Length Required)"
                keyValue={otpKey}
                onChange={setOtpKey}
                maxLength={otpInput.length}
                onGenerateRandom={handleGenerateOtpKey}
                description="Must be purely random, as long as the plaintext, and never reused."
                isValid={otpKey.length === otpInput.length && otpInput.length > 0}
                validationMessage={
                  otpKey.length === otpInput.length
                    ? 'Length match'
                    : `Mismatch (${otpKey.length}/${otpInput.length})`
                }
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleOtp(false)}
                  disabled={loading || otpKey.length !== otpInput.length}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>XOR Encrypt</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOtp(true)}
                  disabled={loading || otpKey.length !== otpInput.length}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>XOR Decrypt</span>
                </button>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOtpReuseDemo}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/20 transition-colors"
                >
                  <AlertTriangle size={13} />
                  <span>Simulate Key Reuse Vulnerability</span>
                </button>
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={otpData ? otpData.output_hex : ''}
                hex={otpData ? otpData.output_hex : undefined}
                binary={otpData ? otpData.output_binary : undefined}
                operation="encryption"
                auxInfo="Vernam cipher bitwise XOR implementation"
              />

              {otpData && (
                <div className="rounded-xl border border-line bg-card p-4 space-y-2 text-xs leading-relaxed">
                  <p className="font-semibold text-accent flex items-center gap-1.5">
                    <Info size={14} /> Shannon's Theorem of Perfect Secrecy
                  </p>
                  <p className="text-muted">{otpData.security_notes.perfect_secrecy}</p>
                </div>
              )}
            </div>
          </div>

          {/* XOR breakdown or Key Reuse View */}
          {otpReuseData ? (
            <XORVisualizer reuseData={otpReuseData} />
          ) : otpData ? (
            <XORVisualizer steps={otpData.steps} />
          ) : null}
        </div>
      )}

      {/* =========================================================================
          TAB 7: STEGANOGRAPHY (LSB Preview)
      ========================================================================= */}
      {activeTab === 'stego' && (
        <div className="space-y-6">
          <SecurityAlert
            kind="info"
            title="LSB Steganography Engine — Scheduled for Substage 2D"
          >
            The Least Significant Bit (LSB) image steganography module is scheduled for implementation in Substage 2D with PNG image upload, capacity calculation, binary embedding, and message extraction.
          </SecurityAlert>

          <DashboardCard title="LSB Steganography Concept Overview">
            <div className="space-y-4 text-xs leading-relaxed text-muted">
              <p>
                Steganography is the practice of concealing a secret message within an ordinary, non-secret file or medium in order to prevent detection of the message's existence.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-line bg-bg p-3">
                  <h5 className="font-bold text-ink mb-1">Payload Capacity</h5>
                  <p>In an RGB PNG image, each pixel contains 3 color channels (8 bits each). Embedding 1 bit per color channel yields 3 bits per pixel of hidden capacity.</p>
                </div>
                <div className="rounded-lg border border-line bg-bg p-3">
                  <h5 className="font-bold text-ink mb-1">Perceptual Transparency</h5>
                  <p>Altering only the least significant bit (bit 0) alters the luminance by at most 1/256 (&plusmn;0.39%), completely invisible to the human visual system.</p>
                </div>
                <div className="rounded-lg border border-line bg-bg p-3">
                  <h5 className="font-bold text-ink mb-1">Detection & Steganalysis</h5>
                  <p>Statistical anomalies in chi-square tests, sample pairs analysis, or visual bit-plane slicing can reveal steganographic tampering.</p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}

      {/* =========================================================================
          TAB 8: SYMMETRIC CIPHER MODELS & SECURITY PRINCIPLES
      ========================================================================= */}
      {activeTab === 'models' && (
        <div className="space-y-6">
          <DashboardCard title="Model for Network Security & Symmetric Encryption">
            <div className="space-y-6">
              {/* Architecture SVG diagram */}
              <div className="rounded-xl border border-line bg-bg/80 p-4">
                <svg viewBox="0 0 800 220" className="w-full" role="img" aria-label="Symmetric Cipher Model">
                  {/* Sender */}
                  <rect x="20" y="40" width="130" height="70" rx="8" fill="#111c2d" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="85" y="70" textAnchor="middle" fill="#eaf2ff" fontSize="12" fontWeight="bold">Sender</text>
                  <text x="85" y="90" textAnchor="middle" fill="#94a3b8" fontSize="10 font-mono">Plaintext X</text>

                  {/* Flow Arrow to Encryption */}
                  <line x1="150" y1="75" x2="220" y2="75" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrow)" />

                  {/* Encryption Box */}
                  <rect x="220" y="40" width="140" height="70" rx="8" fill="#162338" stroke="#22d3ee" strokeWidth="2" />
                  <text x="290" y="70" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">Encryption Alg</text>
                  <text x="290" y="90" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">Y = E(K, X)</text>

                  {/* Key Source */}
                  <rect x="360" y="140" width="120" height="50" rx="8" fill="#111c2d" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="420" y="165" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">Secret Key K</text>
                  <text x="420" y="180" textAnchor="middle" fill="#94a3b8" fontSize="9">Secure Channel</text>

                  {/* Key Distribution lines */}
                  <path d="M 370 140 L 370 110 L 330 110" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
                  <path d="M 470 140 L 470 110 L 510 110" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />

                  {/* Insecure Channel */}
                  <line x1="360" y1="75" x2="480" y2="75" stroke="#f87171" strokeWidth="2" strokeDasharray="4 4" className="flow" />
                  <text x="420" y="65" textAnchor="middle" fill="#f87171" fontSize="10 font-mono">Ciphertext Y</text>
                  <text x="420" y="95" textAnchor="middle" fill="#94a3b8" fontSize="9">(Insecure Channel)</text>

                  {/* Decryption Box */}
                  <rect x="480" y="40" width="140" height="70" rx="8" fill="#162338" stroke="#22d3ee" strokeWidth="2" />
                  <text x="550" y="70" textAnchor="middle" fill="#22d3ee" fontSize="12" fontWeight="bold">Decryption Alg</text>
                  <text x="550" y="90" textAnchor="middle" fill="#94a3b8" fontSize="10" fontFamily="monospace">X = D(K, Y)</text>

                  {/* Flow Arrow to Recipient */}
                  <line x1="620" y1="75" x2="680" y2="75" stroke="#38bdf8" strokeWidth="2" />

                  {/* Recipient */}
                  <rect x="680" y="40" width="100" height="70" rx="8" fill="#111c2d" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="730" y="70" textAnchor="middle" fill="#eaf2ff" fontSize="12" fontWeight="bold">Recipient</text>
                  <text x="730" y="90" textAnchor="middle" fill="#94a3b8" fontSize="10 font-mono">Plaintext X</text>
                </svg>
              </div>

              {/* Theoretical Principles */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-line bg-bg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-ink">Kerckhoffs's Principle</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    A cryptosystem should be secure even if everything about the system, except the key, is public knowledge. Security through obscurity is fundamentally flawed.
                  </p>
                </div>
                <div className="rounded-lg border border-line bg-bg p-4 space-y-2">
                  <h4 className="font-semibold text-sm text-ink">Shannon's Confusion & Diffusion</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    <strong>Confusion:</strong> Obscures the relationship between the key and the ciphertext (accomplished via complex non-linear substitution).
                    <br />
                    <strong>Diffusion:</strong> Spreads the statistical structure of the plaintext over the entire ciphertext (accomplished via transposition and permutation).
                  </p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  )
}

function chr(code: number) {
  return String.fromCharCode(code)
}
function ord(char: string) {
  return char.charCodeAt(0)
}
