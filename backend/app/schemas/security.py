from typing import Optional

from pydantic import BaseModel, Field


class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=120)
    password: str = Field(..., min_length=8, max_length=255)


class AuthResponse(BaseModel):
    user_id: int
    username: str
    token: str
    expires_at: str


class UserInfoResponse(BaseModel):
    user_id: int
    username: str
    role: str


class PkiCertificateRequest(BaseModel):
    common_name: str = Field(..., min_length=1, max_length=200)
    email: Optional[str] = Field(None, max_length=200)
    days: int = Field(default=365, ge=1, le=1825)


class PkiIssueRequest(BaseModel):
    csr_pem: str
    ca_private_key_pem: str
    ca_certificate_pem: str
    common_name: str = Field(..., min_length=1, max_length=200)
    days: int = Field(default=365, ge=1, le=1825)


class CertificateResponse(BaseModel):
    subject: str
    issuer: str
    serial_number: str
    not_before: str
    not_after: str
    public_key_algorithm: str
    signature_algorithm: str
    sha256_fingerprint: str


class KerberosIssueRequest(BaseModel):
    username: str
    service: str
    client_secret: str = Field(..., min_length=8)
    service_secret: str = Field(..., min_length=8)
    lifetime_seconds: int = Field(default=300, ge=1, le=86400)


class KerberosValidateRequest(BaseModel):
    ticket: str
    authenticator: str
    service_secret: str = Field(..., min_length=8)
    client_secret: str = Field(..., min_length=8)


class DkimSignRequest(BaseModel):
    body: str
    private_key_pem: str
    domain: str = Field(..., min_length=1, max_length=255)
    selector: str = Field(..., min_length=1, max_length=64)


class DkimVerifyRequest(BaseModel):
    body: str
    dkim_header: str
    public_key_pem: str


class TlsHandshakeResponse(BaseModel):
    version: str
    cipher_suite: str
    session_key: str
    valid_certificate: bool
    peer_certificate: str


class SecureMessageRequest(BaseModel):
    message: str
    key_hex: str = Field(..., min_length=32, max_length=256)


class SecureMessageResponse(BaseModel):
    nonce: str
    ciphertext: str


class SecureMessageDecryptRequest(BaseModel):
    ciphertext: str
    nonce: str
    key_hex: str = Field(..., min_length=32, max_length=256)


class SecureMessageDecryptResponse(BaseModel):
    plaintext: str
