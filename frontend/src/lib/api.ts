/**
 * CipherMesh API Client
 * Interfaces with the FastAPI backend for cryptographic operations.
 */

const API_BASE = '/api/v1'

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  let res: Response
  try {
    res = await fetch(url, { ...options, headers })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    throw new ApiError(
      `Cannot connect to CipherMesh backend at ${url}. Ensure the backend is running with 'uv run uvicorn app.main:app' (${errorMsg}).`,
      0
    )
  }

  if (!res.ok) {
    let errorDetail = 'API request failed.'
    try {
      const errorJson = await res.json()
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail.map((d: { msg?: string; loc?: string[] }) => d.msg || JSON.stringify(d)).join(', ')
      }
    } catch {
      errorDetail = `Server returned status ${res.status} (${res.statusText})`
    }
    throw new ApiError(errorDetail, res.status)
  }

  return res.json()
}

/* ================= Classical Cryptography Types & Endpoints ================= */

export interface CaesarStep {
  char: string
  orig_idx: number | null
  shift: number
  new_idx: number | null
  result_char: string
  formula: string
  position: number
}

export interface AlphabetMappingItem {
  plain: string
  plain_index: string
  cipher: string
  cipher_index: string
}

export interface CaesarResponse {
  input_text: string
  output_text: string
  shift: number
  effective_shift: number
  operation: 'encryption' | 'decryption'
  steps: CaesarStep[]
  alphabet_mapping: AlphabetMappingItem[]
  frequencies: {
    input: Record<string, number>
    output: Record<string, number>
    english_standard: Record<string, number>
  }
}

export interface MonoalphabeticStep {
  char: string
  result_char: string
  position: number
  formula: string
}

export interface MonoalphabeticResponse {
  input_text: string
  output_text: string
  key: string
  operation: 'encryption' | 'decryption'
  alphabet_mapping: AlphabetMappingItem[]
  steps: MonoalphabeticStep[]
}

export interface PlayfairStep {
  pair_index: number
  in_pair: [string, string]
  coords_in: { char: string; row: number; col: number }[]
  rule: 'same_row' | 'same_col' | 'rectangle'
  rule_name: string
  explanation: string
  out_pair: [string, string]
  coords_out: { char: string; row: number; col: number }[]
}

export interface PlayfairResponse {
  input_text: string
  output_text: string
  key: string
  operation: 'encryption' | 'decryption'
  matrix: string[][]
  prepared_digraphs: string[]
  steps: PlayfairStep[]
}

export interface HillStep {
  block_index: number
  input_chars: string[]
  input_vector: number[]
  output_vector: number[]
  output_chars: string[]
  arithmetic: {
    row_index: number
    matrix_row: number[]
    vector: number[]
    formula: string
    result_value: number
    result_char: string
  }[]
}

export interface HillResponse {
  input_text: string
  output_text: string
  dimension: number
  key_matrix: number[][]
  inverse_matrix: number[][]
  determinant: number
  determinant_mod_26: number
  modular_inverse_det: number
  padding_added: number
  operation: 'encryption' | 'decryption'
  steps: HillStep[]
}

export interface VigenereStep {
  position: number
  input_char: string
  key_char: string
  key_index: number | null
  plain_val: number | null
  key_val: number | null
  result_val: number | null
  result_char: string
  formula: string
  tabula_recta_row: number | null
  tabula_recta_col: number | null
}

export interface VigenereResponse {
  input_text: string
  output_text: string
  key: string
  aligned_key: string
  operation: 'encryption' | 'decryption'
  steps: VigenereStep[]
  tabula_recta: string[][]
}

export interface OTPBitDetail {
  bit_index: number
  text_bit: number
  key_bit: number
  result_bit: number
}

export interface OTPStep {
  position: number
  text_char: string
  text_byte: number
  text_binary: string
  key_char: string
  key_byte: number
  key_binary: string
  cipher_byte: number
  cipher_binary: string
  cipher_hex: string
  bit_details: OTPBitDetail[]
}

export interface OTPResponse {
  input_text: string
  key: string
  output_hex: string
  output_binary: string
  steps: OTPStep[]
  security_notes: {
    perfect_secrecy: string
    reuse_vulnerability: string
  }
}

export interface OTPReuseResponse {
  p1: string
  p2: string
  key: string
  c1_hex: string
  c2_hex: string
  xor_ciphers_hex: string
  xor_plains_hex: string
  cancellation_verified: boolean
  comparisons: {
    position: number
    p1_char: string
    p2_char: string
    key_char: string
    c1_hex: string
    c2_hex: string
    c1_xor_c2_bin: string
    p1_xor_p2_bin: string
    keys_cancelled: boolean
  }[]
}

export const classicalApi = {
  // Caesar
  encryptCaesar: (text: string, shift: number) =>
    request<CaesarResponse>('/lab/classical/caesar/encrypt', { method: 'POST', body: JSON.stringify({ text, shift }) }),
  decryptCaesar: (text: string, shift: number) =>
    request<CaesarResponse>('/lab/classical/caesar/decrypt', { method: 'POST', body: JSON.stringify({ text, shift }) }),

  // Monoalphabetic
  generateMonoKey: () =>
    request<{ key: string; alphabet_mapping: AlphabetMappingItem[] }>('/lab/classical/monoalphabetic/generate-key'),
  encryptMono: (text: string, key: string) =>
    request<MonoalphabeticResponse>('/lab/classical/monoalphabetic/encrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),
  decryptMono: (text: string, key: string) =>
    request<MonoalphabeticResponse>('/lab/classical/monoalphabetic/decrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),

  // Playfair
  encryptPlayfair: (text: string, key: string) =>
    request<PlayfairResponse>('/lab/classical/playfair/encrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),
  decryptPlayfair: (text: string, key: string) =>
    request<PlayfairResponse>('/lab/classical/playfair/decrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),

  // Hill
  encryptHill: (text: string, matrix: number[][]) =>
    request<HillResponse>('/lab/classical/hill/encrypt', { method: 'POST', body: JSON.stringify({ text, matrix }) }),
  decryptHill: (text: string, matrix: number[][]) =>
    request<HillResponse>('/lab/classical/hill/decrypt', { method: 'POST', body: JSON.stringify({ text, matrix }) }),

  // Vigenere
  encryptVigenere: (text: string, key: string) =>
    request<VigenereResponse>('/lab/classical/vigenere/encrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),
  decryptVigenere: (text: string, key: string) =>
    request<VigenereResponse>('/lab/classical/vigenere/decrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),

  // One-Time Pad
  generateOtpKey: (length: number) =>
    request<{ key: string; length: number }>('/lab/classical/otp/generate-key', { method: 'POST', body: JSON.stringify({ length }) }),
  encryptOtp: (text: string, key: string) =>
    request<OTPResponse>('/lab/classical/otp/encrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),
  decryptOtp: (text: string, key: string) =>
    request<OTPResponse>('/lab/classical/otp/decrypt', { method: 'POST', body: JSON.stringify({ text, key }) }),
  demonstrateOtpReuse: (plaintext1: string, plaintext2: string, key?: string) =>
    request<OTPReuseResponse>('/lab/classical/otp/reuse-demonstration', {
      method: 'POST',
      body: JSON.stringify({ plaintext1, plaintext2, key }),
    }),
}

