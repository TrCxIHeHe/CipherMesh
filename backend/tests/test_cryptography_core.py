import pytest


def mod_pow(base: int, exponent: int, modulus: int) -> int:
    result = 1
    current = base % modulus
    exp = exponent
    while exp > 0:
        if exp % 2 == 1:
            result = (result * current) % modulus
        current = (current * current) % modulus
        exp //= 2
    return result


def egcd(a: int, b: int) -> tuple[int, int, int]:
    if b == 0:
        return a, 1, 0
    g, x1, y1 = egcd(b, a % b)
    return g, y1, x1 - (a // b) * y1


def mod_inverse(value: int, modulus: int) -> int:
    g, x, _ = egcd(value, modulus)
    assert g == 1
    return (x % modulus + modulus) % modulus


def point_add(p1, p2, p, a):
    if p1 is None:
        return p2
    if p2 is None:
        return p1
    if p1[0] == p2[0] and (p1[1] + p2[1]) % p == 0:
        return None
    if p1 == p2:
        slope = ((3 * p1[0] * p1[0] + a) * mod_inverse(2 * p1[1], p)) % p
    else:
        slope = ((p2[1] - p1[1]) * mod_inverse((p2[0] - p1[0]) % p, p)) % p
    x3 = (slope * slope - p1[0] - p2[0]) % p
    y3 = (slope * (p1[0] - x3) - p1[1]) % p
    return (x3, y3)


def scalar_mult(point, scalar, p, a):
    result = None
    addend = point
    s = scalar
    while s > 0:
        if s % 2 == 1:
            result = point_add(result, addend, p, a)
        addend = point_add(addend, addend, p, a)
        s //= 2
    return result


def test_toy_rsa_round_trip():
    p = 61
    q = 53
    e = 17
    modulus = p * q
    phi = (p - 1) * (q - 1)
    d = mod_inverse(e, phi)
    message = [65, 66, 67]
    ciphertext = [mod_pow(block, e, modulus) for block in message]
    recovered = [mod_pow(block, d, modulus) for block in ciphertext]
    assert recovered == message


def test_dh_shared_secret_recomputed_from_private_inputs():
    p = 23
    g = 5
    alice_private = 6
    bob_private = 15
    alice_public = mod_pow(g, alice_private, p)
    bob_public = mod_pow(g, bob_private, p)
    alice_secret = mod_pow(bob_public, alice_private, p)
    bob_secret = mod_pow(alice_public, bob_private, p)
    assert alice_secret == bob_secret == 2


def test_small_curve_generator_is_valid_and_scalar_order_matches():
    p = 17
    a = 0
    b = 3
    G = (3, 8)
    assert (G[1] ** 2 - (G[0] ** 3 + a * G[0] + b)) % p == 0
    assert scalar_mult(G, 18, p, a) is None
    assert scalar_mult(G, 3, p, a) == (4, 13)


def test_bbs_requires_valid_primes_and_seed():
    p = 11
    q = 23
    n = p * q
    seed = 2
    assert p % 4 == 3 and q % 4 == 3
    assert seed > 0 and seed < n and __import__('math').gcd(seed, n) == 1
    x = (seed * seed) % n
    bits = []
    for _ in range(8):
        x = (x * x) % n
        bits.append(x % 2)
    assert bits == [0, 1, 1, 1, 0, 0, 1, 0]
