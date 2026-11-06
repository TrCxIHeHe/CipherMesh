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

export interface SBoxBlockTrace {
  box: number
  in_6bit: string
  row: number
  col: number
  out_val: number
  out_4bit: string
}

export interface DESRoundTrace {
  round: number
  key_schedule_round: number
  left_in: string
  left_in_hex: string
  right_in: string
  right_in_hex: string
  round_key_bin: string
  round_key_hex: string
  key_c_half: string
  key_d_half: string
  expansion_bin: string
  expansion_hex: string
  xor_bin: string
  xor_hex: string
  sbox_blocks: SBoxBlockTrace[]
  sbox_output_bin: string
  sbox_output_hex: string
  p_permutation_bin: string
  p_permutation_hex: string
  left_out: string
  left_out_hex: string
  right_out: string
  right_out_hex: string
  combined_round_hex: string
}

export interface DESBlockResponse {
  operation: 'encryption' | 'decryption'
  input_bin: string
  input_hex: string
  key_bin: string
  key_hex: string
  ip_bin: string
  ip_hex: string
  rounds: DESRoundTrace[]
  pre_output_bin: string
  pre_output_hex: string
  output_bin: string
  output_hex: string
}

export interface DESRoundDiff {
  round: number
  state1_hex: string
  state2_hex: string
  diff_bits: number
  diff_percent: number
}

export interface DESAvalancheResponse {
  original_plaintext_hex: string
  modified_plaintext_hex: string
  flipped_bit_position: number
  key_hex: string
  original_ciphertext_hex: string
  modified_ciphertext_hex: string
  final_differing_bits: number
  final_differing_percent: number
  round_progression: DESRoundDiff[]
}

export interface StegoCapacityResponse {
  width: number
  height: number
  total_pixels: number
  embeddable_bits: number
  header_bytes: number
  max_payload_bytes: number
  max_payload_characters_utf8: number
}

export interface StegoEmbedResponse {
  stego_image_base64: string
  width: number
  height: number
  color_type: string
  message_length_bytes: number
  embedded_bits: number
  capacity_bytes: number
  crc32: string
}

export interface StegoExtractResponse {
  width: number
  height: number
  message: string
  message_length: number
  crc32: string
  integrity_verified: boolean
}

export interface StegoSampleResponse {
  image_base64: string
  width: number
  height: number
  capacity_bytes: number
}

export const stegoApi = {
  getSample: () => request<StegoSampleResponse>('/lab/steganography/sample'),
  getCapacity: (image_base64: string) =>
    request<StegoCapacityResponse>('/lab/steganography/capacity', {
      method: 'POST',
      body: JSON.stringify({ image_base64 }),
    }),
  embed: (image_base64: string, message: string) =>
    request<StegoEmbedResponse>('/lab/steganography/embed', {
      method: 'POST',
      body: JSON.stringify({ image_base64, message }),
    }),
  extract: (image_base64: string) =>
    request<StegoExtractResponse>('/lab/steganography/extract', {
      method: 'POST',
      body: JSON.stringify({ image_base64 }),
    }),
}

export const desApi = {
  encrypt: (plaintext_hex: string, key_hex: string) =>
    request<DESBlockResponse>('/lab/des/encrypt', {
      method: 'POST',
      body: JSON.stringify({ plaintext_hex, key_hex, decrypt: false }),
    }),
  decrypt: (plaintext_hex: string, key_hex: string) =>
    request<DESBlockResponse>('/lab/des/decrypt', {
      method: 'POST',
      body: JSON.stringify({ plaintext_hex, key_hex, decrypt: true }),
    }),
  trace: (plaintext_hex: string, key_hex: string, decrypt: boolean = false) =>
    request<DESBlockResponse>('/lab/des/trace', {
      method: 'POST',
      body: JSON.stringify({ plaintext_hex, key_hex, decrypt }),
    }),
  avalanche: (plaintext_hex: string, key_hex: string, flip_bit_index: number = 0) =>
    request<DESAvalancheResponse>('/lab/des/avalanche', {
      method: 'POST',
      body: JSON.stringify({ plaintext_hex, key_hex, flip_bit_index }),
    }),
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

