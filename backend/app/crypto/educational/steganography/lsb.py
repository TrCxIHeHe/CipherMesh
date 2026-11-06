"""Pure Python LSB Image Steganography for PNG with Header & CRC32 Integrity Checks."""
import struct
import zlib
from typing import Any, Dict, List, Tuple

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"
STEGO_MAGIC = b"CMST"  # 4-byte CipherMesh Stego header magic


def create_png_chunk(chunk_type: bytes, data: bytes) -> bytes:
    """Create a standard PNG chunk with 4-byte length, type, data, and CRC32."""
    length = len(data)
    crc = zlib.crc32(chunk_type + data) & 0xFFFFFFFF
    return struct.pack(">I", length) + chunk_type + data + struct.pack(">I", crc)


def generate_sample_png(width: int = 120, height: int = 80, rgb: Tuple[int, int, int] = (17, 28, 45)) -> bytes:
    """Generate a valid, standalone uncompressed RGB PNG image in memory for testing."""
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr_chunk = create_png_chunk(b"IHDR", ihdr_data)

    # Raw scanlines with filter type 0 (None)
    row_bytes = bytearray([0]) + bytearray(rgb * width)
    raw_data = bytes(row_bytes * height)
    compressed = zlib.compress(raw_data, level=6)
    idat_chunk = create_png_chunk(b"IDAT", compressed)
    iend_chunk = create_png_chunk(b"IEND", b"")

    return PNG_SIGNATURE + ihdr_chunk + idat_chunk + iend_chunk


def parse_png(png_bytes: bytes) -> Tuple[int, int, int, int, bytearray]:
    """
    Parse a PNG file, validating signature and extracting width, height, color type,
    and decompressing raw scanlines.
    Returns (width, height, color_type, bytes_per_pixel, decompressed_scanlines).
    """
    if len(png_bytes) < 8 or png_bytes[:8] != PNG_SIGNATURE:
        raise ValueError("Invalid image: File does not have a valid PNG signature.")

    offset = 8
    width = 0
    height = 0
    bit_depth = 0
    color_type = 0
    idat_parts: List[bytes] = []

    while offset < len(png_bytes):
        if offset + 8 > len(png_bytes):
            raise ValueError("Malformed PNG: Truncated chunk header.")

        chunk_len, chunk_type = struct.unpack(">I4s", png_bytes[offset : offset + 8])
        offset += 8
        chunk_data = png_bytes[offset : offset + chunk_len]
        offset += chunk_len
        crc_bytes = png_bytes[offset : offset + 4]
        offset += 4

        # Validate chunk CRC
        expected_crc = zlib.crc32(chunk_type + chunk_data) & 0xFFFFFFFF
        actual_crc = struct.unpack(">I", crc_bytes)[0]
        if expected_crc != actual_crc:
            raise ValueError(f"Corrupted PNG: CRC mismatch in chunk {chunk_type.decode('ascii', 'ignore')}.")

        if chunk_type == b"IHDR":
            width, height, bit_depth, color_type, comp, filt, interlace = struct.unpack(
                ">IIBBBBB", chunk_data
            )
            if bit_depth != 8:
                raise ValueError(f"Unsupported PNG bit depth ({bit_depth}). Only 8-bit depth is supported.")
            if color_type not in (2, 6):
                raise ValueError(
                    f"Unsupported PNG color type ({color_type}). Only 8-bit RGB (type 2) or RGBA (type 6) supported."
                )
            if interlace != 0:
                raise ValueError("Interlaced PNGs are not supported. Please use non-interlaced PNG.")
        elif chunk_type == b"IDAT":
            idat_parts.append(chunk_data)
        elif chunk_type == b"IEND":
            break

    if not idat_parts or width == 0 or height == 0:
        raise ValueError("Malformed PNG: Missing image data or zero dimensions.")

    bytes_per_pixel = 3 if color_type == 2 else 4
    compressed_idat = b"".join(idat_parts)

    try:
        decompressed = bytearray(zlib.decompress(compressed_idat))
    except Exception as exc:
        raise ValueError(f"Decompression error in PNG IDAT chunks: {str(exc)}")

    return width, height, color_type, bytes_per_pixel, decompressed


