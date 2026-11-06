# CipherMesh Project Status

## Summary
CipherMesh now includes runnable routes for the major BCS703 modules as educational security laboratories. The application preserves its frontend/backend split and single-project Vercel configuration while ensuring public-facing routes do not require separate backend deployments.

## Implemented areas
- Classical ciphers and DES workbench.
- Steganography workflow.
- RSA, RNG, DH, and ECC labs.
- Hashing, trust, CA, X.509, and PKI education.
- Argon2id-backed registration/login, session handling, and certificate issuance.
- Local TLS handshake generation, DKIM signing and verification, and secure message/file encryption.
- PGP-style and S/MIME-style local workflows with actual RSA signing and OAEP-protected AES keys.
- IPsec policy matching, security associations, ESP-style packet protection, and IKE negotiation state generation.
- Persistent audit event logging and summary analytics via the SQLAlchemy models.

## Current status by tier
- Core backend cryptography: functional across classical, PKI, trust, TLS, DKIM, secure messaging, and IPsec flows.
- Frontend labs: functional educational interfaces backed by the same local logic where appropriate.
- Vercel / deployment: configured in the root vercel.json using the current services model.
- Production DB: PostgreSQL-ready with SQLite default for local dev.

## Remaining limitations
- Full external Kerberos realms, full GnuPG/OpenPGP interoperability, and production mail infrastructure are not provisioned.
- Where the environment cannot host real third-party services, the implementation remains a local educational workflow and is explicitly labelled as such.
- The repository supports a public single-URL public demo model, not a multi-tenant production PKI or mail service deployment.
