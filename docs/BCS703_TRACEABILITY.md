# BCS703 Traceability Matrix

This document maps the BCS703 syllabus topics to the implementation currently delivered in the repository.

## Implementation classification legend

- REAL IMPLEMENTATION: the code path uses actual cryptographic libraries and backend validation.
- EDUCATIONAL SIMULATION: the feature models the protocol and uses valid local logic, but does not depend on a production external infrastructure.
- NOT IMPLEMENTED: still absent from the repository.

## Module 1 — Classical Encryption

| Topic | Frontend route | Backend implementation | Status |
| --- | --- | --- | --- |
| Symmetric cipher model | /lab/classical | app/api/routes/classical.py | REAL IMPLEMENTATION |
| Caesar cipher | /lab/classical | app/crypto/educational/classical/caesar.py | REAL IMPLEMENTATION |
| Monoalphabetic substitution | /lab/classical | app/crypto/educational/classical/monoalphabetic.py | REAL IMPLEMENTATION |
| Playfair cipher | /lab/classical | app/crypto/educational/classical/playfair.py | REAL IMPLEMENTATION |
| Hill cipher | /lab/classical | app/crypto/educational/classical/hill.py | REAL IMPLEMENTATION |
| Vigenère cipher | /lab/classical | app/crypto/educational/classical/vigenere.py | REAL IMPLEMENTATION |
| One-Time Pad | /lab/classical | app/crypto/educational/classical/one_time_pad.py | REAL IMPLEMENTATION |
| Steganography | /lab/classical | app/api/routes/steganography.py + app/crypto/educational/steganography/lsb.py | REAL IMPLEMENTATION |
| DES encryption/decryption | /lab/des | app/api/routes/des.py + app/crypto/educational/des/core.py | REAL IMPLEMENTATION |
| DES strength and limitations | /lab/des | app/crypto/educational/des/* | REAL IMPLEMENTATION |
| Block cipher design principles | /lab/des | app/crypto/educational/des/* | REAL IMPLEMENTATION |

## Module 2 — Public Key Cryptography

| Topic | Frontend route | Backend implementation | Status |
| --- | --- | --- | --- |
| Linear Congruential Generator | /lab/rng | frontend page simulation | EDUCATIONAL SIMULATION |
| Blum Blum Shub generator | /lab/rng | frontend page simulation | EDUCATIONAL SIMULATION |
| Public-key principles | /lab/rsa | frontend page simulation | EDUCATIONAL SIMULATION |
| RSA key generation / encryption / decryption | /lab/rsa | app/services/security_service.py + frontend demo | REAL IMPLEMENTATION (toy RSA math) |
| RSA-OAEP transport | /api/v1/security/secure/* | app/services/security_service.py | REAL IMPLEMENTATION |
| Diffie-Hellman | /lab/dh | frontend page simulation + local arithmetic | REAL IMPLEMENTATION |
| MITM demo | /lab/dh | frontend page simulation | EDUCATIONAL SIMULATION |
| ECC arithmetic | /lab/ecc | frontend page simulation + point operations | REAL IMPLEMENTATION |
| ECDH | /lab/ecc | frontend page simulation | EDUCATIONAL SIMULATION |

## Module 3 — Hashing, Trust, Key Distribution

| Topic | Frontend route | Backend implementation | Status |
| --- | --- | --- | --- |
| Hashing lab | /trust/hashing | frontend page simulation + WebCrypto | REAL IMPLEMENTATION |
| File hashing | /trust/hashing | frontend page simulation | REAL IMPLEMENTATION |
| Symmetric key distribution | /trust/keys | app/services/security_service.py | REAL IMPLEMENTATION |
| Asymmetric key wrapping | /trust/keys | app/services/security_service.py | REAL IMPLEMENTATION |
| CA generation and issuance | /trust/ca | app/services/pki_service.py + app/api/routes/security.py | REAL IMPLEMENTATION |
| X.509 certificate inspection | /trust/x509 | app/services/pki_service.py | REAL IMPLEMENTATION |
| PKI hierarchy and trust | /trust/pki | app/services/pki_service.py | REAL IMPLEMENTATION |

## Module 4 — Authentication and Communication Security

| Topic | Frontend route | Backend implementation | Status |
| --- | --- | --- | --- |
| Remote authentication model | /identity/auth | app/services/auth_service.py + app/api/routes/security.py | REAL IMPLEMENTATION |
| Kerberos educational workflow | /identity/kerberos | app/services/kerberos_service.py + app/api/routes/security.py | EDUCATIONAL SIMULATION |
| Asymmetric challenge-response | /identity/asymmetric | frontend page simulation + ECDSA signing logic | REAL IMPLEMENTATION |
| TLS handshake | /transport/tls | app/services/security_service.py + app/api/routes/security.py | EDUCATIONAL SIMULATION |
| Web security headers | /transport/web | frontend page simulation | REAL IMPLEMENTATION (educational review) |
| OpenPGP-style local signing | /email/pgp | app/services/security_service.py + /api/v1/security/pgp/* | REAL IMPLEMENTATION (local workflow, not GnuPG interoperability) |
| S/MIME-style local signing | /email/smime | app/services/security_service.py + /api/v1/security/smime/* | REAL IMPLEMENTATION (local CMS-style workflow) |
| DKIM | /email/dkim | app/services/security_service.py + app/api/routes/security.py | REAL IMPLEMENTATION |

## Module 5 — Email and IP Security

| Topic | Frontend route | Backend implementation | Status |
| --- | --- | --- | --- |
| IPsec policy matching | /network/policy | app/services/security_service.py + /api/v1/security/ipsec/policy-check | REAL IMPLEMENTATION |
| Security associations | /network/sa | app/services/security_service.py + /api/v1/security/ipsec/sa | REAL IMPLEMENTATION |
| ESP packet protection | /network/esp | app/services/security_service.py + /api/v1/security/ipsec/sa | REAL IMPLEMENTATION |
| IKE educational negotiation | /network/ike | app/services/security_service.py + /api/v1/security/ipsec/ike | EDUCATIONAL SIMULATION |

## Cross-module integration

| Topic | Frontend route | Backend implementation | Status |
| --- | --- | --- | --- |
| Secure Messaging | /secure/messaging | app/services/security_service.py + /api/v1/security/secure/* | REAL IMPLEMENTATION |
| Authenticated File Encryption | /secure/files | app/services/security_service.py + /api/v1/security/secure/file/* | REAL IMPLEMENTATION |
| Audit / integrity reporting | /analytics/* | app/models/security.py + app/services/security_service.py + /api/v1/security/audit/* | REAL IMPLEMENTATION |
| Communication history | /secure/history | frontend route with local state | EDUCATIONAL SIMULATION |

## Deployment and persistence notes

- The repository retains the Vercel single-project architecture and supports SQLite local development with PostgreSQL-ready configuration.
- SQLAlchemy models and initial Alembic migration support the persisted security records used by authentication, certificates, and audit logging.
- Where external infrastructure is unavailable or not packageable in a public single-URL deployment, the implementation is explicitly labelled as a local educational workflow rather than a production external service.
