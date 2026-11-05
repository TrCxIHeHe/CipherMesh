import math
from typing import Any, Dict, List


def mod_inverse(a: int, m: int = 26) -> int:
    """Compute modular multiplicative inverse using Extended Euclidean Algorithm."""
    a = a % m
    for x in range(1, m):
        if (a * x) % m == 1:
            return x
    raise ValueError(f"No modular inverse for {a} modulo {m}.")


def determinant_2x2(matrix: List[List[int]]) -> int:
    """Calculate determinant of 2x2 matrix."""
    return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]


def determinant_3x3(matrix: List[List[int]]) -> int:
    """Calculate determinant of 3x3 matrix using Laplace expansion."""
    m = matrix
    return (
        m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
        - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
        + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    )


def inverse_matrix_2x2(matrix: List[List[int]]) -> Tuple[List[List[int]], int, int, int]:
    """
    Compute modular inverse of 2x2 matrix modulo 26.
    Returns (inv_matrix, det, det_mod, det_inv).
    """
    det = determinant_2x2(matrix)
    det_mod = det % 26
    g = math.gcd(det_mod, 26)
    if g != 1:
        raise ValueError(
            f"Key matrix is non-invertible mod 26: determinant is {det} (mod 26 = {det_mod}), "
            f"which shares a factor with 26 (gcd={g}). A valid key must have gcd(det, 26) = 1."
        )

    det_inv = mod_inverse(det_mod, 26)

    # Adjugate for 2x2: [[d, -b], [-c, a]]
    adj = [
        [matrix[1][1], -matrix[0][1]],
        [-matrix[1][0], matrix[0][0]],
    ]

    inv_matrix = [
        [(det_inv * adj[r][c]) % 26 for c in range(2)]
        for r in range(2)
    ]
    return inv_matrix, det, det_mod, det_inv


def inverse_matrix_3x3(matrix: List[List[int]]) -> Tuple[List[List[int]], int, int, int]:
    """
    Compute modular inverse of 3x3 matrix modulo 26.
    Returns (inv_matrix, det, det_mod, det_inv).
    """
    det = determinant_3x3(matrix)
    det_mod = det % 26
    g = math.gcd(det_mod, 26)
    if g != 1:
        raise ValueError(
            f"Key matrix is non-invertible mod 26: determinant is {det} (mod 26 = {det_mod}), "
            f"which shares a factor with 26 (gcd={g}). A valid key must have gcd(det, 26) = 1."
        )

    det_inv = mod_inverse(det_mod, 26)
    m = matrix

    # Cofactor matrix transpose (adjugate)
    adj = [
        [
            (m[1][1] * m[2][2] - m[1][2] * m[2][1]),
            -(m[0][1] * m[2][2] - m[0][2] * m[2][1]),
            (m[0][1] * m[1][2] - m[0][2] * m[1][1]),
        ],
        [
            -(m[1][0] * m[2][2] - m[1][2] * m[2][0]),
            (m[0][0] * m[2][2] - m[0][2] * m[2][0]),
            -(m[0][0] * m[1][2] - m[0][2] * m[1][0]),
        ],
        [
            (m[1][0] * m[2][1] - m[1][1] * m[2][0]),
            -(m[0][0] * m[2][1] - m[0][1] * m[2][0]),
            (m[0][0] * m[1][1] - m[0][1] * m[1][0]),
        ],
    ]

    inv_matrix = [
        [(det_inv * adj[r][c]) % 26 for c in range(3)]
        for r in range(3)
    ]
    return inv_matrix, det, det_mod, det_inv


from typing import Tuple


def validate_and_invert_key(matrix: List[List[int]]) -> Tuple[int, List[List[int]], int, int, int]:
    """
    Validate matrix size (2x2 or 3x3) and compute its modular inverse mod 26.
    Returns (dimension, inv_matrix, det, det_mod, det_inv).
    """
    if not isinstance(matrix, list) or len(matrix) not in (2, 3):
        raise ValueError("Key matrix must be a 2x2 or 3x3 list of lists of integers.")

    dim = len(matrix)
    for row in matrix:
        if not isinstance(row, list) or len(row) != dim:
            raise ValueError(f"Each row must contain exactly {dim} integer values.")
        for val in row:
            if not isinstance(val, int):
                raise ValueError("All matrix elements must be integers.")

    if dim == 2:
        inv_matrix, det, det_mod, det_inv = inverse_matrix_2x2(matrix)
    else:
        inv_matrix, det, det_mod, det_inv = inverse_matrix_3x3(matrix)

    return dim, inv_matrix, det, det_mod, det_inv


def hill_cipher(text: str, key_matrix: List[List[int]], decrypt: bool = False) -> Dict[str, Any]:
    """
    Encrypt or decrypt text using the Hill cipher with detailed vector arithmetic traces.
    """
    dim, inv_matrix, det, det_mod, det_inv = validate_and_invert_key(key_matrix)
    active_matrix = inv_matrix if decrypt else key_matrix

    # Clean text: uppercase letters only
    cleaned_chars = [c.upper() for c in text if c.isalpha()]
    if not cleaned_chars:
        raise ValueError("Input text must contain at least one alphabetic character.")

    # Pad text with 'X' to multiple of dimension
    padding_needed = (dim - (len(cleaned_chars) % dim)) % dim
    padded_chars = cleaned_chars + ['X'] * padding_needed

    output_chars: List[str] = []
    vector_steps: List[Dict[str, Any]] = []

    for blk_idx in range(0, len(padded_chars), dim):
        block = padded_chars[blk_idx : blk_idx + dim]
        in_vector = [ord(c) - ord('A') for c in block]
        out_vector: List[int] = []
        arithmetic_traces: List[Dict[str, Any]] = []

        for row_idx in range(dim):
            row = active_matrix[row_idx]
            terms = [f"{row[j]} * {in_vector[j]}" for j in range(dim)]
            products = [row[j] * in_vector[j] for j in range(dim)]
            sum_products = sum(products)
            res_val = sum_products % 26
            res_char = chr(ord('A') + res_val)
            out_vector.append(res_val)

            formula = (
                f"({' + '.join(terms)}) mod 26 = "
                f"({' + '.join(str(p) for p in products)}) mod 26 = "
                f"{sum_products} mod 26 = {res_val} ('{res_char}')"
            )
            arithmetic_traces.append({
                "row_index": row_idx,
                "matrix_row": row,
                "vector": in_vector,
                "formula": formula,
                "result_value": res_val,
                "result_char": res_char,
            })
            output_chars.append(res_char)

        vector_steps.append({
            "block_index": blk_idx // dim,
            "input_chars": block,
            "input_vector": in_vector,
            "output_vector": out_vector,
            "output_chars": [chr(ord('A') + v) for v in out_vector],
            "arithmetic": arithmetic_traces,
        })

    return {
        "input_text": text,
        "output_text": "".join(output_chars),
        "dimension": dim,
        "key_matrix": key_matrix,
        "inverse_matrix": inv_matrix,
        "determinant": det,
        "determinant_mod_26": det_mod,
        "modular_inverse_det": det_inv,
        "padding_added": padding_needed,
        "operation": "decryption" if decrypt else "encryption",
        "steps": vector_steps,
    }

