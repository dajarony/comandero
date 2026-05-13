"""
Script de corrección P3: Reclasificar items mal categorizados.
Ejecutar una vez: python -m seeds.fix_clasificacion
"""

import asyncio
from sqlalchemy import select, delete
from database import AsyncSessionLocal
from modelos.menu import Categoria, MenuItem
from seguridad.logger import obtener_logger

logger = obtener_logger("fix_clasificacion")

# Movimientos: (item_id, nombre_item, categoria_destino)
MOVIMIENTOS = [
    (169, "Paella Mixta", "Carnes"),
    (161, "Parrillada Mixta", "Carnes"),
    (156, "Tartar de Atún", "Pescados"),
    (141, "Aguacate con Gambas", "Tapas"),
    (139, "Chipirones", "Pescados"),
    (168, "Paella de Marisco", "Pescados"),
]

# Categorías a borrar si están vacías
BORRAR_SI_VACIAS = ["Otros"]

# Categorías a revisar (solo log)
REVISAR = ["Postres", "Fritos"]


async def fix():
    async with AsyncSessionLocal() as db:
        # Cargar mapa de categorías
        result = await db.execute(select(Categoria))
        cats = {c.nombre: c.id for c in result.scalars().all()}
        logger.info(f"Categorías encontradas: {list(cats.keys())}")

        # Mover items
        movidos = 0
        for item_id, nombre, cat_destino in MOVIMIENTOS:
            cat_id = cats.get(cat_destino)
            if not cat_id:
                logger.warning(f"Categoría '{cat_destino}' no existe — saltando {nombre}")
                continue
            item = await db.get(MenuItem, item_id)
            if not item:
                logger.warning(f"Item #{item_id} ({nombre}) no existe — saltando")
                continue
            old_cat = item.categoria_id
            item.categoria_id = cat_id
            movidos += 1
            logger.info(f"Movido: {nombre} (#{item_id}) cat {old_cat} → {cat_id} ({cat_destino})")

        # Borrar categorías vacías
        for cat_nombre in BORRAR_SI_VACIAS:
            cat_id = cats.get(cat_nombre)
            if not cat_id:
                continue
            result = await db.execute(
                select(MenuItem).where(MenuItem.categoria_id == cat_id)
            )
            if not result.scalars().first():
                await db.execute(delete(Categoria).where(Categoria.id == cat_id))
                logger.info(f"Borrada categoría vacía: {cat_nombre} (#{cat_id})")
            else:
                logger.warning(f"Categoría {cat_nombre} NO está vacía — no borrada")

        # Revisar categorías potencialmente vacías
        for cat_nombre in REVISAR:
            cat_id = cats.get(cat_nombre)
            if not cat_id:
                continue
            result = await db.execute(
                select(MenuItem).where(MenuItem.categoria_id == cat_id)
            )
            items = result.scalars().all()
            logger.info(f"Revisión: {cat_nombre} tiene {len(items)} items")

        await db.commit()
        logger.info(f"Fix completado: {movidos} items movidos")


if __name__ == "__main__":
    asyncio.run(fix())
