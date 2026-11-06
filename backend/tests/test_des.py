"""Unit and Known-Answer Tests for DES Workbench."""
import pytest


def test_des_known_answer_test_kat(client):
    """
    Standard NIST Known-Answer Test vector:
    Key: 133457799BBCDFF1
    Plaintext: 0123456789ABCDEF
    Expected Ciphertext: 85E813540F0AB405
    """
    payload = {
        "plaintext_hex": "0123456789ABCDEF",
        "key_hex": "133457799BBCDFF1",
        "decrypt": False,
    }
    response = client.post("/api/v1/lab/des/encrypt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["output_hex"] == "85E813540F0AB405"
    assert data["input_hex"] == "0123456789ABCDEF"
    assert len(data["rounds"]) == 16


def test_des_decryption_round_trip(client):
    """Verify that decrypting the KAT ciphertext recovers original plaintext."""
    payload = {
        "plaintext_hex": "85E813540F0AB405",
        "key_hex": "133457799BBCDFF1",
        "decrypt": True,
    }
    response = client.post("/api/v1/lab/des/decrypt", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["output_hex"] == "0123456789ABCDEF"


def test_des_intermediate_trace_integrity(client):
    """Inspect full 16-round intermediate trace values."""
    payload = {
        "plaintext_hex": "0123456789ABCDEF",
        "key_hex": "133457799BBCDFF1",
        "decrypt": False,
    }
    response = client.post("/api/v1/lab/des/trace", json=payload)
    assert response.status_code == 200
    data = response.json()
    rounds = data["rounds"]
    assert len(rounds) == 16

    # Verify Feistel structure in every round:
    # L_i = R_{i-1} (left_out == right_in of same round; left_in of next round == left_out of current round)
    # R_i = L_{i-1} ^ f(R_{i-1}, K_i) (right_in of next round == right_out of current round)
    for i in range(1, 16):
        prev_left_out = rounds[i - 1]["left_out"]
        curr_left_in = rounds[i]["left_in"]
        assert curr_left_in == prev_left_out

        prev_right_out = rounds[i - 1]["right_out"]
        curr_right_in = rounds[i]["right_in"]
        assert curr_right_in == prev_right_out

    # Verify each round has 8 S-box substitutions
    for r in rounds:
        assert len(r["sbox_blocks"]) == 8
        assert len(r["round_key_bin"]) == 48
        assert len(r["expansion_bin"]) == 48
        assert len(r["p_permutation_bin"]) == 32


def test_des_avalanche_analysis(client):
    """Verify avalanche effect when flipping a single bit."""
    payload = {
        "plaintext_hex": "0123456789ABCDEF",
        "key_hex": "133457799BBCDFF1",
        "flip_bit_index": 0,
    }
    response = client.post("/api/v1/lab/des/avalanche", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["flipped_bit_position"] == 0
    assert data["original_ciphertext_hex"] == "85E813540F0AB405"
    assert data["modified_ciphertext_hex"] != "85E813540F0AB405"
    assert len(data["round_progression"]) == 16
    # In DES, by round 16, typically ~40-60% of bits differ (avalanche criterion)
    assert data["final_differing_bits"] >= 15


def test_des_invalid_inputs(client):
    """Test validation errors for bad hex or length."""
    # Too short
    res1 = client.post("/api/v1/lab/des/encrypt", json={"plaintext_hex": "1234", "key_hex": "133457799BBCDFF1"})
    assert res1.status_code == 400
    assert "16-character" in res1.json()["detail"]

    # Non-hex
    res2 = client.post("/api/v1/lab/des/encrypt", json={"plaintext_hex": "0123456789ABCDEG", "key_hex": "133457799BBCDFF1"})
    assert res2.status_code == 400
    assert "hexadecimal" in res2.json()["detail"]

