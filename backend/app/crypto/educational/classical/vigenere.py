from typing import Any, Dict, List


def get_tabula_recta() -> List[List[str]]:
    """Return the 26x26 Tabula Recta grid."""
    return [
        [chr(ord('A') + ((r + c) % 26)) for c in range(26)]
        for r in range(26)
    ]


def vigenere_cipher(text: str, key: str, decrypt: bool = False) -> Dict[str, Any]:
    """
    Encrypt or decrypt text using the Vigenere polyalphabetic cipher.
    Includes repeating key alignment and character-by-character trace.
    """
    clean_key = "".join(c.upper() for c in key if c.isalpha())
    if not clean_key:
        raise ValueError("Vigenere key must contain at least one alphabetic character.")

    result_chars: List[str] = []
    steps: List[Dict[str, Any]] = []
    key_idx = 0
    aligned_key_chars: List[str] = []

    for idx, ch in enumerate(text):
        if ch.isalpha():
            is_upper = ch.isupper()
            p_val = ord(ch.upper()) - ord('A')
            k_char = clean_key[key_idx % len(clean_key)]
            k_val = ord(k_char) - ord('A')
            aligned_key_chars.append(k_char if is_upper else k_char.lower())

            if decrypt:
                res_val = (p_val - k_val) % 26
                formula = f"({p_val} - {k_val}) mod 26 = {res_val}"
            else:
                res_val = (p_val + k_val) % 26
                formula = f"({p_val} + {k_val}) mod 26 = {res_val}"

            res_ch_upper = chr(ord('A') + res_val)
            res_ch = res_ch_upper if is_upper else res_ch_upper.lower()
            result_chars.append(res_ch)

            steps.append({
                "position": idx,
                "input_char": ch,
                "key_char": k_char,
                "key_index": key_idx % len(clean_key),
                "plain_val": p_val,
                "key_val": k_val,
                "result_val": res_val,
                "result_char": res_ch,
                "formula": formula,
                "tabula_recta_row": k_val if not decrypt else p_val,
                "tabula_recta_col": p_val if not decrypt else k_val,
            })
            key_idx += 1
        else:
            result_chars.append(ch)
            aligned_key_chars.append(" ")
            steps.append({
                "position": idx,
                "input_char": ch,
                "key_char": " ",
                "key_index": None,
                "plain_val": None,
                "key_val": None,
                "result_val": None,
                "result_char": ch,
                "formula": "Non-alphabetic character preserved",
                "tabula_recta_row": None,
                "tabula_recta_col": None,
            })

    return {
        "input_text": text,
        "output_text": "".join(result_chars),
        "key": clean_key,
        "aligned_key": "".join(aligned_key_chars),
        "operation": "decryption" if decrypt else "encryption",
        "steps": steps,
        "tabula_recta": get_tabula_recta(),
    }

