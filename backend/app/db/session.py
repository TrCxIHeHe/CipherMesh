from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import settings

connect_args = {"check_same_thread": False} if settings.is_sqlite else {}
engine_kwargs = {
    "echo": False,
    "pool_pre_ping": True,
}

if settings.is_sqlite:
    engine_kwargs["connect_args"] = connect_args
else:
    engine_kwargs["poolclass"] = NullPool

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

