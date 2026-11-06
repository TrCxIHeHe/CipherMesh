import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher, exceptions
from sqlalchemy.orm import Session

from app.models.security import User, UserSession

ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, hash_len=32, salt_len=16)


def register_user(db: Session, username: str, password: str) -> User:
    if not username or len(username.strip()) < 3:
        raise ValueError("Username must be at least 3 characters long.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    existing = db.query(User).filter(User.username == username.strip()).first()
    if existing:
        raise ValueError("Username already exists.")

    user = User(username=username.strip(), password_hash=ph.hash(password), role="user")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def login_user(db: Session, username: str, password: str) -> dict:
    user = db.query(User).filter(User.username == username.strip()).first()
    if user is None:
        raise ValueError("Invalid credentials.")
    try:
        ph.verify(user.password_hash, password)
    except exceptions.VerifyMismatchError:
        raise ValueError("Invalid credentials.")

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=12)
    session = UserSession(token=token, user_id=user.id, expires_at=expires_at, revoked=False)
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "user_id": user.id,
        "username": user.username,
        "token": token,
        "expires_at": expires_at.isoformat(),
    }


def get_user_from_token(db: Session, token: str) -> User:
    session = (
        db.query(UserSession)
        .filter(UserSession.token == token, UserSession.revoked.is_(False))
        .first()
    )
    if session is None:
        raise ValueError("Invalid or expired session token.")
    expires_at = session.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    else:
        expires_at = expires_at.astimezone(timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise ValueError("Session has expired.")
    return session.user
