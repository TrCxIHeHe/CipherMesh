import { useState } from 'react'
import {
  Binary,
  Layers,
  Lock,
  Unlock,
  Sliders,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react'
import { DashboardCard, PageHeader, SecurityAlert } from '../../components/ui'
import { CipherOutputPanel } from '../../components/crypto/CipherOutputPanel'
import { desApi, type DESBlockResponse, type DESAvalancheResponse } from '../../lib/api'

type DESTab = 'workbench' | 'avalanche' | 'principles'

export default function DESLab() {
  const [activeTab, setActiveTab] = useState<DESTab>('workbench')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Workbench State
  const [plaintextHex, setPlaintextHex] = useState('0123456789ABCDEF')
  const [keyHex, setKeyHex] = useState('133457799BBCDFF1')
  const [desData, setDesData] = useState<DESBlockResponse | null>(null)
  const [selectedRound, setSelectedRound] = useState(1)

  // Avalanche State
  const [avalancheInput, setAvalancheInput] = useState('0123456789ABCDEF')
  const [avalancheKey, setAvalancheKey] = useState('133457799BBCDFF1')
  const [flipBit, setFlipBit] = useState(0)
  const [avalancheData, setAvalancheData] = useState<DESAvalancheResponse | null>(null)

  // Load NIST Known-Answer Test Preset
  const handleLoadKAT = () => {
    setPlaintextHex('0123456789ABCDEF')
    setKeyHex('133457799BBCDFF1')
    setError(null)
  }

  // Execute DES Operation
  const handleDES = async (decrypt: boolean) => {
    setLoading(true)
    setError(null)
    try {
      const res = decrypt
        ? await desApi.decrypt(plaintextHex, keyHex)
        : await desApi.encrypt(plaintextHex, keyHex)
      setDesData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Execute Avalanche Test
  const handleAvalanche = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await desApi.avalanche(avalancheInput, avalancheKey, flipBit)
      setAvalancheData(res)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const activeRoundData = desData?.rounds[selectedRound - 1]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Encryption Standard (DES) Workbench"
        subtitle="Educational 16-round Feistel network with intermediate state tracing, S-box substitution, and avalanche-effect analysis (VTU BCS703 Module 1)."
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line pb-3">
        {[
          { id: 'workbench', label: '16-Round Feistel Workbench', icon: Layers },
          { id: 'avalanche', label: 'Avalanche Effect Experiment', icon: Binary },
          { id: 'principles', label: 'Block Cipher Design Principles', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as DESTab)
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

      {error && (
        <SecurityAlert kind="danger" title="Operation Failed">
          {error}
        </SecurityAlert>
      )}

      {/* =========================================================================
          TAB 1: 16-ROUND FEISTEL WORKBENCH
      ========================================================================= */}
      {activeTab === 'workbench' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Block Parameters (64-Bit)" className="lg:col-span-1 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="font-medium text-ink">Input Block (16 Hex Digits = 64 Bits)</label>
                  <button
                    type="button"
                    onClick={handleLoadKAT}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1"
                  >
                    <span>Load NIST Vector</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  value={plaintextHex}
                  onChange={(e) => setPlaintextHex(e.target.value.toUpperCase())}
                  placeholder="0123456789ABCDEF"
                  className="w-full rounded-lg border border-line bg-bg p-2.5 font-mono text-sm tracking-widest text-ink outline-none focus:border-accent/60"
                />
                <span className="text-[10px] text-muted font-mono mt-1 block">
                  {plaintextHex.length} / 16 hex characters
                </span>
              </div>

              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">
                  64-Bit Secret Key (56 Effective + 8 Parity Bits)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={keyHex}
                  onChange={(e) => setKeyHex(e.target.value.toUpperCase())}
                  placeholder="133457799BBCDFF1"
                  className="w-full rounded-lg border border-line bg-bg p-2.5 font-mono text-sm tracking-widest text-ink outline-none focus:border-accent/60"
                />
                <span className="text-[10px] text-muted font-mono mt-1 block">
                  {keyHex.length} / 16 hex characters
                </span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDES(false)}
                  disabled={loading || plaintextHex.length !== 16 || keyHex.length !== 16}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
                >
                  <Lock size={13} />
                  <span>Encrypt Block</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDES(true)}
                  disabled={loading || plaintextHex.length !== 16 || keyHex.length !== 16}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 text-xs font-semibold text-ink hover:border-accent/50 transition-colors disabled:opacity-50"
                >
                  <Unlock size={13} />
                  <span>Decrypt Block</span>
                </button>
              </div>

              <div className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-[11px] text-warn leading-relaxed">
                <strong>Educational Security Warning:</strong> 56-bit DES is cryptographically broken due to its small key space (2⁵⁶ &approx; 7.2 &times; 10¹⁶ keys) and can be brute-forced in hours. It must NEVER be used in modern production systems.
              </div>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              <CipherOutputPanel
                output={desData ? desData.output_hex : ''}
                hex={desData ? desData.output_hex : undefined}
                binary={desData ? desData.output_bin : undefined}
                operation={desData ? desData.operation : 'encryption'}
                auxInfo={
                  desData
                    ? `Input IP: ${desData.ip_hex} &bull; Output FP: ${desData.output_hex}`
                    : undefined
                }
              />

              {desData && (
                <div className="rounded-xl border border-line bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                      16-Round Timeline (Select Round to Inspect)
                    </h4>
                    <span className="font-mono text-xs text-accent">Round {selectedRound} of 16</span>
                  </div>

                  {/* 16-Round button grid */}
                  <div className="grid grid-cols-8 sm:grid-cols-16 gap-1">
                    {desData.rounds.map((r) => (
                      <button
                        key={r.round}
                        type="button"
                        onClick={() => setSelectedRound(r.round)}
                        className={`rounded py-1.5 text-center font-mono text-xs font-semibold transition-all ${
                          selectedRound === r.round
                            ? 'bg-accent text-bg ring-2 ring-accent'
                            : 'border border-line/60 bg-bg text-muted hover:text-ink hover:border-accent/40'
                        }`}
                      >
                        R{r.round}
                      </button>
                    ))}
                  </div>

                  {/* Round Stepper Slider */}
                  <input
                    type="range"
                    min="1"
                    max="16"
                    value={selectedRound}
                    onChange={(e) => setSelectedRound(parseInt(e.target.value, 10))}
                    className="w-full accent-accent cursor-pointer mt-1"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Active Round Inspection Detail */}
          {activeRoundData && (
            <DashboardCard
              title={`Round ${activeRoundData.round} Feistel Step Deep Dive`}
              action={
                <span className="font-mono text-xs text-accent">
                  Key Schedule Step: {activeRoundData.key_schedule_round}
                </span>
              }
            >
              <div className="space-y-4">
                {/* Feistel Halves Progression */}
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-line bg-bg p-3">
                    <span className="text-[10px] text-muted block mb-0.5">L{activeRoundData.round - 1} (In)</span>
                    <span className="font-mono text-xs text-ink font-bold">{activeRoundData.left_in_hex}</span>
                    <span className="font-mono text-[9px] text-muted block truncate mt-1">{activeRoundData.left_in}</span>
                  </div>
                  <div className="rounded-lg border border-line bg-bg p-3">
                    <span className="text-[10px] text-muted block mb-0.5">R{activeRoundData.round - 1} (In)</span>
                    <span className="font-mono text-xs text-accent font-bold">{activeRoundData.right_in_hex}</span>
                    <span className="font-mono text-[9px] text-muted block truncate mt-1">{activeRoundData.right_in}</span>
                  </div>
                  <div className="rounded-lg border border-line bg-bg p-3">
                    <span className="text-[10px] text-muted block mb-0.5">L{activeRoundData.round} (Out = R{activeRoundData.round - 1})</span>
                    <span className="font-mono text-xs text-accent font-bold">{activeRoundData.left_out_hex}</span>
                    <span className="font-mono text-[9px] text-muted block truncate mt-1">{activeRoundData.left_out}</span>
                  </div>
                  <div className="rounded-lg border border-line bg-bg p-3">
                    <span className="text-[10px] text-muted block mb-0.5">R{activeRoundData.round} (Out = L &oplus; P)</span>
                    <span className="font-mono text-xs text-teal font-bold">{activeRoundData.right_out_hex}</span>
                    <span className="font-mono text-[9px] text-muted block truncate mt-1">{activeRoundData.right_out}</span>
                  </div>
                </div>

                {/* Internal Feistel Function f(R, K) Steps */}
                <div className="rounded-xl border border-line bg-bg/50 p-4 space-y-3">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-ink flex items-center gap-2">
                    <Sliders size={13} className="text-accent" />
                    <span>Feistel Function f(R{activeRoundData.round - 1}, K{activeRoundData.round}) Breakdown</span>
                  </h5>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-line bg-card p-3">
                      <span className="text-[11px] text-muted block mb-1">1. Expansion E(R) (32 &rarr; 48 bits)</span>
                      <code className="font-mono text-xs text-accent-2 block">{activeRoundData.expansion_hex}</code>
                    </div>
                    <div className="rounded-lg border border-line bg-card p-3">
                      <span className="text-[11px] text-muted block mb-1">2. Round Key K{activeRoundData.round} (48 bits)</span>
                      <code className="font-mono text-xs text-warn block">{activeRoundData.round_key_hex}</code>
                    </div>
                    <div className="rounded-lg border border-line bg-card p-3">
                      <span className="text-[11px] text-muted block mb-1">3. E(R) &oplus; K{activeRoundData.round} (48 bits)</span>
                      <code className="font-mono text-xs text-ink font-bold block">{activeRoundData.xor_hex}</code>
                    </div>
                  </div>

                  {/* 8 S-Boxes Substitution Table */}
                  <div className="rounded-lg border border-line bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-ink">4. Non-Linear S-Boxes (S1 &ndash; S8: 48 &rarr; 32 bits)</span>
                      <span className="font-mono text-[11px] text-teal">Output: {activeRoundData.sbox_output_hex}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {activeRoundData.sbox_blocks.map((sb) => (
                        <div key={sb.box} className="rounded border border-line/60 bg-bg p-2 text-center font-mono">
                          <span className="text-[10px] text-muted font-bold block">S{sb.box}</span>
                          <span className="text-[9px] text-muted block">{sb.in_6bit}</span>
                          <span className="text-[9px] text-accent block">r:{sb.row} c:{sb.col}</span>
                          <div className="h-px bg-line/60 my-1" />
                          <span className="text-xs font-bold text-teal">{sb.out_4bit}</span>
                          <span className="text-[9px] text-ink block">({sb.out_val})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* P-Permutation */}
                  <div className="rounded-lg border border-line bg-card p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-muted block">5. Permutation P (32 &rarr; 32 bits)</span>
                      <code className="font-mono text-xs text-accent font-bold">{activeRoundData.p_permutation_hex}</code>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted block">L{activeRoundData.round - 1} &oplus; P(S) = R{activeRoundData.round}</span>
                      <code className="font-mono text-xs text-teal font-bold">{activeRoundData.right_out_hex}</code>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardCard>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: AVALANCHE EFFECT EXPERIMENT
      ========================================================================= */}
      {activeTab === 'avalanche' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <DashboardCard title="Avalanche Bit-Flip Setup" className="lg:col-span-1 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Baseline Plaintext (16 Hex Digits)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={avalancheInput}
                  onChange={(e) => setAvalancheInput(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-line bg-bg p-2.5 font-mono text-sm tracking-widest text-ink outline-none focus:border-accent/60"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink block mb-1.5">Secret Key (16 Hex Digits)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={avalancheKey}
                  onChange={(e) => setAvalancheKey(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-line bg-bg p-2.5 font-mono text-sm tracking-widest text-ink outline-none focus:border-accent/60"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium text-ink">Invert Bit Position</span>
                  <span className="font-mono text-accent font-bold">Bit #{flipBit} (of 64)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="63"
                  value={flipBit}
                  onChange={(e) => setFlipBit(parseInt(e.target.value, 10))}
                  className="w-full accent-accent cursor-pointer"
                />
                <span className="text-[10px] text-muted block mt-1">
                  Flips exactly 1 bit in the 64-bit input block before encryption.
                </span>
              </div>

              <button
                type="button"
                onClick={handleAvalanche}
                disabled={loading || avalancheInput.length !== 16 || avalancheKey.length !== 16}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-xs font-semibold text-bg hover:bg-accent-2 transition-colors disabled:opacity-50"
              >
                <Binary size={14} />
                <span>Simulate 1-Bit Avalanche Test</span>
              </button>
            </DashboardCard>

            <div className="lg:col-span-2 space-y-4">
              {avalancheData ? (
                <div className="rounded-xl border border-line bg-card p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-line pb-3">
                    <div>
                      <h4 className="text-sm font-semibold text-ink">Avalanche Effect Comparison</h4>
                      <p className="text-xs text-muted">A desirable block cipher property where flipping 1 bit changes &approx; 50% of ciphertext bits.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold font-mono text-teal">
                        {avalancheData.final_differing_percent}%
                      </span>
                      <span className="text-[10px] text-muted block">
                        {avalancheData.final_differing_bits} of 64 bits changed
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-line bg-bg p-3">
                      <span className="text-[10px] text-muted block">Original Input &rarr; Ciphertext</span>
                      <code className="font-mono text-xs text-ink block">{avalancheData.original_plaintext_hex}</code>
                      <code className="font-mono text-xs text-accent block mt-1">{avalancheData.original_ciphertext_hex}</code>
                    </div>
                    <div className="rounded-lg border border-line bg-bg p-3">
                      <span className="text-[10px] text-muted block">1-Bit Inverted Input &rarr; Ciphertext</span>
                      <code className="font-mono text-xs text-warn block">{avalancheData.modified_plaintext_hex}</code>
                      <code className="font-mono text-xs text-teal block mt-1">{avalancheData.modified_ciphertext_hex}</code>
                    </div>
                  </div>

                  {/* Round progression chart */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                      Diffusion Progression Across 16 Rounds
                    </span>

                    <div className="space-y-1.5">
                      {avalancheData.round_progression.map((rp) => (
                        <div key={rp.round} className="flex items-center gap-3 text-xs font-mono">
                          <span className="w-8 text-muted">R{rp.round}</span>
                          <div className="flex-1 h-3.5 bg-bg rounded overflow-hidden border border-line">
                            <div
                              className="h-full bg-gradient-to-r from-accent to-teal transition-all"
                              style={{ width: `${rp.diff_percent}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-accent-2 font-semibold">
                            {rp.diff_bits} bits ({rp.diff_percent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-line bg-card p-12 text-center space-y-2 text-muted">
                  <Binary size={36} className="mx-auto text-muted/40" />
                  <p className="text-sm font-medium">Click "Simulate 1-Bit Avalanche Test" to view the round-by-round diffusion curve.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: BLOCK CIPHER DESIGN PRINCIPLES
      ========================================================================= */}
      {activeTab === 'principles' && (
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <DashboardCard title="Shannon's Core Design Criteria">
              <div className="space-y-4 text-xs text-muted leading-relaxed">
                <div className="rounded-lg border border-line bg-bg p-3.5">
                  <h5 className="font-bold text-ink mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-accent" />
                    <span>Confusion (Achieved via S-Boxes)</span>
                  </h5>
                  <p>
                    Makes the mathematical relationship between the ciphertext and the symmetric key as complex and non-linear as possible. In DES, the 8 S-boxes are the ONLY non-linear operation in the entire cipher.
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-bg p-3.5">
                  <h5 className="font-bold text-ink mb-1 flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-teal" />
                    <span>Diffusion (Achieved via P-Box & Expansion)</span>
                  </h5>
                  <p>
                    Spreads the influence of individual plaintext bits and key bits across many ciphertext bits. By round 4-5 of DES, every single ciphertext bit depends on every plaintext bit and every key bit.
                  </p>
                </div>
              </div>
            </DashboardCard>

            <DashboardCard title="Feistel Cipher Architecture">
              <div className="space-y-4 text-xs text-muted leading-relaxed">
                <div className="rounded-lg border border-line bg-bg p-3.5">
                  <h5 className="font-bold text-ink mb-1">Invertibility Without Invertible F</h5>
                  <p>
                    Because Feistel splits the block into two halves (L, R) and uses R_i = L_&#123;i-1&#125; &oplus; f(R_&#123;i-1&#125;, K_i), the round function f does NOT need to be mathematically invertible. Decryption is identical to encryption simply by reversing the subkeys K_16 to K_1.
                  </p>
                </div>

                <div className="rounded-lg border border-line bg-bg p-3.5">
                  <h5 className="font-bold text-ink mb-1">Number of Rounds (16 in DES)</h5>
                  <p>
                    A single round provides zero security. Multiple rounds iteratively cascade confusion and diffusion until differential and linear cryptanalysis become computationally impractical against the full cipher.
                  </p>
                </div>
              </div>
            </DashboardCard>
          </div>

          <DashboardCard title="Historical Security Limitations & Why DES Was Retired">
            <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-muted">
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 space-y-2">
                <h5 className="font-bold text-danger text-sm">56-Bit Key Space</h5>
                <p>
                  DES uses an effective key length of 56 bits (2⁵⁶ &approx; 7.2 &times; 10¹⁶ keys). In 1998, the Electronic Frontier Foundation (EFF) built the <strong>Deep Crack</strong> custom ASIC machine for $250,000, recovering a DES key in under 56 hours.
                </p>
              </div>

              <div className="rounded-lg border border-warn/30 bg-warn/5 p-4 space-y-2">
                <h5 className="font-bold text-warn text-sm">Double DES (2DES) Flaw</h5>
                <p>
                  Attempting to double the key length to 112 bits via C = E_K2(E_K1(P)) is defeated by the <strong>Meet-in-the-Middle Attack</strong>, reducing the work factor from 2¹¹² down to 2⁵⁷, offering practically no additional security over single DES.
                </p>
              </div>

              <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-2">
                <h5 className="font-bold text-accent text-sm">Transition to 3DES and AES</h5>
                <p>
                  Triple DES (3DES, E_K1(D_K2(E_K3(P)))) extended security to 112/168 bits but suffered from slow 64-bit block throughput. NIST held a 4-year public competition and selected <strong>Rijndael (AES)</strong> in 2001 (128-bit blocks, 128/192/256-bit keys).
                </p>
              </div>
            </div>
          </DashboardCard>
        </div>
      )}
    </div>
  )
}
