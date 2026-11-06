"""Educational DES Core Algorithm with Detailed Intermediate Tracing."""
from typing import Any, Dict, List
from app.crypto.educational.des.tables import IP, FP, E, P, S_BOXES
from app.crypto.educational.des.key_schedule import (
    permute,
    hex_to_bin64,
    bin_to_hex,
    generate_round_keys,
)


def xor_bits(a: str, b: str) -> str:
    """Bitwise XOR of two equal-length bitstrings."""
    return "".join("1" if b1 != b2 else "0" for b1, b2 in zip(a, b))


def feistel_function(r_32_bin: str, k_48_bin: str) -> Dict[str, Any]:
    """
    Feistel round function f(R, K):
    1. Expansion permutation E(R) -> 48 bits.
    2. XOR with subkey K -> 48 bits.
    3. Eight S-boxes substitution -> 32 bits.
    4. Permutation P -> 32 bits.
    """
    # 1. Expansion
    expanded = permute(r_32_bin, E)

    # 2. XOR with Round Key
    xored = xor_bits(expanded, k_48_bin)

    # 3. S-box substitution (8 boxes of 6 bits -> 4 bits)
    sbox_blocks: List[Dict[str, Any]] = []
    sbox_out_bits: List[str] = []

    for box_idx in range(8):
        block_6 = xored[box_idx * 6 : (box_idx + 1) * 6]
        row = (int(block_6[0]) << 1) | int(block_6[5])
        col = (
            (int(block_6[1]) << 3)
            | (int(block_6[2]) << 2)
            | (int(block_6[3]) << 1)
            | int(block_6[4])
        )
        val = S_BOXES[box_idx][row][col]
        val_4bit = format(val, "04b")
        sbox_out_bits.append(val_4bit)

        sbox_blocks.append({
            "box": box_idx + 1,
            "in_6bit": block_6,
            "row": row,
            "col": col,
            "out_val": val,
            "out_4bit": val_4bit,
        })

    sbox_combined = "".join(sbox_out_bits)

    # 4. Permutation P
    p_permuted = permute(sbox_combined, P)

    return {
        "expansion_bin": expanded,
        "expansion_hex": bin_to_hex(expanded),
        "xor_bin": xored,
        "xor_hex": bin_to_hex(xored),
        "sbox_blocks": sbox_blocks,
        "sbox_output_bin": sbox_combined,
        "sbox_output_hex": bin_to_hex(sbox_combined),
        "p_permutation_bin": p_permuted,
        "p_permutation_hex": bin_to_hex(p_permuted),
    }


def des_process_block(
    block_64_bin: str,
    key_64_bin: str,
    decrypt: bool = False,
) -> Dict[str, Any]:
    """
    Execute full 16-round DES encryption or decryption on a 64-bit block
    with complete intermediate step tracing.
    """
    if len(block_64_bin) != 64 or len(key_64_bin) != 64:
        raise ValueError("Both plaintext block and key must be exactly 64 bits.")

    # 1. Generate 16 subkeys
    round_keys = generate_round_keys(key_64_bin)
    if decrypt:
        # For decryption, reverse the subkey schedule
        round_keys = list(reversed(round_keys))

    # 2. Initial Permutation (IP)
    ip_bits = permute(block_64_bin, IP)
    left_current = ip_bits[:32]
    right_current = ip_bits[32:]

    round_traces: List[Dict[str, Any]] = []

    # 3. 16 Feistel Rounds
    for r_idx in range(16):
        round_num_label, c_half, d_half, subkey = round_keys[r_idx]
        feistel_res = feistel_function(right_current, subkey)

        new_left = right_current
        new_right = xor_bits(left_current, feistel_res["p_permutation_bin"])

        round_traces.append({
            "round": r_idx + 1,
            "key_schedule_round": int(round_num_label),
            "left_in": left_current,
            "left_in_hex": bin_to_hex(left_current),
            "right_in": right_current,
            "right_in_hex": bin_to_hex(right_current),
            "round_key_bin": subkey,
            "round_key_hex": bin_to_hex(subkey),
            "key_c_half": c_half,
            "key_d_half": d_half,
            "expansion_bin": feistel_res["expansion_bin"],
            "expansion_hex": feistel_res["expansion_hex"],
            "xor_bin": feistel_res["xor_bin"],
            "xor_hex": feistel_res["xor_hex"],
            "sbox_blocks": feistel_res["sbox_blocks"],
            "sbox_output_bin": feistel_res["sbox_output_bin"],
            "sbox_output_hex": feistel_res["sbox_output_hex"],
            "p_permutation_bin": feistel_res["p_permutation_bin"],
            "p_permutation_hex": feistel_res["p_permutation_hex"],
            "left_out": new_left,
            "left_out_hex": bin_to_hex(new_left),
            "right_out": new_right,
            "right_out_hex": bin_to_hex(new_right),
            "combined_round_hex": bin_to_hex(new_left + new_right),
        })

        left_current = new_left
        right_current = new_right

    # 4. Pre-output: 32-bit swap R16 L16
    pre_output = right_current + left_current

    # 5. Final Permutation (FP / Inverse IP)
    final_cipher = permute(pre_output, FP)

    return {
        "operation": "decryption" if decrypt else "encryption",
        "input_bin": block_64_bin,
        "input_hex": bin_to_hex(block_64_bin),
        "key_bin": key_64_bin,
        "key_hex": bin_to_hex(key_64_bin),
        "ip_bin": ip_bits,
        "ip_hex": bin_to_hex(ip_bits),
        "rounds": round_traces,
        "pre_output_bin": pre_output,
        "pre_output_hex": bin_to_hex(pre_output),
        "output_bin": final_cipher,
        "output_hex": bin_to_hex(final_cipher),
    }


