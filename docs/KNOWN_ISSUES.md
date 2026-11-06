# Known Issues and Limitations

1. External services are not provisioned for a full Kerberos realm, production mail transport, or live PKI federation. The repository keeps those as local educational workflows when real infrastructure is not available.
2. Browser-side crypto demonstrations are deterministic and tuned for learning; they are not meant as a replacement for production cryptographic key management or external services.
3. The implemented OpenPGP and S/MIME flows are local RSA-based workflows that deliberately avoid false claims of full GnuPG or native mail-server interoperability.
4. The backend stores audit and security state in SQLite by default and is PostgreSQL-ready for production deployment, but live multi-tenant operations still require a hosted environment.
5. Older browsers may lack some Web Crypto primitives or session features; the public-facing app is intended for modern browsers.
