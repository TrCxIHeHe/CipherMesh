import secrets
from typing import Any, Dict, List


def generate_substitution_alphabet() -> str:
    """Generate a random 26-letter substitution alphabet using cryptographic randomness."""
    letters = [chr(ord('A') + i) for i in range(26)]
    rng = secrets.SystemRandom()
    rng.shuffle(letters)
    return "".join(letters)


def validate_key(key: str) -> str:
    """Validate that the key consists of exactly 26 distinct alphabetic characters."""
    clean_key = key.strip().upper()
    if len(clean_key) != 26:
        raise ValueError(f"Substitution key must contain exactly 26 characters (got {len(clean_key)}).")
    if not clean_key.isalpha():
        raise ValueError("Substitution key must contain only alphabetic letters (A-Z).")
    if len(set(clean_key)) != 26:
        duplicates = [c for c in clean_key if clean_key.count(c) > 1]
        raise ValueError(f"Substitution key contains duplicate characters: {', '.join(sorted(set(duplicates)))}.")
    return clean_key


def get_alphabet_mapping(key: str) -> List[Dict[str, str]]:
    """Return list of mapping objects for plain to cipher alphabet."""
    key = validate_key(key)
    mapping = []
    for i in range(26):
        plain_char = chr(ord('A') + i)
        cipher_char = key[i]
        mapping.append({
            "plain": plain_char,
            "plain_index": str(i),
            "cipher": cipher_char,
            "cipher_index": str(ord(cipher_char) - ord('A')),
        })
    return mapping


def monoalphabetic_cipher(text: str, key: str, decrypt: bool = False) -> Dict[str, Any]:
    """
    Encrypt or decrypt text using a monoalphabetic substitution cipher.
    """
    valid_key = validate_key(key)
    plain_alphabet = [chr(ord('A') + i) for i in range(26)]
    cipher_alphabet = list(valid_key)

    if decrypt:
        # Decrypt: lookup cipher char, replace with plain char
        forward_map = {cipher_alphabet[i]: plain_alphabet[i] for i in range(26)}
        forward_map_lower = {cipher_alphabet[i].lower(): plain_alphabet[i].lower() for i in range(26)}
    else:
        # Encrypt: lookup plain char, replace with cipher char
        forward_map = {plain_alphabet[i]: cipher_alphabet[i] for i in range(26)}
        forward_map_lower = {plain_alphabet[i].lower(): cipher_alphabet[i].lower() for i in range(26)}

    result_chars: List[str] = []
    steps: List[Dict[str, Any]] = []

    for idx, ch in enumerate(text):
        if ch in forward_map:
            sub = forward_map[ch]
            steps.append({
                "char": ch,
                "result_char": sub,
                "position": idx,
                "formula": f"'{ch}' -> '{sub}'",
            })
            result_chars.append(sub)
        elif ch in forward_map_lower:
            sub = forward_map_lower[ch]
            steps.append({
                "char": ch,
                "result_char": sub,
                "position": idx,
                "formula": f"'{ch}' -> '{sub}'",
            })
            result_chars.append(sub)
        else:
            steps.append({
                "char": ch,
                "result_char": ch,
                "position": idx,
                "formula": "Non-alphabetic character preserved",
            })
            result_chars.append(ch)

    return {
        "input_text": text,
        "output_text": "".join(result_chars),
        "key": valid_key,
        "operation": "decryption" if decrypt else "encryption",
        "alphabet_mapping": get_alphabet_mapping(valid_key),
        "steps": steps,
    }