def des_avalanche_analysis(
    plaintext_hex: str,
    key_hex: str,
    flip_bit_index: int = 0,
) -> Dict[str, Any]:
    """
    Demonstrate the Avalanche Effect by flipping a single bit in the 64-bit input
    and comparing intermediate rounds and final ciphertexts.
    """
    p1_bin = hex_to_bin64(plaintext_hex)
    k_bin = hex_to_bin64(key_hex)

    if flip_bit_index < 0 or flip_bit_index >= 64:
        raise ValueError(f"Bit index to flip must be between 0 and 63 (got {flip_bit_index}).")

    # Flip the single bit at flip_bit_index
    p2_list = list(p1_bin)
    p2_list[flip_bit_index] = "1" if p2_list[flip_bit_index] == "0" else "0"
    p2_bin = "".join(p2_list)

    # Process both blocks with full round tracing
    res1 = des_process_block(p1_bin, k_bin, decrypt=False)
    res2 = des_process_block(p2_bin, k_bin, decrypt=False)

    round_comparisons: List[Dict[str, Any]] = []

    for r_idx in range(16):
        r1 = res1["rounds"][r_idx]
        r2 = res2["rounds"][r_idx]

        # Combine L and R for round state (64 bits)
        state1 = r1["left_out"] + r1["right_out"]
        state2 = r2["left_out"] + r2["right_out"]

        # Count differing bits
        diff_bits = sum(1 for b1, b2 in zip(state1, state2) if b1 != b2)
        diff_pct = round((diff_bits / 64) * 100, 2)

        round_comparisons.append({
            "round": r_idx + 1,
            "state1_hex": r1["combined_round_hex"],
            "state2_hex": r2["combined_round_hex"],
            "diff_bits": diff_bits,
            "diff_percent": diff_pct,
        })

    # Final ciphertext differences
    c1_bin = res1["output_bin"]
    c2_bin = res2["output_bin"]
    final_diff_bits = sum(1 for b1, b2 in zip(c1_bin, c2_bin) if b1 != b2)
    final_diff_pct = round((final_diff_bits / 64) * 100, 2)

    return {
        "original_plaintext_hex": res1["input_hex"],
        "modified_plaintext_hex": res2["input_hex"],
        "flipped_bit_position": flip_bit_index,
        "key_hex": res1["key_hex"],
        "original_ciphertext_hex": res1["output_hex"],
        "modified_ciphertext_hex": res2["output_hex"],
        "final_differing_bits": final_diff_bits,
        "final_differing_percent": final_diff_pct,
        "round_progression": round_comparisons,
    }

