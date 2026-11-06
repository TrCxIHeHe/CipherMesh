import base64
import hashlib
import ipaddress
import json
import secrets
from datetime import datetime, timedelta, timezone

from cryptography import x509
from cryptography.hazmat.primitives import hashes, hmac, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa, x25519
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives.serialization import pkcs7


def generate_dkim_keypair() -> dict[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return {
        "private_key_pem": private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode(),
        "public_key_pem": private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode(),
    }


def generate_rsa_keypair() -> dict[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    return {
        "private_key_pem": private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode(),
        "public_key_pem": private_key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode(),
    }


def generate_pgp_like_keypair() -> dict[str, str]:
    return generate_rsa_keypair()


def sign_pgp_like_message(message: str, private_key_pem: str) -> dict[str, str]:
    private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    signature = private_key.sign(message.encode(), padding.PKCS1v15(), hashes.SHA256())
    return {
        "algorithm": "RSA-SHA256",
        "signature_b64": base64.b64encode(signature).decode(),
        "message": message,
        "format": "OpenPGP-style local workflow",
    }


def verify_pgp_like_signature(message: str, signature_b64: str, public_key_pem: str) -> bool:
    public_key = serialization.load_pem_public_key(public_key_pem.encode())
    try:
        public_key.verify(base64.b64decode(signature_b64), message.encode(), padding.PKCS1v15(), hashes.SHA256())
        return True
    except Exception:
        return False


def encrypt_pgp_like_message(message: str, public_key_pem: str) -> dict[str, str]:
    public_key = serialization.load_pem_public_key(public_key_pem.encode())
    session_key = AESGCM.generate_key(bit_length=256)
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(session_key).encrypt(nonce, message.encode(), None)
    wrapped_key = public_key.encrypt(
        session_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
    )
    return {
        "ciphertext_b64": base64.b64encode(ciphertext).decode(),
        "wrapped_key_b64": base64.b64encode(wrapped_key).decode(),
        "nonce_b64": base64.b64encode(nonce).decode(),
        "format": "OpenPGP-style local workflow",
    }


def decrypt_pgp_like_message(ciphertext_b64: str, wrapped_key_b64: str, nonce_b64: str, private_key_pem: str) -> str:
    private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    wrapped_key = base64.b64decode(wrapped_key_b64)
    nonce = base64.b64decode(nonce_b64)
    session_key = private_key.decrypt(
        wrapped_key,
        padding.OAEP(mgf=padding.MGF1(algorithm=hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
    )
    return AESGCM(session_key).decrypt(nonce, base64.b64decode(ciphertext_b64), None).decode()


def generate_smime_keypair() -> dict[str, str]:
    return generate_rsa_keypair()


def sign_smime_like_message(message: str, private_key_pem: str, certificate_pem: str | None = None) -> dict[str, str]:
    private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    if certificate_pem:
        certificate = x509.load_pem_x509_certificate(certificate_pem.encode())
    else:
        certificate = (
            x509.CertificateBuilder()
            .subject_name(x509.Name([x509.NameAttribute(x509.NameOID.COMMON_NAME, "ciphermesh.local")]))
            .issuer_name(x509.Name([x509.NameAttribute(x509.NameOID.COMMON_NAME, "CipherMesh Local CA")]))
            .public_key(private_key.public_key())
            .serial_number(x509.random_serial_number())
            .not_valid_before(datetime.now(timezone.utc) - timedelta(days=1))
            .not_valid_after(datetime.now(timezone.utc) + timedelta(days=365))
            .sign(private_key, hashes.SHA256())
        )
    signature = private_key.sign(message.encode(), padding.PKCS1v15(), hashes.SHA256())
    cms_der = (
        pkcs7.PKCS7SignatureBuilder()
        .set_data(message.encode())
        .add_signer(certificate, private_key, hashes.SHA256())
        .sign(serialization.Encoding.DER, [pkcs7.PKCS7Options.Binary])
    )
    payload = {
        "algorithm": "RSA-SHA256",
        "signature_b64": base64.b64encode(signature).decode(),
        "cms_der_b64": base64.b64encode(cms_der).decode(),
        "message": message,
        "content_type": "CMS/PKCS#7-style local workflow",
        "certificate_pem": certificate.public_bytes(serialization.Encoding.PEM).decode(),
    }
    return payload


def verify_smime_like_signature(message: str, signature_b64: str, public_key_pem: str) -> bool:
    public_key = serialization.load_pem_public_key(public_key_pem.encode())
    try:
        public_key.verify(base64.b64decode(signature_b64), message.encode(), padding.PKCS1v15(), hashes.SHA256())
        return True
    except Exception:
        return False


def encrypt_smime_like_message(message: str, public_key_pem: str) -> dict[str, str]:
    return encrypt_pgp_like_message(message, public_key_pem)


def decrypt_smime_like_message(ciphertext_b64: str, wrapped_key_b64: str, nonce_b64: str, private_key_pem: str) -> str:
    return decrypt_pgp_like_message(ciphertext_b64, wrapped_key_b64, nonce_b64, private_key_pem)


def sign_dkim_message(message_body: str, private_key_pem: str, domain: str, selector: str) -> dict[str, str]:
    private_key = serialization.load_pem_private_key(private_key_pem.encode(), password=None)
    body_hash = hashlib.sha256(message_body.encode()).digest()
    body_hash_b64 = base64.b64encode(body_hash).decode()
    header = (
        f"v=1; a=rsa-sha256; d={domain}; s={selector}; h=from:subject; "
        f"bh={body_hash_b64};" 
    )
    signature = private_key.sign(header.encode(), padding.PKCS1v15(), hashes.SHA256())
    dk = base64.b64encode(signature).decode()
    return {
        "dkim_header": header + f" b={dk}",
        "body_hash": body_hash_b64,
        "signature": dk,
    }


def verify_dkim_message(message_body: str, dkim_header: str, public_key_pem: str) -> bool:
    public_key = serialization.load_pem_public_key(public_key_pem.encode())
    fields = {}
    for part in dkim_header.split("; "):
        if '=' in part:
            k, v = part.split("=", 1)
            fields[k.strip()] = v.strip()
    if "b" not in fields:
        return False
    body_hash_b64 = base64.b64encode(hashlib.sha256(message_body.encode()).digest()).decode()
    if fields.get("bh") and fields["bh"] != body_hash_b64:
        return False

    signed_data = (
        "v=1; a=rsa-sha256; d={d}; s={s}; h={h}; bh={bh};".format(
            d=fields.get("d", ""),
            s=fields.get("s", ""),
            h=fields.get("h", ""),
            bh=fields.get("bh", ""),
        )
    ).encode()
    signature = base64.b64decode(fields["b"])
    try:
        public_key.verify(signature, signed_data, padding.PKCS1v15(), hashes.SHA256())
        return True
    except Exception:
        return False


def generate_tls_handshake() -> dict[str, str | bool]:
    client_private = x25519.X25519PrivateKey.generate()
    server_private = x25519.X25519PrivateKey.generate()

    client_public = client_private.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    server_public = server_private.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )

    server_public_key_obj = x25519.X25519PublicKey.from_public_bytes(server_public)
    shared_secret = client_private.exchange(server_public_key_obj)
    derived = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"ciphermesh-local-tls-1.3",
    ).derive(shared_secret)
    session_key_hex = derived.hex()

    signing_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    certificate = (
        x509.CertificateBuilder()
        .subject_name(x509.Name([
            x509.NameAttribute(x509.NameOID.COMMON_NAME, "ciphermesh.local"),
        ]))
        .issuer_name(x509.Name([
            x509.NameAttribute(x509.NameOID.COMMON_NAME, "CipherMesh Local CA"),
        ]))
        .public_key(signing_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.now(timezone.utc) - timedelta(days=1))
        .not_valid_after(datetime.now(timezone.utc) + timedelta(days=365))
        .sign(signing_key, hashes.SHA256())
    )
    return {
        "version": "TLS 1.3",
        "cipher_suite": "TLS_AES_128_GCM_SHA256",
        "client_public_key": client_public.hex(),
        "server_public_key": server_public.hex(),
        "session_key": session_key_hex,
        "peer_certificate": certificate.public_bytes(serialization.Encoding.PEM).decode(),
        "valid_certificate": True,
    }


def encrypt_message_with_aes_gcm(message: str, key_hex: str) -> dict[str, str]:
    key = bytes.fromhex(key_hex)
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(key).encrypt(nonce, message.encode(), None)
    return {
        "nonce": nonce.hex(),
        "ciphertext": ciphertext.hex(),
    }


def decrypt_message_with_aes_gcm(ciphertext_hex: str, nonce_hex: str, key_hex: str) -> str:
    key = bytes.fromhex(key_hex)
    nonce = bytes.fromhex(nonce_hex)
    ciphertext = bytes.fromhex(ciphertext_hex)
    return AESGCM(key).decrypt(nonce, ciphertext, None).decode()


def ipsec_policy_match(flow: dict[str, str], rules: list[dict[str, str]]) -> dict[str, object]:
    src_ip = ipaddress.ip_address(flow["src_ip"])
    dst_ip = ipaddress.ip_address(flow["dst_ip"])
    proto = flow.get("protocol", "ANY")
    for rule in rules:
        if proto not in {rule.get("protocol", "ANY"), "ANY"}:
            continue
        if src_ip in ipaddress.ip_network(rule["src_network"]) and dst_ip in ipaddress.ip_network(rule["dst_network"]):
            return {"matched": True, "action": rule["action"], "rule": rule}
    return {"matched": False, "action": "DENY", "rule": None}


def generate_security_association(peer: str, mode: str = "tunnel") -> dict[str, object]:
    key = secrets.token_bytes(32)
    spi = int.from_bytes(hashlib.sha256(peer.encode()).digest()[:4], 'big')
    return {
        "spi": spi,
        "peer": peer,
        "mode": mode,
        "sequence": 1,
        "replay_window": [0, 3],
        "key_hex": key.hex(),
        "encapsulation": "ESP",
    }


def protect_esp_packet(packet: str, association: dict[str, object]) -> dict[str, str]:
    key = bytes.fromhex(str(association["key_hex"]))
    nonce = secrets.token_bytes(12)
    ciphertext = AESGCM(key).encrypt(nonce, packet.encode(), None)
    return {
        "spi": str(association["spi"]),
        "sequence": str(association["sequence"]),
        "nonce_hex": nonce.hex(),
        "ciphertext_hex": ciphertext.hex(),
    }


def generate_ike_negotiation(client_id: str, server_id: str) -> dict[str, object]:
    material = f"{client_id}:{server_id}:{secrets.token_hex(16)}".encode()
    derived_key = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=None,
        info=b"ciphermesh-ikev2",
    ).derive(material)
    return {
        "stages": ["IKE_SA_INIT", "IKE_AUTH", "CREATE_CHILD_SA", "ESTABLISH_SECURE_CHANNEL"],
        "client_id": client_id,
        "server_id": server_id,
        "derived_key_hex": derived_key.hex(),
        "status": "ready",
    }


def record_audit_event(db, actor: str, event_type: str, details: str) -> dict[str, object]:
    from app.models.security import AuditEvent

    event = AuditEvent(actor=actor, event_type=event_type, details=details)
    db.add(event)
    db.commit()
    db.refresh(event)
    return {
        "id": event.id,
        "actor": event.actor,
        "event_type": event.event_type,
        "details": event.details,
        "created_at": event.created_at.isoformat(),
    }


def summarize_audit_events(db) -> dict[str, object]:
    from app.models.security import AuditEvent

    rows = db.query(AuditEvent).all()
    counts = {}
    for item in rows:
        counts[item.event_type] = counts.get(item.event_type, 0) + 1
    return {
        "event_count": len(rows),
        "by_type": counts,
        "latest": rows[-1].created_at.isoformat() if rows else None,
    }


def build_security_summary() -> dict[str, object]:
    return {
        "status": "ready",
        "tls_handshake_mode": "local educational handshake",
        "dkim_verified": False,
        "message_encryption": "AES-256-GCM",
    }
