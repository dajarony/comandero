"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seeds/seed_data.py
Tipo: Infraestructura → Datos Iniciales
Líneas: ~80 / 200 MAX
Dependencias: 4 (sqlalchemy, modelos, passlib, seed_menu)

Acciones:
- Crea categorías de bebidas y vinos con emojis
- Crea 90+ items del menú con precios reales
- Crea 12 mesas iniciales
- Crea usuario admin y camarero de prueba

Datos del menú importados desde seed_menu.py.

Última Modificación: 2026-03-15 | Dajarony
Cambio: Reemplazo menú comida por bebidas y vinos.
═══════════════════════════════════════════════════════════
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.context import CryptContext
from modelos.usuario import Usuario
from modelos.mesa import Mesa
from modelos.menu import Categoria, MenuItem
from modelos.restaurante import Restaurante
from config import get_settings
from seguridad.logger import obtener_logger
from seeds.seed_menu import CATEGORIAS, ITEMS_POR_CATEGORIA

logger = obtener_logger("seed_data")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def seed_all(db: AsyncSession) -> None:
    """Ejecuta seeds por tabla — soporta seeds parciales."""
    logger.info("═══ Verificando datos iniciales ═══")

    settings = get_settings()

    # Restaurante Demo
    result = await db.execute(select(Restaurante))
    restaurante = result.scalars().first()
    if not restaurante:
        restaurante = Restaurante(nombre="Restaurante Demo SaaS", activo=True)
        db.add(restaurante)
        await db.commit()
        await db.refresh(restaurante)
        logger.info(f"Seed: Restaurante Demo creado (ID={restaurante.id})")
    else:
        logger.info(f"Seed: Restaurante '{restaurante.nombre}' existe — saltando")

    restaurante_id = restaurante.id

    # Categorías + Items
    result = await db.execute(select(Categoria).where(Categoria.restaurante_id == restaurante_id))
    if not result.scalars().first():
        await _seed_categorias_e_items(db, restaurante_id)
    else:
        logger.info("Seed: Categorías ya existen — saltando")

    # Mesas
    result = await db.execute(select(Mesa).where(Mesa.restaurante_id == restaurante_id))
    if not result.scalars().first():
        await _seed_mesas(db, restaurante_id)
    else:
        logger.info("Seed: Mesas ya existen — saltando")

    # Usuarios
    result = await db.execute(select(Usuario).where(Usuario.restaurante_id == restaurante_id))
    if not result.scalars().first():
        if settings.APP_ENV == "development" or settings.ENABLE_DEMO_USERS:
            await _seed_usuarios(db, restaurante_id)
        else:
            logger.warning("Seed: usuarios demo omitidos fuera de development")
    else:
        logger.info("Seed: Usuarios ya existen — saltando")

    logger.info("═══ Seed completado ═══")


async def force_reseed_menu(db: AsyncSession, restaurante_id: int = 1) -> dict:
    """Borra menú viejo y recarga bebidas/vinos."""
    from modelos.pedido import LineaPedido, Pedido
    from sqlalchemy import delete, select

    # Para borrar con seguridad, deberíamos filtrar por restaurante_id,
    # pero como delete no es sencillo con joins aquí, de momento
    # asumimos un solo restaurante para debug o extendemos.
    pedidos_del_restaurante = select(Pedido.id).where(Pedido.restaurante_id == restaurante_id)
    await db.execute(delete(LineaPedido).where(LineaPedido.pedido_id.in_(pedidos_del_restaurante)))
    await db.execute(delete(Pedido).where(Pedido.restaurante_id == restaurante_id))
    await db.execute(delete(MenuItem).where(MenuItem.restaurante_id == restaurante_id))
    await db.execute(delete(Categoria).where(Categoria.restaurante_id == restaurante_id))
    await db.commit()
    logger.info(f"Force reseed: datos viejos borrados para restaurante {restaurante_id}")

    await _seed_categorias_e_items(db, restaurante_id)
    return {"categorias": len(CATEGORIAS), "mensaje": "Menú recargado"}


async def _seed_categorias_e_items(db: AsyncSession, restaurante_id: int) -> None:
    """Crea categorías e items de bebidas y vinos."""
    cat_map = {}
    for cat_data in CATEGORIAS:
        cat = Categoria(**cat_data, restaurante_id=restaurante_id)
        db.add(cat)
        await db.flush()
        cat_map[cat_data["nombre"]] = cat.id

    items_count = 0
    for cat_nombre, items in ITEMS_POR_CATEGORIA.items():
        cat_id = cat_map.get(cat_nombre)
        if not cat_id:
            continue
        for nombre, precio, emoji in items:
            db.add(MenuItem(
                nombre=nombre, precio=precio,
                emoji=emoji, disponible=True,
                categoria_id=cat_id,
                restaurante_id=restaurante_id
            ))
            items_count += 1

    await db.commit()
    logger.info(f"Seed: {len(CATEGORIAS)} categorías + {items_count} items creados")


async def _seed_mesas(db: AsyncSession, restaurante_id: int) -> None:
    """Crea 12 mesas iniciales."""
    for i in range(1, 13):
        db.add(Mesa(numero=str(i), estado="LIBRE", restaurante_id=restaurante_id))
    await db.commit()
    logger.info("Seed: 12 mesas creadas")


async def _seed_usuarios(db: AsyncSession, restaurante_id: int) -> None:
    """Crea admin y camarero de prueba."""
    admin_pass = os.getenv("SEED_ADMIN_PASSWORD", "admin1234")
    camarero_pass = os.getenv("SEED_CAMARERO_PASSWORD", "camarero1234")
    admin = Usuario(
        nombre="Admin Dajarony",
        email="admin@dajarony.com",
        password_hash=pwd_context.hash(admin_pass),
        rol="ADMIN",
        restaurante_id=restaurante_id
    )
    camarero = Usuario(
        nombre="Camarero Demo",
        email="camarero@dajarony.com",
        password_hash=pwd_context.hash(camarero_pass),
        rol="CAMARERO",
        restaurante_id=restaurante_id
    )
    db.add_all([admin, camarero])
    await db.commit()
    logger.warning("⚠️  Seed: Usuarios DEMO creados — CAMBIAR passwords en produccion")
    logger.warning("⚠️  admin@dajarony.com / camarero@dajarony.com son cuentas de prueba")

