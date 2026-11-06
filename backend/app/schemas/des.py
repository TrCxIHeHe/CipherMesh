"""Pydantic schemas for DES endpoints."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DESBlockRequest(BaseModel):
    plaintext_hex: str = Field(
        ...,
        description="16-character hexadecimal string representing a 64-bit block (e.g., '0123456789ABCDEF')",
    )
    key_hex: str = Field(
        ...,
        description="16-character hexadecimal string representing a 64-bit key (e.g., '133457799BBCDFF1')",
    )
    decrypt: bool = Field(False, description="Whether to perform decryption")


class SBoxBlockTrace(BaseModel):
    box: int
    in_6bit: str
    row: int
    col: int
    out_val: int
    out_4bit: str


class RoundTrace(BaseModel):
    round: int
    key_schedule_round: int
    left_in: str
    left_in_hex: str
    right_in: str
    right_in_hex: str
    round_key_bin: str
    round_key_hex: str
    key_c_half: str
    key_d_half: str
    expansion_bin: str
    expansion_hex: str
    xor_bin: str
    xor_hex: str
    sbox_blocks: List[SBoxBlockTrace]
    sbox_output_bin: str
    sbox_output_hex: str
    p_permutation_bin: str
    p_permutation_hex: str
    left_out: str
    left_out_hex: str
    right_out: str
    right_out_hex: str
    combined_round_hex: str


class DESBlockResponse(BaseModel):
    operation: str
    input_bin: str
    input_hex: str
    key_bin: str
    key_hex: str
    ip_bin: str
    ip_hex: str
    rounds: List[RoundTrace]
    pre_output_bin: str
    pre_output_hex: str
    output_bin: str
    output_hex: str


class DESAvalancheRequest(BaseModel):
    plaintext_hex: str = Field(default="0123456789ABCDEF")
    key_hex: str = Field(default="133457799BBCDFF1")
    flip_bit_index: int = Field(default=0, ge=0, le=63, description="0-indexed bit to invert")


class RoundDiff(BaseModel):
    round: int
    state1_hex: str
    state2_hex: str
    diff_bits: int
    diff_percent: float


class DESAvalancheResponse(BaseModel):
    original_plaintext_hex: str
    modified_plaintext_hex: str
    flipped_bit_position: int
    key_hex: str
    original_ciphertext_hex: str
    modified_ciphertext_hex: str
    final_differing_bits: int
    final_differing_percent: float
    round_progression: List[RoundDiff]

