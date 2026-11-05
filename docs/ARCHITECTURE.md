# CipherMesh Architecture

Modular monolith: a React SPA plus a FastAPI backend with SQLite. No microservices, queues or cloud services.

## Proposed folder structure

```
ciphermesh/
  frontend/                 React + TS + Vite + Tailwind v4
    src/
      components/           Shell (sidebar, top bar, search), ui.tsx, viz.tsx
      data/nav.ts           Single source of truth for routes, icons, phase, scope, implemented flag
      pages/                Dashboard, PlannedPage (honest scaffold), later one folder per lab
      lib/                  (Phase 2+) pure-TS algorithm visualisation helpers, API client
  backend/                  (Phase 2+)
    app/
      api/                  FastAPI routers per domain (classical, pki, messaging, dkim, ipsec...)
      crypto/               Thin wrappers over vetted libraries; educational algorithms isolated in crypto/educational/
      models/ schemas/      SQLAlchemy models, Pydantic schemas
      services/             CA, messaging envelope, audit logging
    alembic/  tests/
  docs/                     This file, PROGRESS.md, later SECURITY, THREAT_MODEL, SYLLABUS_MAPPING...
```

## Key decisions
- **nav.ts drives everything.** Sidebar, routes, search, breadcrumbs and dashboard module progress all read it, so progress figures cannot drift from reality. A page counts as built only when `implemented: true`.
- **Honest scaffolding.** Unbuilt pages render `PlannedPage`, which states the phase and planned scope. No fake controls.
- **Educational vs real crypto** are kept in separate backend packages. Educational code (Caesar, LCG, BBS, toy RSA, DES trace) is never imported by the messaging path.
- **Private keys** stay client-side where practical (Web Crypto); the demo CA key lives only in a backend data directory excluded from Git.
- **Charts** are custom SVG for now (no Plotly dependency) to stay lightweight.

## Design system (implemented in `src/index.css`)
Tokens: bg `#080d18`, bg-2 `#0d1422`, card `#111c2d`, elevated `#162338`, accent `#38bdf8`, accent-2 `#22d3ee`, teal `#2dd4bf`, ink `#eaf2ff`, muted `#94a3b8`, line `rgba(148,163,184,.15)`, plus ok/warn/danger. Inter for UI, JetBrains Mono for technical output. `.panel` is the single glass-card surface; `.flow` animates data lines; `.grid-bg` is the technical grid texture. Motion is limited to dashed flow lines and a status pulse.

## Environment constraints
Node 22, npm 10, Python 3.13 present. Not yet verified: GnuPG, OpenSSL CLI, Docker, Argon2 wheels, Windows path behaviour (target machine). PGP and S/MIME will degrade gracefully if GnuPG/OpenSSL are missing.
