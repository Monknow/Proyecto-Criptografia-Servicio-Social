import asyncio
import os

import pyotp
from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import get_db
from app.models.usuario import Usuario


async def main():
    correo = os.environ.get("ADMIN_EMAIL")
    password = os.environ.get("ADMIN_PASSWORD")
    if not correo or not password:
        print("seed_admin: ADMIN_EMAIL/ADMIN_PASSWORD no definidos, se omite.")
        return

    matricula = os.environ.get("ADMIN_MATRICULA", "ADMIN").upper()

    async for db in get_db():
        existing = (
            await db.execute(select(Usuario).where(Usuario.correo == correo))
        ).scalar_one_or_none()

        if existing:
            existing.rol = "admin"
            if os.environ.get("ADMIN_RESET_PASSWORD") == "1":
                existing.password_hash = hash_password(password)
            print(f"seed_admin: usuario {correo} ya existe, rol=admin asegurado.")
        else:
            db.add(Usuario(
                id_matricula=matricula,
                nombre=os.environ.get("ADMIN_NOMBRE", "Administrador"),
                correo=correo,
                carrera="N/A",
                semestre=0,
                password_hash=hash_password(password),
                is_google_login=False,
                totp_secret=pyotp.random_base32(),
                rol="admin",
            ))
            print(f"seed_admin: admin {correo} creado.")
        await db.commit()
        break


if __name__ == "__main__":
    asyncio.run(main())
