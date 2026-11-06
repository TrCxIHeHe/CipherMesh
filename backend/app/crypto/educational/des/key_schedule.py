"""DES Key Schedule Generation."""
from typing import List, Tuple
from app.crypto.educational.des.tables import PC1, PC2, SHIFTS


def permute(bits: str, table: List[int]) -> str:
    """Permute a bitstring according to a 1-indexed permutation table."""
    return "".join(bits[idx - 1] for idx in table)


def left_rotate(bits: str, n: int) -> str:
    """Left circular shift of a bitstring by n positions."""
    return bits[n:] + bits[:n]


def hex_to_bin64(hex_str: str) -> str:
    """Normalize and convert a hex string to an exact 64-bit binary string."""
    clean = hex_str.strip().replace(" ", "").replace("0x", "").upper()
    val = int(clean, 16)
    return format(val, "064b")


def bin_to_hex(bin_str: str) -> str:
    """Convert bitstring to uppercase hex string."""
    num_hex_digits = (len(bin_str) + 3) // 4
    val = int(bin_str, 2)
    return format(val, f"0{num_hex_digits}X")


def generate_round_keys(key_64_bin: str) -> List[Tuple[str, str, str, str]]:
    """
    Generate the 16 48-bit DES round keys from a 64-bit key.
    Returns list of tuples: (round_num_str, C_i, D_i, K_i_48bit_bin).
    """
    if len(key_64_bin) != 64:
        raise ValueError(f"Key must be exactly 64 bits (got {len(key_64_bin)} bits).")

    # PC-1: 64 bits -> 56 bits (C0: 28 bits, D0: 28 bits)
    pc1_bits = permute(key_64_bin, PC1)
    c_current = pc1_bits[:28]
    d_current = pc1_bits[28:]

    round_keys: List[Tuple[str, str, str, str]] = []

    for round_idx in range(16):
        shift = SHIFTS[round_idx]
        c_current = left_rotate(c_current, shift)
        d_current = left_rotate(d_current, shift)
        cd_combined = c_current + d_current

        # PC-2: 56 bits -> 48 bits
        k_round = permute(cd_combined, PC2)
        round_keys.append((str(round_idx + 1), c_current, d_current, k_round))

    return round_keys

