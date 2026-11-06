"""Initial schema baseline with security tables.

Revision ID: 20261106_initial
Revises:
Create Date: 2026-11-06 19:00:00.000000
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func

# revision identifiers, used by Alembic.
revision = "20261106_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", Integer(), primary_key=True, nullable=False),
        sa.Column("username", String(length=120), nullable=False),
        sa.Column("password_hash", String(length=255), nullable=False),
        sa.Column("role", String(length=40), nullable=False, server_default="user"),
        sa.Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "user_sessions",
        sa.Column("id", Integer(), primary_key=True, nullable=False),
        sa.Column("token", String(length=255), nullable=False),
        sa.Column("user_id", Integer(), ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
        sa.Column("expires_at", DateTime(timezone=True), nullable=False),
        sa.Column("revoked", Boolean(), nullable=False, server_default="0"),
    )
    op.create_index(op.f("ix_user_sessions_id"), "user_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_user_sessions_token"), "user_sessions", ["token"], unique=True)

    op.create_table(
        "certificate_records",
        sa.Column("id", Integer(), primary_key=True, nullable=False),
        sa.Column("subject", String(length=255), nullable=False),
        sa.Column("issuer", String(length=255), nullable=False),
        sa.Column("serial_number", String(length=120), nullable=False),
        sa.Column("not_before", DateTime(timezone=True), nullable=False),
        sa.Column("not_after", DateTime(timezone=True), nullable=False),
        sa.Column("pem", Text(), nullable=False),
        sa.Column("is_ca", Boolean(), nullable=False, server_default="0"),
        sa.Column("status", String(length=40), nullable=False, server_default="active"),
        sa.Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    op.create_index(op.f("ix_certificate_records_id"), "certificate_records", ["id"], unique=False)

    op.create_table(
        "audit_events",
        sa.Column("id", Integer(), primary_key=True, nullable=False),
        sa.Column("actor", String(length=120), nullable=False),
        sa.Column("event_type", String(length=120), nullable=False),
        sa.Column("details", Text(), nullable=False),
        sa.Column("created_at", DateTime(timezone=True), nullable=False, server_default=func.now()),
    )
    op.create_index(op.f("ix_audit_events_id"), "audit_events", ["id"], unique=False)


def downgrade() -> None:
    op.drop_table("audit_events")
    op.drop_table("certificate_records")
    op.drop_table("user_sessions")
    op.drop_table("users")
