from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CipherMesh API"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    API_V1_STR: str = "/api/v1"

    # CORS Origins allowed to access API
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            value = v.strip()
            if not value:
                return []
            if value.startswith("["):
                return [item.strip() for item in value.strip("[]").split(",") if item.strip()]
            return [item.strip() for item in value.split(",") if item.strip()]
        if isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]
        return []

    # Default to SQLite for local development. Production deployments should set
    # DATABASE_URL to a PostgreSQL connection string supplied via Vercel env vars.
    DATABASE_URL: str = "sqlite:///./ciphermesh.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    @property
    def is_sqlite(self) -> bool:
        return self.DATABASE_URL.startswith("sqlite")

    @property
    def is_postgres(self) -> bool:
        return self.DATABASE_URL.startswith((
            "postgres://",
            "postgresql://",
            "postgresql+psycopg://",
            "postgresql+psycopg2://",
        ))


settings = Settings()

