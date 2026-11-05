import pytest


# Caesar Tests
def test_caesar_encrypt_and_decrypt(client):
    req_enc = {"text": "HELLO WORLD", "shift": 3}
    res_enc = client.post("/api/v1/lab/classical/caesar/encrypt", json=req_enc)
    assert res_enc.status_code == 200
    data_enc = res_enc.json()
    assert data_enc["output_text"] == "KHOOR ZRUOG"
    assert len(data_enc["steps"]) == len("HELLO WORLD")
    assert "frequencies" in data_enc
    assert "alphabet_mapping" in data_enc

    # Decrypt round trip
    req_dec = {"text": data_enc["output_text"], "shift": 3}
    res_dec = client.post("/api/v1/lab/classical/caesar/decrypt", json=req_dec)
    assert res_dec.status_code == 200
    data_dec = res_dec.json()
    assert data_dec["output_text"] == "HELLO WORLD"


def test_caesar_validation_errors(client):
    # Invalid shift key > 25
    res = client.post("/api/v1/lab/classical/caesar/encrypt", json={"text": "HELLO", "shift": 30})
    assert res.status_code == 422  # Pydantic validation error


# Monoalphabetic Tests
def test_monoalphabetic_generate_and_roundtrip(client):
    gen_res = client.get("/api/v1/lab/classical/monoalphabetic/generate-key")
    assert gen_res.status_code == 200
    key_data = gen_res.json()
    key = key_data["key"]
    assert len(key) == 26
    assert len(set(key)) == 26

    # Encrypt
    plain = "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG"
    enc_res = client.post("/api/v1/lab/classical/monoalphabetic/encrypt", json={"text": plain, "key": key})
    assert enc_res.status_code == 200
    cipher = enc_res.json()["output_text"]
    assert cipher != plain

    # Decrypt
    dec_res = client.post("/api/v1/lab/classical/monoalphabetic/decrypt", json={"text": cipher, "key": key})
    assert dec_res.status_code == 200
    assert dec_res.json()["output_text"] == plain


def test_monoalphabetic_invalid_key(client):
    # Key with duplicate letters
    invalid_key = "A" * 26
    res = client.post("/api/v1/lab/classical/monoalphabetic/encrypt", json={"text": "HELLO", "key": invalid_key})
    assert res.status_code == 400
    assert "duplicate" in res.json()["detail"].lower()


# Playfair Tests
def test_playfair_encrypt_and_decrypt(client):
    key = "MONARCHY"
    plain = "BALLOON"
    res = client.post("/api/v1/lab/classical/playfair/encrypt", json={"text": plain, "key": key})
    assert res.status_code == 200
    data = res.json()
    assert len(data["matrix"]) == 5
    assert len(data["matrix"][0]) == 5
    assert "I" in [c for row in data["matrix"] for c in row]
    # In BALLOON, LL should be separated by X -> BA, LX, LO, ON
    assert "LX" in data["prepared_digraphs"]
    cipher = data["output_text"]
    assert len(cipher) == 8

    # Decrypt
    dec_res = client.post("/api/v1/lab/classical/playfair/decrypt", json={"text": cipher, "key": key})
    assert dec_res.status_code == 200
    # Decrypted matches prepared digraphs: BALXLOON
    assert dec_res.json()["output_text"] == "BALXLOON"


# Hill Cipher Tests
def test_hill_2x2_encrypt_and_decrypt(client):
    # Invertible 2x2 key: [[9, 4], [5, 7]]
    # det = 63 - 20 = 43 = 17 mod 26. gcd(17, 26) = 1.
    matrix = [[9, 4], [5, 7]]
    plain = "HELP"
    res = client.post("/api/v1/lab/classical/hill/encrypt", json={"text": plain, "matrix": matrix})
    assert res.status_code == 200
    data = res.json()
    assert data["determinant_mod_26"] == 17
    assert data["modular_inverse_det"] == 23
    cipher = data["output_text"]
    assert len(cipher) == 4

    # Decrypt
    dec_res = client.post("/api/v1/lab/classical/hill/decrypt", json={"text": cipher, "matrix": matrix})
    assert dec_res.status_code == 200
    assert dec_res.json()["output_text"] == "HELP"


def test_hill_non_invertible_matrix_rejection(client):
    # Matrix [[1, 2], [3, 4]] -> det = -2 = 24 mod 26 -> gcd(24, 26) = 2 != 1
    matrix = [[1, 2], [3, 4]]
    res = client.post("/api/v1/lab/classical/hill/encrypt", json={"text": "HELLO", "matrix": matrix})
    assert res.status_code == 400
    assert "non-invertible" in res.json()["detail"].lower()


# Vigenere Tests
def test_vigenere_known_example(client):
    # Standard textbook: ATTACKATDAWN with LEMON -> LXFOPVEFRNHR
    res = client.post("/api/v1/lab/classical/vigenere/encrypt", json={"text": "ATTACKATDAWN", "key": "LEMON"})
    assert res.status_code == 200
    data = res.json()
    assert data["output_text"] == "LXFOPVEFRNHR"
    assert data["aligned_key"] == "LEMONLEMONLE"

    # Decrypt
    dec_res = client.post("/api/v1/lab/classical/vigenere/decrypt", json={"text": "LXFOPVEFRNHR", "key": "LEMON"})
    assert dec_res.status_code == 200
    assert dec_res.json()["output_text"] == "ATTACKATDAWN"


# One-Time Pad Tests
def test_otp_encrypt_decrypt_and_reuse_demo(client):
    plain = "CIPHERMESH"
    gen_res = client.post("/api/v1/lab/classical/otp/generate-key", json={"length": len(plain)})
    assert gen_res.status_code == 200
    key = gen_res.json()["key"]
    assert len(key) == len(plain)

    # Encrypt
    res_enc = client.post("/api/v1/lab/classical/otp/encrypt", json={"text": plain, "key": key})
    assert res_enc.status_code == 200
    enc_data = res_enc.json()
    assert "output_hex" in enc_data
    assert "output_binary" in enc_data
    assert len(enc_data["steps"]) == len(plain)

    # Decrypt with same key gives original plain
    # Note: OTP XOR of cipher bytes with key gives back text
    c_bytes = bytes.fromhex(enc_data["output_hex"])
    dec_text = "".join(chr(cb ^ ord(kb)) for cb, kb in zip(c_bytes, key))
    assert dec_text == plain

    # Key reuse demo
    reuse_res = client.post("/api/v1/lab/classical/otp/reuse-demonstration", json={
        "plaintext1": "ATTACKATDAWN",
        "plaintext2": "RETREATNOWXX",
        "key": None,
    })
    assert reuse_res.status_code == 200
    reuse_data = reuse_res.json()
    assert reuse_data["cancellation_verified"] is True
    assert reuse_data["xor_ciphers_hex"] == reuse_data["xor_plains_hex"]


def test_otp_length_mismatch_error(client):
    res = client.post("/api/v1/lab/classical/otp/encrypt", json={"text": "HELLO", "key": "SHORT"})
    # Same length is OK:
    assert res.status_code == 200
    # Mismatch length:
    res_bad = client.post("/api/v1/lab/classical/otp/encrypt", json={"text": "HELLO", "key": "TOOLONGKEY"})
    assert res_bad.status_code == 400
    assert "exact" in res_bad.json()["detail"].lower()

