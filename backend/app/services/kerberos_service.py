import base64
import json
import secrets
from datetime import datetime, timedelta, timezone
from hashlib import sha256

from cryptography.hazmat.primitives.ciphers.aead import AESGCM


def _derive_key(secret: str) -> bytes:
    return sha256(secret.encode()).digest()


def generate_kerberos_ticket(username: str, service: str, client_secret: str, service_secret: str, lifetime_seconds: int = 300) -> dict[str, str]:
    client_key = _derive_key(client_secret)
    service_key = _derive_key(service_secret)
    now = datetime.now(timezone.utc)
    expiry = now + timedelta(seconds=lifetime_seconds)
    ticket_payload = {
        "username": username,
        "service": service,
        "issued_at": now.isoformat(),
        "expires_at": expiry.isoformat(),
    }
    ticket_nonce = secrets.token_bytes(12)
    ticket_ciphertext = AESGCM(service_key).encrypt(ticket_nonce, json.dumps(ticket_payload).encode(), None)
    authenticator_payload = {
        "username": username,
        "issued_at": now.isoformat(),
        "nonce": secrets.token_hex(8),
    }
    authenticator_nonce = secrets.token_bytes(12)
    authenticator_ciphertext = AESGCM(client_key).encrypt(authenticator_nonce, json.dumps(authenticator_payload).encode(), None)

    return {
        "ticket": base64.b64encode(ticket_nonce + ticket_ciphertext).decode(),
        "authenticator": base64.b64encode(authenticator_nonce + authenticator_ciphertext).decode(),
        "expires_at": expiry.isoformat(),
    }


def validate_kerberos_ticket(ticket_b64: str, authenticator_b64: str, service_secret: str, client_secret: str) -> dict[str, object]:
    service_key = _derive_key(service_secret)
    client_key = _derive_key(client_secret)
    ticket_bytes = base64.b64decode(ticket_b64)
    authenticator_bytes = base64.b64decode(authenticator_b64)
    nonce_len = 12
    ticket_nonce = ticket_bytes[:nonce_len]
    ticket_ciphertext = ticket_bytes[nonce_len:]
    authenticator_nonce = authenticator_bytes[:nonce_len]
    authenticator_ciphertext = authenticator_bytes[nonce_len:]

    payload = json.loads(AESGCM(service_key).decrypt(ticket_nonce, ticket_ciphertext, None).decode())
    auth_payload = json.loads(AESGCM(client_key).decrypt(authenticator_nonce, authenticator_ciphertext, None).decode())

    if payload["username"] != auth_payload["username"]:
        raise ValueError("Ticket and authenticator mismatch.")
    expires = datetime.fromisoformat(payload["expires_at"])
    if expires < datetime.now(timezone.utc):
        raise ValueError("Ticket expired.")

    return {
        "valid": True,
        "username": payload["username"],
        "service": payload["service"],
        "expires_at": payload["expires_at"],
    }
