"""Pydantic schemas for Steganography endpoints."""
from typing import Any, Dict
from pydantic import BaseModel, Field


class StegoCapacityRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded PNG image data")


class StegoCapacityResponse(BaseModel):
    width: int
    height: int
    total_pixels: int
    embeddable_bits: int
    header_bytes: int
    max_payload_bytes: int
    max_payload_characters_utf8: int


class StegoEmbedRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded source PNG image")
    message: str = Field(..., min_length=1, description="Text message to conceal in the image")


class StegoEmbedResponse(BaseModel):
    stego_image_base64: str = Field(..., description="Base64-encoded output PNG with embedded payload")
    width: int
    height: int
    color_type: str
    message_length_bytes: int
    embedded_bits: int
    capacity_bytes: int
    crc32: str


class StegoExtractRequest(BaseModel):
    image_base64: str = Field(..., description="Base64-encoded PNG image containing steganographic payload")


class StegoExtractResponse(BaseModel):
    width: int
    height: int
    message: str
    message_length: int
    crc32: str
    integrity_verified: bool


class StegoSampleResponse(BaseModel):
    image_base64: str
    width: int
    height: int
    capacity_bytes: int

