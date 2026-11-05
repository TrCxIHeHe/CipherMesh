from typing import Any, Dict, List, Tuple


def generate_playfair_matrix(key: str) -> List[List[str]]:
    """
    Generate 5x5 Playfair key matrix from a key string.
    J is merged with I.
    """
    clean_key = "".join(c.upper() for c in key if c.isalpha()).replace('J', 'I')
    matrix_chars: List[str] = []
    seen = set()

    for ch in clean_key:
        if ch not in seen:
            seen.add(ch)
            matrix_chars.append(ch)

    # Append remaining alphabet (excluding J)
    for i in range(26):
        ch = chr(ord('A') + i)
        if ch == 'J':
            continue
        if ch not in seen:
            seen.add(ch)
            matrix_chars.append(ch)

    return [matrix_chars[i * 5 : (i + 1) * 5] for i in range(5)]


def find_position(matrix: List[List[str]], char: str) -> Tuple[int, int]:
    """Find (row, col) coordinates of character in 5x5 matrix."""
    target = 'I' if char == 'J' else char
    for r in range(5):
        for c in range(5):
            if matrix[r][c] == target:
                return r, c
    raise ValueError(f"Character '{char}' not found in Playfair matrix.")


def prepare_plaintext(text: str) -> List[Tuple[str, str]]:
    """
    Format plaintext into digraph pairs for Playfair cipher.
    Filters non-alphas, merges J into I, inserts filler 'X' on duplicate pairs,
    and appends 'X' (or 'Z' if ending in 'X') if odd length.
    """
    cleaned = [c.upper() if c.upper() != 'J' else 'I' for c in text if c.isalpha()]
    digraphs: List[Tuple[str, str]] = []
    i = 0
    while i < len(cleaned):
        c1 = cleaned[i]
        if i + 1 < len(cleaned):
            c2 = cleaned[i + 1]
            if c1 == c2:
                # Same character in digraph: insert filler
                filler = 'Q' if c1 == 'X' else 'X'
                digraphs.append((c1, filler))
                i += 1
            else:
                digraphs.append((c1, c2))
                i += 2
        else:
            # Odd trailing character: append filler
            filler = 'Z' if c1 == 'X' else 'X'
            digraphs.append((c1, filler))
            i += 1
    return digraphs


def prepare_ciphertext(text: str) -> List[Tuple[str, str]]:
    """Split ciphertext into digraph pairs. Verifies even length."""
    cleaned = [c.upper() for c in text if c.isalpha()]
    if len(cleaned) % 2 != 0:
        raise ValueError("Playfair ciphertext must contain an even number of alphabetic characters.")
    return [(cleaned[i], cleaned[i + 1]) for i in range(0, len(cleaned), 2)]


def playfair_cipher(text: str, key: str, decrypt: bool = False) -> Dict[str, Any]:
    """
    Encrypt or decrypt text using the Playfair cipher.
    Returns the 5x5 matrix, prepared digraphs, and step-by-step transformation traces.
    """
    if not key or not any(c.isalpha() for c in key):
        raise ValueError("Playfair key must contain at least one alphabetic character.")

    matrix = generate_playfair_matrix(key)
    pairs = prepare_ciphertext(text) if decrypt else prepare_plaintext(text)
    
    transformed_pairs: List[Tuple[str, str]] = []
    steps: List[Dict[str, Any]] = []

    shift = -1 if decrypt else 1

    for pair_idx, (c1, c2) in enumerate(pairs):
        r1, col1 = find_position(matrix, c1)
        r2, col2 = find_position(matrix, c2)

        if r1 == r2:
            # Rule 1: Same row
            rule = "same_row"
            rule_name = "Same Row Rule"
            new_col1 = (col1 + shift) % 5
            new_col2 = (col2 + shift) % 5
            out1 = matrix[r1][new_col1]
            out2 = matrix[r2][new_col2]
            direction = "left" if decrypt else "right"
            explanation = (
                f"Both '{c1}' ({r1}, {col1}) and '{c2}' ({r2}, {col2}) share row {r1}. "
                f"Shift {direction} with wrap-around: '{c1}' -> '{out1}' ({r1}, {new_col1}), "
                f"'{c2}' -> '{out2}' ({r2}, {new_col2})."
            )
        elif col1 == col2:
            # Rule 2: Same column
            rule = "same_col"
            rule_name = "Same Column Rule"
            new_r1 = (r1 + shift) % 5
            new_r2 = (r2 + shift) % 5
            out1 = matrix[new_r1][col1]
            out2 = matrix[new_r2][col2]
            direction = "up" if decrypt else "down"
            explanation = (
                f"Both '{c1}' ({r1}, {col1}) and '{c2}' ({r2}, {col2}) share column {col1}. "
                f"Shift {direction} with wrap-around: '{c1}' -> '{out1}' ({new_r1}, {col1}), "
                f"'{c2}' -> '{out2}' ({new_r2}, {col2})."
            )
        else:
            # Rule 3: Rectangle
            rule = "rectangle"
            rule_name = "Rectangle Rule"
            out1 = matrix[r1][col2]
            out2 = matrix[r2][col1]
            explanation = (
                f"'{c1}' ({r1}, {col1}) and '{c2}' ({r2}, {col2}) form opposite corners of a rectangle. "
                f"Swap column coordinates: '{c1}' takes column {col2} -> '{out1}' ({r1}, {col2}), "
                f"'{c2}' takes column {col1} -> '{out2}' ({r2}, {col1})."
            )

        transformed_pairs.append((out1, out2))
        steps.append({
            "pair_index": pair_idx,
            "in_pair": [c1, c2],
            "coords_in": [{"char": c1, "row": r1, "col": col1}, {"char": c2, "row": r2, "col": col2}],
            "rule": rule,
            "rule_name": rule_name,
            "explanation": explanation,
            "out_pair": [out1, out2],
            "coords_out": [
                {"char": out1, "row": r1 if rule != "same_col" else (r1 + shift) % 5, "col": col2 if rule == "rectangle" else (col1 + shift) % 5 if rule == "same_row" else col1},
                {"char": out2, "row": r2 if rule != "same_col" else (r2 + shift) % 5, "col": col1 if rule == "rectangle" else (col2 + shift) % 5 if rule == "same_row" else col2},
            ],
        })

    result_text = "".join(f"{p[0]}{p[1]}" for p in transformed_pairs)

    return {
        "input_text": text,
        "output_text": result_text,
        "key": key,
        "operation": "decryption" if decrypt else "encryption",
        "matrix": matrix,
        "prepared_digraphs": ["".join(p) for p in pairs],
        "steps": steps,
    }

