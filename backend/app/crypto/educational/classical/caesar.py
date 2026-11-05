from typing import Any, Dict, List

# Standard English letter frequencies (percentage)
ENGLISH_FREQUENCIES: Dict[str, float] = {
    'A': 8.167, 'B': 1.492, 'C': 2.782, 'D': 4.253, 'E': 12.702,
    'F': 2.228, 'G': 2.015, 'H': 6.094, 'I': 6.966, 'J': 0.153,
    'K': 0.772, 'L': 4.025, 'M': 2.406, 'N': 6.749, 'O': 7.507,
    'P': 1.929, 'Q': 0.095, 'R': 5.987, 'S': 6.327, 'T': 9.056,
    'U': 2.758, 'V': 0.978, 'W': 2.360, 'X': 0.150, 'Y': 1.974,
    'Z': 0.074,
}


def calculate_frequencies(text: str) -> Dict[str, float]:
    """Calculate percentage frequency of each letter A-Z in text."""
    counts = {chr(ord('A') + i): 0 for i in range(26)}
    total_letters = 0
    for char in text.upper():
        if 'A' <= char <= 'Z':
            counts[char] += 1
            total_letters += 1

    if total_letters == 0:
        return {k: 0.0 for k in counts}

    return {k: round((v / total_letters) * 100, 3) for k, v in counts.items()}


def get_alphabet_mapping(shift: int) -> List[Dict[str, str]]:
    """Return the plain-to-cipher alphabet mapping table for a given shift."""
    shift = shift % 26
    mapping = []
    for i in range(26):
        plain_char = chr(ord('A') + i)
        cipher_char = chr(ord('A') + ((i + shift) % 26))
        mapping.append({
            "plain": plain_char,
            "plain_index": str(i),
            "cipher": cipher_char,
            "cipher_index": str((i + shift) % 26),
        })
    return mapping


def caesar_cipher(text: str, shift: int, decrypt: bool = False) -> Dict[str, Any]:
    """
    Encrypt or decrypt text using the Caesar cipher.
    Returns result, transformation steps, alphabet mapping, and frequency analysis.
    """
    if not isinstance(shift, int):
        raise ValueError("Shift key must be an integer.")

    effective_shift = (-shift % 26) if decrypt else (shift % 26)
    result_chars: List[str] = []
    steps: List[Dict[str, Any]] = []

    for idx, ch in enumerate(text):
        if 'A' <= ch <= 'Z':
            orig_idx = ord(ch) - ord('A')
            new_idx = (orig_idx + effective_shift) % 26
            res_ch = chr(ord('A') + new_idx)
            formula = f"({orig_idx} {'-' if decrypt else '+'} {shift}) mod 26 = {new_idx}"
            steps.append({
                "char": ch,
                "orig_idx": orig_idx,
                "shift": shift,
                "new_idx": new_idx,
                "result_char": res_ch,
                "formula": formula,
                "position": idx,
            })
            result_chars.append(res_ch)
        elif 'a' <= ch <= 'z':
            orig_idx = ord(ch) - ord('a')
            new_idx = (orig_idx + effective_shift) % 26
            res_ch = chr(ord('a') + new_idx)
            formula = f"({orig_idx} {'-' if decrypt else '+'} {shift}) mod 26 = {new_idx}"
            steps.append({
                "char": ch,
                "orig_idx": orig_idx,
                "shift": shift,
                "new_idx": new_idx,
                "result_char": res_ch,
                "formula": formula,
                "position": idx,
            })
            result_chars.append(res_ch)
        else:
            # Non-alphabetic characters are preserved
            steps.append({
                "char": ch,
                "orig_idx": None,
                "shift": shift,
                "new_idx": None,
                "result_char": ch,
                "formula": "Non-alphabetic character preserved",
                "position": idx,
            })
            result_chars.append(ch)

    output_text = "".join(result_chars)

    return {
        "input_text": text,
        "output_text": output_text,
        "shift": shift,
        "effective_shift": effective_shift,
        "operation": "decryption" if decrypt else "encryption",
        "steps": steps,
        "alphabet_mapping": get_alphabet_mapping(shift if not decrypt else -shift),
        "frequencies": {
            "input": calculate_frequencies(text),
            "output": calculate_frequencies(output_text),
            "english_standard": ENGLISH_FREQUENCIES,
        },
    }

