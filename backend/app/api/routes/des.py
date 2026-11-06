"""DES API route endpoints."""
from fastapi import APIRouter, HTTPException, status
from app.crypto.educational.des.core import des_process_block, des_avalanche_analysis
from app.crypto.educational.des.key_schedule import hex_to_bin64
from app.schemas.des import (
    DESBlockRequest,
    DESBlockResponse,
    DESAvalancheRequest,
    DESAvalancheResponse,
)

router = APIRouter(prefix="/lab/des", tags=["DES Workbench"])


def clean_hex(val: str, name: str) -> str:
    cleaned = val.strip().replace(" ", "").replace("0x", "")
    if len(cleaned) != 16:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must be a 16-character hexadecimal string representing 64 bits (got {len(cleaned)} chars).",
        )
    try:
        int(cleaned, 16)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{name} must contain only valid hexadecimal characters (0-9, A-F).",
        )
    return cleaned.upper()


@router.post("/encrypt", response_model=DESBlockResponse, summary="Encrypt 64-bit block with DES")
def des_encrypt(req: DESBlockRequest):
    p_hex = clean_hex(req.plaintext_hex, "Plaintext")
    k_hex = clean_hex(req.key_hex, "Key")
    p_bin = hex_to_bin64(p_hex)
    k_bin = hex_to_bin64(k_hex)

    try:
        return des_process_block(p_bin, k_bin, decrypt=False)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/decrypt", response_model=DESBlockResponse, summary="Decrypt 64-bit block with DES")
def des_decrypt(req: DESBlockRequest):
    c_hex = clean_hex(req.plaintext_hex, "Ciphertext")
    k_hex = clean_hex(req.key_hex, "Key")
    c_bin = hex_to_bin64(c_hex)
    k_bin = hex_to_bin64(k_hex)

    try:
        return des_process_block(c_bin, k_bin, decrypt=True)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/trace", response_model=DESBlockResponse, summary="Detailed 16-round Feistel trace")
def des_trace(req: DESBlockRequest):
    text_hex = clean_hex(req.plaintext_hex, "Input block")
    k_hex = clean_hex(req.key_hex, "Key")
    b_bin = hex_to_bin64(text_hex)
    k_bin = hex_to_bin64(k_hex)

    try:
        return des_process_block(b_bin, k_bin, decrypt=req.decrypt)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/avalanche", response_model=DESAvalancheResponse, summary="Avalanche Effect bit-flip analysis")
def des_avalanche(req: DESAvalancheRequest):
    p_hex = clean_hex(req.plaintext_hex, "Plaintext")
    k_hex = clean_hex(req.key_hex, "Key")

    try:
        return des_avalanche_analysis(p_hex, k_hex, req.flip_bit_index)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

