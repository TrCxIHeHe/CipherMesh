from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.security import AuditEvent, User
from app.schemas.security import (
    AuthResponse,
    CertificateResponse,
    DkimSignRequest,
    DkimVerifyRequest,
    KerberosIssueRequest,
    KerberosValidateRequest,
    PkiCertificateRequest,
    PkiIssueRequest,
    RegisterRequest,
    SecureMessageDecryptRequest,
    SecureMessageDecryptResponse,
    SecureMessageRequest,
    SecureMessageResponse,
    TlsHandshakeResponse,
    UserInfoResponse,
)
from app.services.auth_service import get_user_from_token, login_user, register_user
from app.services.kerberos_service import generate_kerberos_ticket, validate_kerberos_ticket
from app.services.pki_service import (
    create_csr,
    generate_root_ca,
    issue_certificate,
    parse_certificate,
    save_certificate_record,
    verify_certificate_signature,
)
from app.services.security_service import (
    decrypt_message_with_aes_gcm,
    decrypt_pgp_like_message,
    decrypt_smime_like_message,
    encrypt_message_with_aes_gcm,
    encrypt_pgp_like_message,
    encrypt_smime_like_message,
    generate_dkim_keypair,
    generate_pgp_like_keypair,
    generate_rsa_keypair,
    generate_security_association,
    generate_tls_handshake,
    ipsec_policy_match,
    record_audit_event,
    sign_dkim_message,
    sign_pgp_like_message,
    sign_smime_like_message,
    verify_dkim_message,
    verify_pgp_like_signature,
    verify_smime_like_signature,
)

router = APIRouter(prefix="/security", tags=["Security"])


def _token_from_auth(auth_header: str | None) -> str:
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token.")
    token = auth_header.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Empty bearer token.")
    return token


