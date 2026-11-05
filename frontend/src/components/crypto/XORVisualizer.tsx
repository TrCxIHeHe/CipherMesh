import type { OTPStep, OTPReuseResponse } from '../../lib/api'

interface XORVisualizerProps {
  steps?: OTPStep[]
  reuseData?: OTPReuseResponse | null
}

export function XORVisualizer({ steps = [], reuseData }: XORVisualizerProps) {
  if (reuseData) {
    return (
      <div className="rounded-xl border border-line bg-card p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-danger flex items-center gap-1.5">
              <span>OTP Two-Time Pad Vulnerability (Key Cancellation Proof)</span>
            </h4>
            <p className="text-[11px] text-muted">
              Reusing key K for two messages M1 and M2 allows an attacker to compute C1 &oplus; C2 = M1 &oplus; M2.
            </p>
          </div>
          <span className="rounded bg-danger/10 border border-danger/30 px-2 py-0.5 text-[10px] font-mono text-danger uppercase font-medium">
            Catastrophic Key Reuse
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-bg p-3">
            <span className="text-[11px] text-muted block mb-1">Ciphertext 1 &oplus; Ciphertext 2 (HEX)</span>
            <code className="font-mono text-xs text-accent-2 break-all">{reuseData.xor_ciphers_hex}</code>
          </div>
          <div className="rounded-lg border border-line bg-bg p-3">
            <span className="text-[11px] text-muted block mb-1">Plaintext 1 &oplus; Plaintext 2 (HEX)</span>
            <code className="font-mono text-xs text-teal break-all">{reuseData.xor_plains_hex}</code>
          </div>
        </div>

        <div className="rounded-lg border border-ok/30 bg-ok/5 p-3 text-xs text-ok flex items-center justify-between">
          <span>Mathematical Equivalence: (M1 &oplus; K) &oplus; (M2 &oplus; K) &equiv; M1 &oplus; M2</span>
          <span className="font-mono font-bold">100% CANCELLED</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-line text-left text-[11px] text-muted">
                <th className="py-2 px-3">Idx</th>
                <th className="py-2 px-3">P1 ('{reuseData.p1}')</th>
                <th className="py-2 px-3">P2 ('{reuseData.p2}')</th>
                <th className="py-2 px-3">Reused Key</th>
                <th className="py-2 px-3">C1 Hex</th>
                <th className="py-2 px-3">C2 Hex</th>
                <th className="py-2 px-3">C1 &oplus; C2 (Bin)</th>
                <th className="py-2 px-3">P1 &oplus; P2 (Bin)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {reuseData.comparisons.map((c) => (
                <tr key={c.position} className="hover:bg-bg/40">
                  <td className="py-2 px-3 text-muted">{c.position}</td>
                  <td className="py-2 px-3 text-ink font-semibold">{c.p1_char}</td>
                  <td className="py-2 px-3 text-ink font-semibold">{c.p2_char}</td>
                  <td className="py-2 px-3 text-accent font-semibold">{c.key_char}</td>
                  <td className="py-2 px-3 text-accent-2">{c.c1_hex}</td>
                  <td className="py-2 px-3 text-accent-2">{c.c2_hex}</td>
                  <td className="py-2 px-3 text-teal">{c.c1_xor_c2_bin}</td>
                  <td className="py-2 px-3 text-teal">{c.p1_xor_p2_bin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (!steps || steps.length === 0) return null

  return (
    <div className="rounded-xl border border-line bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">Bit-by-Bit XOR Inspection</h4>
          <p className="text-[11px] text-muted">Detailed binary breakdown: Text &oplus; Key = Cipher</p>
        </div>
        <span className="font-mono text-[11px] text-accent">{steps.length} Bytes processed</span>
      </div>

      <div className="overflow-x-auto max-h-72">
        <table className="w-full border-collapse font-mono text-xs">
          <thead className="sticky top-0 bg-card border-b border-line">
            <tr className="text-left text-[11px] text-muted">
              <th className="py-2 px-2.5">Pos</th>
              <th className="py-2 px-2.5">Text Char</th>
              <th className="py-2 px-2.5">Text Binary</th>
              <th className="py-2 px-2.5">&oplus;</th>
              <th className="py-2 px-2.5">Key Char</th>
              <th className="py-2 px-2.5">Key Binary</th>
              <th className="py-2 px-2.5">=</th>
              <th className="py-2 px-2.5">Cipher Binary</th>
              <th className="py-2 px-2.5">Hex</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {steps.map((s) => (
              <tr key={s.position} className="hover:bg-bg/40">
                <td className="py-2 px-2.5 text-muted">{s.position}</td>
                <td className="py-2 px-2.5 text-ink font-semibold">{s.text_char}</td>
                <td className="py-2 px-2.5 text-muted tracking-widest">{s.text_binary}</td>
                <td className="py-2 px-2.5 text-accent">&oplus;</td>
                <td className="py-2 px-2.5 text-accent font-semibold">{s.key_char}</td>
                <td className="py-2 px-2.5 text-accent/80 tracking-widest">{s.key_binary}</td>
                <td className="py-2 px-2.5 text-teal">=</td>
                <td className="py-2 px-2.5 text-teal font-semibold tracking-widest">{s.cipher_binary}</td>
                <td className="py-2 px-2.5 text-accent-2 font-bold">{s.cipher_hex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

