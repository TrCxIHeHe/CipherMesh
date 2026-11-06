"""Steganography API route endpoints."""
import base64
from fastapi import APIRouter, HTTPException, status
from app.crypto.educational.steganography.lsb import (
    generate_sample_png,
    parse_png,
    calculate_stego_capacity,
    embed_stego_payload,
    extract_stego_payload,
)
from app.schemas.steganography import (
    StegoCapacityRequest,
    StegoCapacityResponse,
    StegoEmbedRequest,
    StegoEmbedResponse,
    StegoExtractRequest,
    StegoExtractResponse,
    StegoSampleResponse,
)

router = APIRouter(prefix="/lab/steganography", tags=["Steganography"])


def decode_base64_image(b64_str: str) -> bytes:
    """Helper to strip data URI headers and decode base64 bytes."""
    clean_b64 = b64_str.strip()
    if "," in clean_b64:
        clean_b64 = clean_b64.split(",", 1)[1]
    try:
        raw_bytes = base64.b64decode(clean_b64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid base64 encoding for image.",
        )
    if len(raw_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file size exceeds maximum limit of 5 MB.",
        )
    return raw_bytes


@router.get("/sample", response_model=StegoSampleResponse, summary="Generate a clean PNG sample image")
def get_sample():
    png_bytes = generate_sample_png(160, 100)
    cap = calculate_stego_capacity(160, 100)
    return StegoSampleResponse(
        image_base64=f"data:image/png;base64,{base64.b64encode(png_bytes).decode('ascii')}",
        width=160,
        height=100,
        capacity_bytes=cap["max_payload_bytes"],
    )


@router.post("/capacity", response_model=StegoCapacityResponse, summary="Inspect image payload capacity")
def get_capacity(req: StegoCapacityRequest):
    raw_png = decode_base64_image(req.image_base64)
    try:
        w, h, _, _, _ = parse_png(raw_png)
        cap = calculate_stego_capacity(w, h)
        return StegoCapacityResponse(**cap)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/embed", response_model=StegoEmbedResponse, summary="Embed text into PNG LSBs")
def embed_message(req: StegoEmbedRequest):
    raw_png = decode_base64_image(req.image_base64)
    try:
        stego_png, meta = embed_stego_payload(raw_png, req.message)
        b64_out = f"data:image/png;base64,{base64.b64encode(stego_png).decode('ascii')}"
        return StegoEmbedResponse(stego_image_base64=b64_out, **meta)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/extract", response_model=StegoExtractResponse, summary="Extract hidden text from PNG LSBs")
def extract_message(req: StegoExtractRequest):
    raw_png = decode_base64_image(req.image_base64)
    try:
        res = extract_stego_payload(raw_png)
        return StegoExtractResponse(**res)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