def unfilter_scanlines(
    width: int, height: int, bpp: int, raw_scanlines: bytearray
) -> bytearray:
    """
    Unfilter PNG scanlines so that all filter bytes become 0 (None) and raw pixels
    can be safely modified in-place without breaking prediction filters.
    """
    stride = 1 + width * bpp
    expected_len = stride * height
    if len(raw_scanlines) != expected_len:
        raise ValueError(f"Scanline length mismatch: expected {expected_len}, got {len(raw_scanlines)}.")

    output = bytearray(expected_len)

    def paeth_predictor(a: int, b: int, c: int) -> int:
        p = a + b - c
        pa = abs(p - a)
        pb = abs(p - b)
        pc = abs(p - c)
        if pa <= pb and pa <= pc:
            return a
        elif pb <= pc:
            return b
        else:
            return c

    for y in range(height):
        row_start = y * stride
        filter_type = raw_scanlines[row_start]
        prev_row_start = (y - 1) * stride if y > 0 else None

        output[row_start] = 0  # Normalize filter type to 0 (None)

        for x in range(width * bpp):
            curr_pos = row_start + 1 + x
            raw_val = raw_scanlines[curr_pos]

            left = output[row_start + 1 + x - bpp] if x >= bpp else 0
            up = output[prev_row_start + 1 + x] if prev_row_start is not None else 0
            up_left = (
                output[prev_row_start + 1 + x - bpp]
                if (prev_row_start is not None and x >= bpp)
                else 0
            )

            if filter_type == 0:  # None
                recon = raw_val
            elif filter_type == 1:  # Sub
                recon = (raw_val + left) & 0xFF
            elif filter_type == 2:  # Up
                recon = (raw_val + up) & 0xFF
            elif filter_type == 3:  # Average
                recon = (raw_val + ((left + up) >> 1)) & 0xFF
            elif filter_type == 4:  # Paeth
                recon = (raw_val + paeth_predictor(left, up, up_left)) & 0xFF
            else:
                raise ValueError(f"Unknown PNG filter type {filter_type} at scanline {y}.")

            output[curr_pos] = recon

    return output


def calculate_stego_capacity(width: int, height: int) -> Dict[str, Any]:
    """Calculate maximum text payload capacity in characters/bytes for given dimensions."""
    # 3 bits per pixel (R, G, B channels; A ignored if present)
    total_bits = width * height * 3
    total_bytes = total_bits // 8
    header_bytes = 12  # 4 magic + 4 length + 4 crc32
    available_payload_bytes = max(0, total_bytes - header_bytes)

    return {
        "width": width,
        "height": height,
        "total_pixels": width * height,
        "embeddable_bits": total_bits,
        "header_bytes": header_bytes,
        "max_payload_bytes": available_payload_bytes,
        "max_payload_characters_utf8": available_payload_bytes,
    }


def embed_stego_payload(png_bytes: bytes, message: str) -> Tuple[bytes, Dict[str, Any]]:
    """
    Embed UTF-8 text message into the LSBs of a PNG image.
    Returns (stego_png_bytes, metadata_dict).
    """
    msg_bytes = message.encode("utf-8")
    width, height, color_type, bpp, raw_scanlines = parse_png(png_bytes)
    normalized_scanlines = unfilter_scanlines(width, height, bpp, raw_scanlines)

    capacity = calculate_stego_capacity(width, height)
    if len(msg_bytes) > capacity["max_payload_bytes"]:
        raise ValueError(
            f"Insufficient image capacity: message requires {len(msg_bytes)} bytes "
            f"plus 12 bytes header, but image only provides {capacity['max_payload_bytes']} bytes capacity."
        )

    # Assemble payload: MAGIC (4) + LENGTH (4) + CRC32 (4) + PAYLOAD (N)
    msg_crc = zlib.crc32(msg_bytes) & 0xFFFFFFFF
    header = STEGO_MAGIC + struct.pack(">II", len(msg_bytes), msg_crc)
    full_payload = header + msg_bytes

    # Convert full_payload into bitstream (MSB first)
    bitstream: List[int] = []
    for b in full_payload:
        for bit_idx in range(7, -1, -1):
            bitstream.append((b >> bit_idx) & 1)

    stride = 1 + width * bpp
    bit_offset = 0
    total_bits_to_embed = len(bitstream)

    for y in range(height):
        if bit_offset >= total_bits_to_embed:
            break
        row_start = y * stride
        for x in range(width):
            if bit_offset >= total_bits_to_embed:
                break
            pixel_start = row_start + 1 + x * bpp
            # Embed in R, G, B channels (channels 0, 1, 2)
            for channel in range(3):
                if bit_offset < total_bits_to_embed:
                    orig_byte = normalized_scanlines[pixel_start + channel]
                    embed_bit = bitstream[bit_offset]
                    new_byte = (orig_byte & 0xFE) | embed_bit
                    normalized_scanlines[pixel_start + channel] = new_byte
                    bit_offset += 1

    # Re-package PNG
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, color_type, 0, 0, 0)
    ihdr_chunk = create_png_chunk(b"IHDR", ihdr_data)
    compressed_idat = zlib.compress(bytes(normalized_scanlines), level=6)
    idat_chunk = create_png_chunk(b"IDAT", compressed_idat)
    iend_chunk = create_png_chunk(b"IEND", b"")

    output_png = PNG_SIGNATURE + ihdr_chunk + idat_chunk + iend_chunk

    meta = {
        "width": width,
        "height": height,
        "color_type": "RGB" if color_type == 2 else "RGBA",
        "message_length_bytes": len(msg_bytes),
        "embedded_bits": total_bits_to_embed,
        "capacity_bytes": capacity["max_payload_bytes"],
        "crc32": f"{msg_crc:08X}",
    }
    return output_png, meta