@router.post("/auth/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user_endpoint(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(db, req.username, req.password)
        token = login_user(db, user.username, req.password)
        return AuthResponse(user_id=user.id, username=user.username, token=token["token"], expires_at=token["expires_at"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/auth/login", response_model=AuthResponse)
def login_user_endpoint(req: RegisterRequest, db: Session = Depends(get_db)):
    try:
        result = login_user(db, req.username, req.password)
        return AuthResponse(user_id=result["user_id"], username=result["username"], token=result["token"], expires_at=result["expires_at"])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.get("/auth/me", response_model=UserInfoResponse)
def me_endpoint(authorization: str | None = Header(default=None, alias="Authorization"), db: Session = Depends(get_db)):
    token = _token_from_auth(authorization)
    try:
        user = get_user_from_token(db, token)
        return UserInfoResponse(user_id=user.id, username=user.username, role=user.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))


@router.get("/pki/root-ca")
def root_ca_endpoint(db: Session = Depends(get_db)):
    ca = generate_root_ca()
    save_certificate_record(db, ca["certificate_pem"], "CN=CipherMesh Root CA", "CN=CipherMesh Root CA", is_ca=True)
    return ca


@router.post("/pki/csr")
def csr_endpoint(req: PkiCertificateRequest):
    key_material = create_csr(req.common_name, req.email)
    return key_material


@router.post("/pki/issue", response_model=CertificateResponse)
def issue_cert_endpoint(req: PkiIssueRequest, db: Session = Depends(get_db)):
    try:
        issued = issue_certificate(req.ca_private_key_pem, req.ca_certificate_pem, req.csr_pem, req.common_name, req.days)
        cert_data = parse_certificate(issued["certificate_pem"])
        save_certificate_record(db, issued["certificate_pem"], cert_data["subject"], cert_data["issuer"], is_ca=False)
        return CertificateResponse(**cert_data)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Certificate issuance failed: {exc}")


@router.post("/pki/validate")
def validate_certificate_endpoint(req: PkiIssueRequest):
    try:
        issued = issue_certificate(req.ca_private_key_pem, req.ca_certificate_pem, req.csr_pem, req.common_name, req.days)
        trusted = verify_certificate_signature(issued["certificate_pem"], req.ca_certificate_pem)
        return {"verified": trusted, "certificate": issued["certificate_pem"]}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Certificate validation failed: {exc}")


@router.post("/kerberos/issue")
def kerberos_issue_endpoint(req: KerberosIssueRequest):
    try:
        return generate_kerberos_ticket(
            username=req.username,
            service=req.service,
            client_secret=req.client_secret,
            service_secret=req.service_secret,
            lifetime_seconds=req.lifetime_seconds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/kerberos/validate")
def kerberos_validate_endpoint(req: KerberosValidateRequest):
    try:
        return validate_kerberos_ticket(req.ticket, req.authenticator, req.service_secret, req.client_secret)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/pgp/keygen")
def pgp_keygen_endpoint():
    return generate_pgp_like_keypair()


@router.post("/pgp/sign")
def pgp_sign_endpoint(req: dict):
    try:
        message = req.get("message", "")
        key = req.get("private_key_pem")
        if not message or not key:
            raise ValueError("message and private_key_pem are required")
        return sign_pgp_like_message(message, key)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/pgp/verify")
def pgp_verify_endpoint(req: dict):
    try:
        verified = verify_pgp_like_signature(req.get("message", ""), req.get("signature_b64", ""), req.get("public_key_pem", ""))
        return {"verified": verified}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/pgp/encrypt")
def pgp_encrypt_endpoint(req: dict):
    try:
        return encrypt_pgp_like_message(req.get("message", ""), req.get("public_key_pem", ""))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/pgp/decrypt")
def pgp_decrypt_endpoint(req: dict):
    try:
        return {"plaintext": decrypt_pgp_like_message(req.get("ciphertext_b64", ""), req.get("wrapped_key_b64", ""), req.get("nonce_b64", ""), req.get("private_key_pem", ""))}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/smime/keygen")
def smime_keygen_endpoint():
    return generate_rsa_keypair()


@router.post("/smime/sign")
def smime_sign_endpoint(req: dict):
    try:
        return sign_smime_like_message(req.get("message", ""), req.get("private_key_pem", ""), req.get("certificate_pem"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/smime/verify")
def smime_verify_endpoint(req: dict):
    try:
        return {"verified": verify_smime_like_signature(req.get("message", ""), req.get("signature_b64", ""), req.get("public_key_pem", ""))}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/smime/encrypt")
def smime_encrypt_endpoint(req: dict):
    try:
        return encrypt_smime_like_message(req.get("message", ""), req.get("public_key_pem", ""))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/smime/decrypt")
def smime_decrypt_endpoint(req: dict):
    try:
        return {"plaintext": decrypt_smime_like_message(req.get("ciphertext_b64", ""), req.get("wrapped_key_b64", ""), req.get("nonce_b64", ""), req.get("private_key_pem", ""))}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/dkim/keys")
def dkim_keys_endpoint():
    return generate_dkim_keypair()


@router.post("/dkim/sign")
def dkim_sign_endpoint(req: DkimSignRequest):
    try:
        return sign_dkim_message(req.body, req.private_key_pem, req.domain, req.selector)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/dkim/verify")
def dkim_verify_endpoint(req: DkimVerifyRequest):
    try:
        verified = verify_dkim_message(req.body, req.dkim_header, req.public_key_pem)
        return {"verified": verified}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/tls/handshake", response_model=TlsHandshakeResponse)
def tls_handshake_endpoint():
    result = generate_tls_handshake()
    return TlsHandshakeResponse(
        version=str(result["version"]),
        cipher_suite=str(result["cipher_suite"]),
        session_key=str(result["session_key"]),
        valid_certificate=bool(result["valid_certificate"]),
        peer_certificate=str(result["peer_certificate"]),
    )


@router.post("/secure/encrypt", response_model=SecureMessageResponse)
def secure_encrypt_endpoint(req: SecureMessageRequest):
    result = encrypt_message_with_aes_gcm(req.message, req.key_hex)
    return SecureMessageResponse(**result)


@router.post("/secure/decrypt", response_model=SecureMessageDecryptResponse)
def secure_decrypt_endpoint(req: SecureMessageDecryptRequest):
    plaintext = decrypt_message_with_aes_gcm(req.ciphertext, req.nonce, req.key_hex)
    return SecureMessageDecryptResponse(plaintext=plaintext)


@router.post("/secure/file/encrypt")
def secure_file_encrypt_endpoint(req: dict):
    try:
        key_hex = req.get("key_hex")
        data = req.get("contents", "")
        if not key_hex or not isinstance(data, str):
            raise ValueError("key_hex and file contents are required")
        result = encrypt_message_with_aes_gcm(data, key_hex)
        return {"encrypted": True, **result}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/secure/file/decrypt")
def secure_file_decrypt_endpoint(req: dict):
    try:
        plaintext = decrypt_message_with_aes_gcm(req.get("ciphertext", ""), req.get("nonce", ""), req.get("key_hex", ""))
        return {"plaintext": plaintext}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/ipsec/policy-check")
def ipsec_policy_check_endpoint(req: dict):
    try:
        rules = req.get("rules", [])
        flow = req.get("flow", {})
        return ipsec_policy_match(flow, rules)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/ipsec/sa")
def ipsec_sa_endpoint(req: dict):
    try:
        return generate_security_association(req.get("peer", "gateway"), req.get("mode", "tunnel"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/ipsec/ike")
def ipsec_ike_endpoint(req: dict):
    try:
        from app.services.security_service import generate_ike_negotiation

        return generate_ike_negotiation(req.get("client_id", "client"), req.get("server_id", "server"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("/audit/log")
def audit_log_endpoint(req: dict, db: Session = Depends(get_db)):
    try:
        event = record_audit_event(db, req.get("actor", "system"), req.get("event_type", "audit"), req.get("details", ""))
        return event
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/audit/summary")
def audit_summary_endpoint(db: Session = Depends(get_db)):
    from app.services.security_service import summarize_audit_events

    return summarize_audit_events(db)
