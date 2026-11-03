import asyncio
from sqlalchemy import select, update
from app.db.session import get_db
from app.models.usuario import Usuario

async def main():
    async for db in get_db():
        try:
            result = await db.execute(
                select(
                    Usuario.id_matricula,
                    Usuario.correo,
                    Usuario.rol,
                    Usuario.id_socioformador,
                ).where(
                    Usuario.id_socioformador.in_([1, 2, 3, 4, 5, 6]),
                    Usuario.rol == "empresa",
                )
            )

            accounts = result.all()

            print("\nAccounts found:")
            for account in accounts:
                print(
                    f"{account.id_socioformador}: "
                    f"{account.correo} | {account.rol}"
                )

            ids = [account.id_socioformador for account in accounts]

            if len(accounts) != 6 or set(ids) != {1, 2, 3, 4, 5, 6}:
                await db.rollback()
                print("\nERROR: Expected exactly six accounts, "
                      "one for each socioformador ID.")
                print("No changes were committed.")
                return

            result = await db.execute(
                update(Usuario)
                .where(
                    Usuario.id_socioformador.in_([1, 2, 3, 4, 5, 6]),
                    Usuario.rol == "empresa",
                )
                .values(rol="socioformador")
                .returning(
                    Usuario.id_matricula,
                    Usuario.correo,
                    Usuario.rol,
                    Usuario.id_socioformador,
                )
            )

            updated = result.all()

            if len(updated) != 6:
                await db.rollback()
                print("\nERROR: Unexpected number of updated accounts.")
                print("Transaction rolled back.")
                return

            await db.commit()

            print("\nSUCCESS! Updated accounts:")
            for account in updated:
                print(
                    f"{account.id_socioformador}: "
                    f"{account.correo} | {account.rol}"
                )

        except Exception as error:
            await db.rollback()
            print(f"\nERROR: {error}")
            print("Transaction rolled back.")

        break


if __name__ == "__main__":
    asyncio.run(main())