def extract_stego_payload(png_bytes: bytes) -> Dict[str, Any]:
    """
    Extract embedded steganographic message from a PNG image.
    Validates magic bytes and CRC32 integrity.
    """
    width, height, color_type, bpp, raw_scanlines = parse_png(png_bytes)
    normalized_scanlines = unfilter_scanlines(width, height, bpp, raw_scanlines)
    stride = 1 + width * bpp

    # Extract all LSBs from R, G, B channels into a bitstream
    bits: List[int] = []
    # Only need enough bits for header (96 bits) initially
    for y in range(height):
        row_start = y * stride
        for x in range(width):
            pixel_start = row_start + 1 + x * bpp
            for channel in range(3):
                bits.append(normalized_scanlines[pixel_start + channel] & 1)

    if len(bits) < 96:
        raise ValueError("Image too small to contain a CipherMesh stego payload header.")

    # Read 12-byte header
    header_bytes = bytearray()
    for byte_idx in range(12):
        b = 0
        for bit_idx in range(8):
            b = (b << 1) | bits[byte_idx * 8 + bit_idx]
        header_bytes.append(b)

    magic = header_bytes[:4]
    if magic != STEGO_MAGIC:
        raise ValueError("No CipherMesh steganographic payload detected (invalid magic header).")

    payload_len, expected_crc = struct.unpack(">II", header_bytes[4:12])
    capacity = calculate_stego_capacity(width, height)
    if payload_len > capacity["max_payload_bytes"]:
        raise ValueError(
            f"Corrupted stego header: declared payload length ({payload_len} bytes) "
            f"exceeds maximum image capacity ({capacity['max_payload_bytes']} bytes)."
        )

    total_bits_needed = (12 + payload_len) * 8
    if len(bits) < total_bits_needed:
        raise ValueError("Image truncated: does not contain the full declared stego payload bits.")

    # Read payload bytes
    payload_bytes = bytearray()
    for byte_idx in range(12, 12 + payload_len):
        b = 0
        for bit_idx in range(8):
            b = (b << 1) | bits[byte_idx * 8 + bit_idx]
        payload_bytes.append(b)

    # Verify CRC32
    actual_crc = zlib.crc32(payload_bytes) & 0xFFFFFFFF
    if actual_crc != expected_crc:
        raise ValueError(
            f"Steganographic payload integrity failure: CRC32 mismatch "
            f"(expected {expected_crc:08X}, computed {actual_crc:08X}). The image or data has been modified."
        )

    try:
        extracted_text = payload_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("Steganographic payload corrupted: extracted data is not valid UTF-8.")

    return {
        "width": width,
        "height": height,
        "message": extracted_text,
        "message_length": len(payload_bytes),
        "crc32": f"{actual_crc:08X}",
        "integrity_verified": True,
    }

