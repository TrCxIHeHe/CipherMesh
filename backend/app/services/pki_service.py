from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.x509.oid import NameOID
from sqlalchemy.orm import Session

from app.models.security import CertificateRecord


def generate_root_ca(common_name: str = "CipherMesh Root CA") -> dict[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, common_name),
    ])
    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(private_key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(days=1))
        .not_valid_after(now + timedelta(days=3650))
        .add_extension(x509.BasicConstraints(ca=True, path_length=1), critical=True)
        .add_extension(x509.KeyUsage(
            digital_signature=True,
            content_commitment=False,
            key_encipherment=False,
            data_encipherment=False,
            key_agreement=False,
            key_cert_sign=True,
            crl_sign=True,
            encipher_only=False,
            decipher_only=False,
        ), critical=True)
        .add_extension(x509.SubjectKeyIdentifier.from_public_key(private_key.public_key()), critical=False)
        .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(private_key.public_key()), critical=False)
        .sign(private_key, hashes.SHA256())
    )
    return {
        "private_key_pem": private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode(),
        "certificate_pem": cert.public_bytes(serialization.Encoding.PEM).decode(),
    }


def create_csr(common_name: str, email: str | None = None) -> dict[str, str]:
    private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = [x509.NameAttribute(NameOID.COMMON_NAME, common_name)]
    if email:
        subject.append(x509.NameAttribute(NameOID.EMAIL_ADDRESS, email))
    csr = (
        x509.CertificateSigningRequestBuilder()
        .subject_name(x509.Name(subject))
        .sign(private_key, hashes.SHA256())
    )
    return {
        "private_key_pem": private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode(),
        "csr_pem": csr.public_bytes(serialization.Encoding.PEM).decode(),
    }


def issue_certificate(ca_private_key_pem: str, ca_cert_pem: str, csr_pem: str, common_name: str, days: int = 365) -> dict[str, str]:
    ca_private_key = serialization.load_pem_private_key(ca_private_key_pem.encode(), password=None)
    ca_cert = x509.load_pem_x509_certificate(ca_cert_pem.encode())
    csr = x509.load_pem_x509_csr(csr_pem.encode())
    now = datetime.now(timezone.utc)
    cert = (
        x509.CertificateBuilder()
        .subject_name(csr.subject)
        .issuer_name(ca_cert.subject)
        .public_key(csr.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - timedelta(days=1))
        .not_valid_after(now + timedelta(days=days))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.KeyUsage(
            digital_signature=True,
            content_commitment=False,
            key_encipherment=True,
            data_encipherment=False,
            key_agreement=False,
            key_cert_sign=False,
            crl_sign=False,
            encipher_only=False,
            decipher_only=False,
        ), critical=True)
        .add_extension(x509.SubjectAlternativeName([x509.DNSName(common_name)]), critical=False)
        .add_extension(x509.SubjectKeyIdentifier.from_public_key(csr.public_key()), critical=False)
        .add_extension(x509.AuthorityKeyIdentifier.from_issuer_public_key(ca_cert.public_key()), critical=False)
        .sign(ca_private_key, hashes.SHA256())
    )
    return {"certificate_pem": cert.public_bytes(serialization.Encoding.PEM).decode()}


def parse_certificate(pem: str) -> dict[str, Any]:
    cert = x509.load_pem_x509_certificate(pem.encode())
    return {
        "subject": cert.subject.rfc4514_string(),
        "issuer": cert.issuer.rfc4514_string(),
        "serial_number": hex(cert.serial_number),
        "not_before": cert.not_valid_before_utc.isoformat(),
        "not_after": cert.not_valid_after_utc.isoformat(),
        "public_key_algorithm": cert.public_key().__class__.__name__,
        "signature_algorithm": cert.signature_hash_algorithm.name if cert.signature_hash_algorithm else "unknown",
        "sha256_fingerprint": cert.fingerprint(hashes.SHA256()).hex(),
    }


def verify_certificate_signature(cert_pem: str, issuer_cert_pem: str) -> bool:
    cert = x509.load_pem_x509_certificate(cert_pem.encode())
    issuer_cert = x509.load_pem_x509_certificate(issuer_cert_pem.encode())
    try:
        issuer_cert.public_key().verify(
            cert.signature,
            cert.tbs_certificate_bytes,
            padding.PKCS1v15(),
            cert.signature_hash_algorithm,
        )
        return True
    except Exception:
        return False


def save_certificate_record(db: Session, certificate_pem: str, subject: str, issuer: str, is_ca: bool = False) -> CertificateRecord:
    cert = x509.load_pem_x509_certificate(certificate_pem.encode())
    record = CertificateRecord(
        subject=subject,
        issuer=issuer,
        serial_number=str(cert.serial_number),
        not_before=cert.not_valid_before_utc,
        not_after=cert.not_valid_after_utc,
        pem=certificate_pem,
        is_ca=is_ca,
        status="active",
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record
