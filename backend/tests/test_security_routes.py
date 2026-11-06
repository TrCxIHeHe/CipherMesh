def test_security_auth_and_session(client):
    payload = {"username": "alice", "password": "swordfish123"}
    response = client.post("/api/v1/security/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["username"] == "alice"
    assert data["token"]

    me = client.get("/api/v1/security/auth/me", headers={"Authorization": f"Bearer {data['token']}"})
    assert me.status_code == 200, me.text
    assert me.json()["username"] == "alice"


def test_pki_certificates_and_validation(client):
    ca = client.get("/api/v1/security/pki/root-ca")
    assert ca.status_code == 200, ca.text
    ca_json = ca.json()
    csr = client.post("/api/v1/security/pki/csr", json={"common_name": "alice.example", "email": "alice@example.com"})
    assert csr.status_code == 200, csr.text
    issued = client.post(
        "/api/v1/security/pki/issue",
        json={
            "csr_pem": csr.json()["csr_pem"],
            "ca_private_key_pem": ca_json["private_key_pem"],
            "ca_certificate_pem": ca_json["certificate_pem"],
            "common_name": "alice.example",
            "days": 30,
        },
    )
    assert issued.status_code == 200, issued.text
    cert = issued.json()
    assert cert["subject"]
    assert cert["issuer"]
    assert cert["sha256_fingerprint"]

    validation = client.post(
        "/api/v1/security/pki/validate",
        json={
            "csr_pem": csr.json()["csr_pem"],
            "ca_private_key_pem": ca_json["private_key_pem"],
            "ca_certificate_pem": ca_json["certificate_pem"],
            "common_name": "alice.example",
            "days": 30,
        },
    )
    assert validation.status_code == 200, validation.text
    assert validation.json()["verified"] is True


def test_kerberos_ticket_validation(client):
    issue = client.post(
        "/api/v1/security/kerberos/issue",
        json={
            "username": "alice",
            "service": "ldap",
            "client_secret": "client-secret-123",
            "service_secret": "service-secret-123",
            "lifetime_seconds": 600,
        },
    )
    assert issue.status_code == 200, issue.text
    payload = issue.json()
    validate = client.post(
        "/api/v1/security/kerberos/validate",
        json={
            "ticket": payload["ticket"],
            "authenticator": payload["authenticator"],
            "service_secret": "service-secret-123",
            "client_secret": "client-secret-123",
        },
    )
    assert validate.status_code == 200, validate.text
    assert validate.json()["valid"] is True


def test_dkim_sign_and_verify(client):
    keys = client.post("/api/v1/security/dkim/keys")
    assert keys.status_code == 200, keys.text
    key_pair = keys.json()
    sign = client.post(
        "/api/v1/security/dkim/sign",
        json={
            "body": "Hello from CipherMesh",
            "private_key_pem": key_pair["private_key_pem"],
            "domain": "ciphermesh.local",
            "selector": "selector1",
        },
    )
    assert sign.status_code == 200, sign.text
    signed = sign.json()
    verify = client.post(
        "/api/v1/security/dkim/verify",
        json={
            "body": "Hello from CipherMesh",
            "dkim_header": signed["dkim_header"],
            "public_key_pem": key_pair["public_key_pem"],
        },
    )
    assert verify.status_code == 200, verify.text
    assert verify.json()["verified"] is True


def test_tls_and_secure_messaging_round_trip(client):
    tls = client.get("/api/v1/security/tls/handshake")
    assert tls.status_code == 200, tls.text
    tls_data = tls.json()
    assert tls_data["version"] == "TLS 1.3"
    assert tls_data["valid_certificate"] is True

    encrypted = client.post(
        "/api/v1/security/secure/encrypt",
        json={"message": "Secret message", "key_hex": "00" * 32},
    )
    assert encrypted.status_code == 200, encrypted.text
    payload = encrypted.json()
    decrypted = client.post(
        "/api/v1/security/secure/decrypt",
        json={"ciphertext": payload["ciphertext"], "nonce": payload["nonce"], "key_hex": "00" * 32},
    )
    assert decrypted.status_code == 200, decrypted.text
    assert decrypted.json()["plaintext"] == "Secret message"


def test_pgp_and_smime_local_workflows(client):
    pgp_keys = client.post("/api/v1/security/pgp/keygen")
    assert pgp_keys.status_code == 200, pgp_keys.text
    pgp = pgp_keys.json()

    signed = client.post("/api/v1/security/pgp/sign", json={"message": "Top secret", "private_key_pem": pgp["private_key_pem"]})
    assert signed.status_code == 200, signed.text
    verified = client.post(
        "/api/v1/security/pgp/verify",
        json={"message": "Top secret", "signature_b64": signed.json()["signature_b64"], "public_key_pem": pgp["public_key_pem"]},
    )
    assert verified.status_code == 200, verified.text
    assert verified.json()["verified"] is True

    encrypted = client.post("/api/v1/security/pgp/encrypt", json={"message": "Top secret", "public_key_pem": pgp["public_key_pem"]})
    assert encrypted.status_code == 200, encrypted.text
    payload = encrypted.json()
    decrypted = client.post(
        "/api/v1/security/pgp/decrypt",
        json={
            "ciphertext_b64": payload["ciphertext_b64"],
            "wrapped_key_b64": payload["wrapped_key_b64"],
            "nonce_b64": payload["nonce_b64"],
            "private_key_pem": pgp["private_key_pem"],
        },
    )
    assert decrypted.status_code == 200, decrypted.text
    assert decrypted.json()["plaintext"] == "Top secret"

    smime_keys = client.post("/api/v1/security/smime/keygen")
    assert smime_keys.status_code == 200, smime_keys.text
    smime = smime_keys.json()
    signed_smime = client.post(
        "/api/v1/security/smime/sign",
        json={"message": "Hello from Alice", "private_key_pem": smime["private_key_pem"]},
    )
    assert signed_smime.status_code == 200, signed_smime.text
    verified_smime = client.post(
        "/api/v1/security/smime/verify",
        json={"message": "Hello from Alice", "signature_b64": signed_smime.json()["signature_b64"], "public_key_pem": smime["public_key_pem"]},
    )
    assert verified_smime.status_code == 200, verified_smime.text
    assert verified_smime.json()["verified"] is True


def test_ipsec_and_audit_workflow(client):
    policy = client.post(
        "/api/v1/security/ipsec/policy-check",
        json={
            "flow": {"src_ip": "10.0.0.5", "dst_ip": "192.168.1.10", "protocol": "UDP"},
            "rules": [{"src_network": "10.0.0.0/8", "dst_network": "192.168.0.0/16", "protocol": "UDP", "action": "Permit ESP"}],
        },
    )
    assert policy.status_code == 200, policy.text
    assert policy.json()["matched"] is True
    assert policy.json()["action"] == "Permit ESP"

    sa = client.post("/api/v1/security/ipsec/sa", json={"peer": "gateway-a", "mode": "tunnel"})
    assert sa.status_code == 200, sa.text
    assert sa.json()["mode"] == "tunnel"

    ike = client.post("/api/v1/security/ipsec/ike", json={"client_id": "client-a", "server_id": "gateway-a"})
    assert ike.status_code == 200, ike.text
    assert "IKE_SA_INIT" in ike.json()["stages"]

    audit = client.post(
        "/api/v1/security/audit/log",
        json={"actor": "alice", "event_type": "ike_negotiation", "details": "local IKE negotiation completed"},
    )
    assert audit.status_code == 200, audit.text
    summary = client.get("/api/v1/security/audit/summary")
    assert summary.status_code == 200, summary.text
    assert summary.json()["event_count"] >= 1
