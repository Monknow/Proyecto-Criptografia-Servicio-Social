"""FKs a usuarios.id_matricula con ON UPDATE CASCADE

Permite corregir la matrícula de un usuario (p. ej. GGL-XXXX -> A01234567)
sin romper usuario_eventos, inscripciones, refresh_tokens ni pre_auth_tokens.

Revision ID: m6f7a8b9c0d1
Revises: l5e6f7a8b9c0
Create Date: 2026-11-12 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "m6f7a8b9c0d1"
down_revision: Union[str, Sequence[str], None] = "l5e6f7a8b9c0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# tabla -> ondelete que ya tenía la FK
_TABLES = {
    "usuario_eventos": "CASCADE",
    "refresh_tokens": "CASCADE",
    "pre_auth_tokens": "CASCADE",
    "inscripciones": "RESTRICT",
}


def _recreate(onupdate: str | None) -> None:
    inspector = sa.inspect(op.get_bind())
    existing = set(inspector.get_table_names())
    for table, ondelete in _TABLES.items():
        if table not in existing:
            continue
        for fk in inspector.get_foreign_keys(table):
            if fk["referred_table"] == "usuarios" and fk["constrained_columns"] == ["id_matricula"]:
                op.drop_constraint(fk["name"], table, type_="foreignkey")
                op.create_foreign_key(
                    fk["name"],
                    table,
                    "usuarios",
                    ["id_matricula"],
                    ["id_matricula"],
                    ondelete=ondelete,
                    onupdate=onupdate,
                )


def upgrade() -> None:
    _recreate("CASCADE")


def downgrade() -> None:
    _recreate(None)
