from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# Caesar
class CaesarRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input plaintext or ciphertext")
    shift: int = Field(3, ge=0, le=25, description="Caesar shift key (0-25)")


class CaesarResponse(BaseModel):
    input_text: str
    output_text: str
    shift: int
    effective_shift: int
    operation: str
    steps: List[Dict[str, Any]]
    alphabet_mapping: List[Dict[str, str]]
    frequencies: Dict[str, Any]


# Monoalphabetic
class MonoalphabeticRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input text")
    key: str = Field(..., min_length=26, max_length=26, description="26-letter substitution alphabet")


class MonoalphabeticKeyResponse(BaseModel):
    key: str
    alphabet_mapping: List[Dict[str, str]]


class MonoalphabeticResponse(BaseModel):
    input_text: str
    output_text: str
    key: str
    operation: str
    alphabet_mapping: List[Dict[str, str]]
    steps: List[Dict[str, Any]]


# Playfair
class PlayfairRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input text")
    key: str = Field(..., min_length=1, max_length=100, description="Playfair secret key word or phrase")


class PlayfairResponse(BaseModel):
    input_text: str
    output_text: str
    key: str
    operation: str
    matrix: List[List[str]]
    prepared_digraphs: List[str]
    steps: List[Dict[str, Any]]


# Hill
class HillRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input text")
    matrix: List[List[int]] = Field(..., description="2x2 or 3x3 key matrix with integer entries")


class HillResponse(BaseModel):
    input_text: str
    output_text: str
    dimension: int
    key_matrix: List[List[int]]
    inverse_matrix: List[List[int]]
    determinant: int
    determinant_mod_26: int
    modular_inverse_det: int
    padding_added: int
    operation: str
    steps: List[Dict[str, Any]]


# Vigenere
class VigenereRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input text")
    key: str = Field(..., min_length=1, max_length=500, description="Vigenere secret keyword")


class VigenereResponse(BaseModel):
    input_text: str
    output_text: str
    key: str
    aligned_key: str
    operation: str
    steps: List[Dict[str, Any]]
    tabula_recta: List[List[str]]


# One-Time Pad
class OTPRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000, description="Input text")
    key: str = Field(..., min_length=1, max_length=10000, description="Key of exact same length as text")


class OTPGenerateKeyRequest(BaseModel):
    length: int = Field(..., ge=1, le=10000, description="Length of random key to generate")


class OTPGenerateKeyResponse(BaseModel):
    key: str
    length: int


class OTPResponse(BaseModel):
    input_text: str
    key: str
    output_hex: str
    output_binary: str
    steps: List[Dict[str, Any]]
    security_notes: Dict[str, str]


class OTPReuseRequest(BaseModel):
    plaintext1: str = Field(..., min_length=1, max_length=5000)
    plaintext2: str = Field(..., min_length=1, max_length=5000)
    key: Optional[str] = Field(None, max_length=5000)


class OTPReuseResponse(BaseModel):
    p1: str
    p2: str
    key: str
    c1_hex: str
    c2_hex: str
    xor_ciphers_hex: str
    xor_plains_hex: str
    cancellation_verified: bool
    comparisons: List[Dict[str, Any]]

