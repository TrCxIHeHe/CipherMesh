import secrets
import string
from typing import Any, Dict, List


def generate_otp_key(length: int) -> str:
    """
    Generate an educational OTP key of exact length using cryptographic randomness.
    Uses printable ASCII characters.
    """
    if length <= 0:
        raise ValueError("Key length must be greater than 0.")
    charset = string.ascii_letters + string.digits
    return "".join(secrets.choice(charset) for _ in range(length))


def otp_cipher(text: str, key: str) -> Dict[str, Any]:
    """
    Encrypt or decrypt text using the One-Time Pad via bitwise XOR.
    Since XOR is self-inverting (A ^ B ^ B = A), the exact same operation encrypts and decrypts.
    """
    if len(text) == 0:
        raise ValueError("Plaintext cannot be empty.")
    if len(key) != len(text):
        raise ValueError(
            f"One-Time Pad requires key length to exactly match text length "
            f"(text has {len(text)} characters, key has {len(key)})."
        )

    text_bytes = text.encode("utf-8")
    key_bytes = key.encode("utf-8")

    if len(text_bytes) != len(key_bytes):
        raise ValueError("Text and key byte lengths must match when encoded.")

    cipher_bytes = bytes([tb ^ kb for tb, kb in zip(text_bytes, key_bytes)])
    
    # Trace per character
    steps: List[Dict[str, Any]] = []
    for idx, (t_byte, k_byte, c_byte) in enumerate(zip(text_bytes, key_bytes, cipher_bytes)):
        t_bin = format(t_byte, "08b")
        k_bin = format(k_byte, "08b")
        c_bin = format(c_byte, "08b")
        
        bit_xor_details = [
            {"bit_index": 7 - b, "text_bit": int(t_bin[b]), "key_bit": int(k_bin[b]), "result_bit": int(c_bin[b])}
            for b in range(8)
        ]

        steps.append({
            "position": idx,
            "text_char": chr(t_byte) if 32 <= t_byte <= 126 else f"\\x{t_byte:02x}",
            "text_byte": t_byte,
            "text_binary": t_bin,
            "key_char": chr(k_byte) if 32 <= k_byte <= 126 else f"\\x{k_byte:02x}",
            "key_byte": k_byte,
            "key_binary": k_bin,
            "cipher_byte": c_byte,
            "cipher_binary": c_bin,
            "cipher_hex": f"{c_byte:02x}",
            "bit_details": bit_xor_details,
        })

    return {
        "input_text": text,
        "key": key,
        "output_hex": cipher_bytes.hex(),
        "output_binary": " ".join(format(b, "08b") for b in cipher_bytes),
        "steps": steps,
        "security_notes": {
            "perfect_secrecy": "Shannon proved OTP provides perfect secrecy (H(M|C) = H(M)) ONLY IF the key is truly random, as long as the message, never reused, and kept completely secret.",
            "reuse_vulnerability": "If the same key K is used for two messages M1 and M2, C1 ^ C2 = (M1 ^ K) ^ (M2 ^ K) = M1 ^ M2. The key is completely cancelled out, exposing statistical and linguistic correlations between the two plaintexts.",
        },
    }


def demonstrate_key_reuse(plaintext1: str, plaintext2: str, key: str = None) -> Dict[str, Any]:
    """
    Demonstrate the catastrophic vulnerability of reusing an OTP key.
    Shows C1 ^ C2 = P1 ^ P2 with bit-by-bit key cancellation.
    """
    min_len = min(len(plaintext1), len(plaintext2))
    p1 = plaintext1[:min_len]
    p2 = plaintext2[:min_len]

    if not key or len(key) < min_len:
        key = generate_otp_key(min_len)
    else:
        key = key[:min_len]

    c1_bytes = bytes([ord(c) ^ ord(k) for c, k in zip(p1, key)])
    c2_bytes = bytes([ord(c) ^ ord(k) for c, k in zip(p2, key)])
    xor_ciphers = bytes([b1 ^ b2 for b1, b2 in zip(c1_bytes, c2_bytes)])
    xor_plains = bytes([ord(c1) ^ ord(c2) for c1, c2 in zip(p1, p2)])

    assert xor_ciphers == xor_plains, "C1 ^ C2 must equal P1 ^ P2"

    comparisons = []
    for i in range(min_len):
        b_c1 = c1_bytes[i]
        b_c2 = c2_bytes[i]
        b_xor = xor_ciphers[i]
        comparisons.append({
            "position": i,
            "p1_char": p1[i],
            "p2_char": p2[i],
            "key_char": key[i],
            "c1_hex": f"{b_c1:02x}",
            "c2_hex": f"{b_c2:02x}",
            "c1_xor_c2_bin": format(b_xor, "08b"),
            "p1_xor_p2_bin": format(xor_plains[i], "08b"),
            "keys_cancelled": True,
        })

    return {
        "p1": p1,
        "p2": p2,
        "key": key,
        "c1_hex": c1_bytes.hex(),
        "c2_hex": c2_bytes.hex(),
        "xor_ciphers_hex": xor_ciphers.hex(),
        "xor_plains_hex": xor_plains.hex(),
        "cancellation_verified": True,
        "comparisons": comparisons,
    }

