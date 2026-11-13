# CipherMesh

> **Cryptography and Network Security Engineering Workbench**  

CipherMesh is an interactive, engineering-grade workbench designed for exploring classical and modern cryptography, trust infrastructure, authentication protocols, and network/transport security.

https://ciphermesh-chi.vercel.app/

- **Key Principles**
  - Substitution & Transposition techniques: Caesar, Monoalphabetic, Playfair, Hill, Polyalphabetic, One-Time Pad (OTP).
  - Steganography (LSB image embedding and detection).
  - Traditional Block Cipher Structure, DES (16-round Feistel network trace, S-boxes, key schedule, avalanche analysis) and Block Cipher Design Principles.
  - Principles of public-key cryptosystems, RSA algorithm walkthrough (toy mathematical step-by-step vs. real RSA-OAEP).
  - Pseudorandom Number Generation: Linear Congruential Generators (LCG) and Blum Blum Shub (BBS) with cycle/weakness analysis.
  - Key Exchange & Curves: Diffie-Hellman Key Exchange (with MITM simulation), Elliptic Curve arithmetic and ECDH.
  - Cryptographic Hash Functions: SHA-256, SHA-512, bit-level avalanche differential analyzer, and file integrity verification.
  - Symmetric and asymmetric key distribution protocol flows.
  - Demonstration Certificate Authority (CA): X.509 certificate issuance, validation, and CRL revocation.
  - Hierarchical Public-Key Infrastructure (PKI) interactive tree.
  - Remote User Authentication: Argon2id password hashing and asymmetric challenge-response signatures.
  - Kerberos Protocol Simulator (Authentication Server, Ticket Granting Server, Service Ticket exchange).
  - Transport-Level Security: TLS 1.3 handshake packet inspector and Web Security hardening header analysis.
  - Email Security: OpenPGP and S/MIME signing and encryption workbenches, plus Email Threat analysis (spoofing, replay, MITM).
  - DomainKeys Identified Mail (DKIM): Canonicalization, body hash, DKIM-Signature generation, and simulated DNS TXT verification.
  - IP Security (IPsec): Security Policy Database (SPD) selector matching, Security Association Database (SAD) with sequence replay protection, ESP packet layout dissection, and Internet Key Exchange (IKEv2) state machine.
- **Cross-Module Integration: Secure Operations**
  - End-to-end hybrid-encrypted secure messaging (AES-256-GCM data key, RSA-OAEP wrapping, ECDSA envelope signature) with tamper attack scenarios.
  - Authenticated file encryption with scrypt/Argon2 KDF.

---

## 🏗️ Repository Architecture

- **`frontend/`**: Single Page Application built with React 19, TypeScript, Vite, and Tailwind CSS v4.
  - Dynamic routing driven by single-source-of-truth registry (`src/data/nav.ts`).
  - Dark cybersecurity engineering aesthetic with custom SVG diagrams, animated packet paths, and glassmorphism panels.
- **`backend/`**: Modular FastAPI application with SQLite database foundation.
  - Layered structure: `app/core/`, `app/api/`, `app/crypto/`, `app/models/`, `app/schemas/`, `app/services/`, `app/db/`.
  - Python management powered by `uv` (bypassing Windows Python execution stub issues).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v22+ and `npm` v10+
- **uv**: Fast Python package and virtual environment manager (`uv` 0.11+)
- **Python**: 3.11+ (CPython 3.14 recommended and automatically resolved via `uv`)

---

### Backend Startup

1. Open a terminal and navigate to `backend/`:
   ```powershell
   cd backend
   ```

2. If first time running, synchronize the virtual environment:
   ```powershell
   uv pip install -e ".[dev]"
   ```

3. Launch the FastAPI development server:
   ```powershell
   uv run --no-sync uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

4. Verify the backend service:
   - Root Status: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - Health Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
   - Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### Frontend Startup

1. Open a second terminal and navigate to `frontend/`:
   ```powershell
   cd frontend
   ```

2. If first time running, install npm dependencies:
   ```powershell
   npm ci
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser at [http://localhost:5173](http://localhost:5173).

---

## ☁️ Vercel Services Deployment

CipherMesh is configured for a single-project Vercel deployment using the current `services` model.

- Frontend service: `frontend/` with the Vite framework.
- Backend service: `backend/` with the FastAPI framework and `app.main:app`.
- Public routing: `/api/*` is routed to the backend service and every other path routes to the frontend app.

The root `vercel.json` file is defined at the repository root and keeps the same public domain for both the frontend and backend.

### Production database setup

- Local development continues to use SQLite by default.
- Production must supply `DATABASE_URL` as a PostgreSQL connection string (for example, a Neon PostgreSQL database in Vercel).
- Vercel environment variables should be set for both the backend service and any build/runtime environment where the app is executed.

Example:

```bash
DATABASE_URL=postgresql+psycopg://user:password@host:5432/ciphermesh
ENVIRONMENT=production
CORS_ORIGINS=https://your-project.vercel.app
```

### Initial Alembic migration

Apply the initial schema migration against the configured database:

```bash
cd backend
python -m alembic upgrade head
```

If you are using a PostgreSQL database in production, set `DATABASE_URL` before running the migration. Local SQLite development can continue without a hosted database.

---

## 🧪 Testing & Verification

### Backend Tests
Execute the pytest suite using `uv`:
```powershell
cd backend
uv run --no-sync pytest -v
```

### Frontend Build & Lint Checks
```powershell
cd frontend
npm run build
npx oxlint
```

