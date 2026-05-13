import asyncio
from database import engine
from modelos.base import Base

# Modelos para registrar el metadato
from modelos.restaurante import Restaurante
from modelos.usuario import Usuario
from modelos.mesa import Mesa
from modelos.menu import Categoria, MenuItem
from modelos.pedido import Pedido, LineaPedido

async def recreate_db():
    print("Iniciando borrado de base de datos...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        print("Tablas borradas exitosamente.")
        
        await conn.run_sync(Base.metadata.create_all)
        print("Tablas creadas exitosamente.")

if __name__ == "__main__":
    asyncio.run(recreate_db())
