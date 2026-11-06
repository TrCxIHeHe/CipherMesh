"""Unit and integration tests for LSB Image Steganography."""
import base64
import pytest
from app.crypto.educational.steganography.lsb import generate_sample_png


def test_stego_sample_endpoint(client):
    res = client.get("/api/v1/lab/steganography/sample")
    assert res.status_code == 200
    data = res.json()
    assert "data:image/png;base64," in data["image_base64"]
    assert data["width"] == 160
    assert data["height"] == 100
    assert data["capacity_bytes"] > 0


def test_stego_embed_and_extract_roundtrip(client):
    # 1. Get sample image
    sample_res = client.get("/api/v1/lab/steganography/sample")
    img_b64 = sample_res.json()["image_base64"]
    secret_text = "VTU BCS703 Steganography Verification Token 2026"

    # 2. Embed
    embed_res = client.post("/api/v1/lab/steganography/embed", json={
        "image_base64": img_b64,
        "message": secret_text,
    })
    assert embed_res.status_code == 200
    embed_data = embed_res.json()
    stego_b64 = embed_data["stego_image_base64"]
    assert stego_b64 != img_b64
    assert embed_data["message_length_bytes"] == len(secret_text.encode("utf-8"))

    # 3. Extract
    extract_res = client.post("/api/v1/lab/steganography/extract", json={
        "image_base64": stego_b64,
    })
    assert extract_res.status_code == 200
    extract_data = extract_res.json()
    assert extract_data["message"] == secret_text
    assert extract_data["integrity_verified"] is True
    assert extract_data["crc32"] == embed_data["crc32"]


def test_stego_capacity_overflow(client):
    # Create small image (10x10 = 100 pixels * 3 = 300 bits = 37 bytes - 12 bytes header = 25 bytes capacity)
    small_png = generate_sample_png(10, 10)
    small_b64 = f"data:image/png;base64,{base64.b64encode(small_png).decode('ascii')}"

    # Try to embed 200 bytes
    huge_message = "A" * 200
    res = client.post("/api/v1/lab/steganography/embed", json={
        "image_base64": small_b64,
        "message": huge_message,
    })
    assert res.status_code == 400
    assert "Insufficient image capacity" in res.json()["detail"]


def test_stego_no_payload_error(client):
    # Extract from a clean image without payload
    clean_png = generate_sample_png(50, 50)
    clean_b64 = f"data:image/png;base64,{base64.b64encode(clean_png).decode('ascii')}"

    res = client.post("/api/v1/lab/steganography/extract", json={
        "image_base64": clean_b64,
    })
    assert res.status_code == 400
    assert "No CipherMesh steganographic payload detected" in res.json()["detail"]


def test_stego_invalid_image_data(client):
    res = client.post("/api/v1/lab/steganography/extract", json={
        "image_base64": "data:image/png;base64,bm90IGEgcG5nIGF0IGFsbA==",
    })
    assert res.status_code == 400
    assert "Invalid image" in res.json()["detail"]

