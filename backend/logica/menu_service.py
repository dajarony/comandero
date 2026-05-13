"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/menu_service.py
Tipo: Lógica → Servicio de Menú/Carta
Líneas: ~50 / 200 MAX
Dependencias: 3 (sqlalchemy, modelos, excepciones)

Acciones:
- Listar categorías con su emoji y orden
- Listar items del menú (filtrable por categoría)
- Crear nuevo item (admin)
- Actualizar item (admin)
- Toggle disponibilidad de un item

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial gestión de menú.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from modelos.menu import Categoria, MenuItem
from contratos.menu import CategoriaResponse, ItemMenuCreate, ItemMenuResponse, ItemMenuUpdate
from seguridad.excepciones import NotFoundException
from seguridad.logger import obtener_logger

logger = obtener_logger("menu_service")


async def listar_categorias(db: AsyncSession, restaurante_id: int) -> list[CategoriaResponse]:
    """Retorna todas las categorías del menú ordenadas."""
    result = await db.execute(select(Categoria).where(Categoria.restaurante_id == restaurante_id).order_by(Categoria.orden))
    cats = result.scalars().all()
    logger.info(f"Listando {len(cats)} categorías (restaurante={restaurante_id})")
    return [CategoriaResponse.model_validate(c) for c in cats]


async def listar_items(db: AsyncSession, restaurante_id: int, categoria_id: int | None = None) -> list[ItemMenuResponse]:
    """Lista items del menú, opcionalmente filtrados por categoría."""
    query = (
        select(MenuItem)
        .join(Categoria)
        .options(selectinload(MenuItem.categoria))
    )
    if categoria_id:
        query = query.where(MenuItem.categoria_id == categoria_id)
    query = query.where(MenuItem.restaurante_id == restaurante_id).order_by(Categoria.orden, MenuItem.nombre)

    result = await db.execute(query)
    items = result.scalars().all()
    logger.info(f"Listando {len(items)} items de menú")

    return [
        ItemMenuResponse(
            id=item.id,
            nombre=item.nombre,
            descripcion=item.descripcion,
            precio=item.precio,
            emoji=item.emoji,
            disponible=item.disponible,
            categoria_id=item.categoria_id,
            categoria_nombre=item.categoria.nombre if item.categoria else None,
        )
        for item in items
    ]


async def crear_item(db: AsyncSession, datos: ItemMenuCreate, restaurante_id: int) -> ItemMenuResponse:
    """Crea un nuevo item en el menú (admin only)."""
    cat = await db.scalar(select(Categoria).where(Categoria.id == datos.categoria_id, Categoria.restaurante_id == restaurante_id))
    if not cat:
        raise NotFoundException("Categoría", datos.categoria_id)

    nuevo = MenuItem(
        nombre=datos.nombre,
        descripcion=datos.descripcion,
        precio=datos.precio,
        emoji=datos.emoji,
        categoria_id=datos.categoria_id,
        restaurante_id=restaurante_id,
        disponible=datos.disponible,
    )
    db.add(nuevo)
    await db.commit()
    await db.refresh(nuevo)

    logger.info(f"Item creado: {nuevo.nombre} ({nuevo.precio}€)")
    return ItemMenuResponse(
        id=nuevo.id, nombre=nuevo.nombre, descripcion=nuevo.descripcion,
        precio=nuevo.precio, emoji=nuevo.emoji, disponible=nuevo.disponible,
        categoria_id=nuevo.categoria_id, categoria_nombre=cat.nombre,
    )


async def actualizar_item(db: AsyncSession, item_id: int, datos: ItemMenuUpdate, restaurante_id: int) -> ItemMenuResponse:
    """Actualiza campos de un item del menú."""
    item = await db.scalar(select(MenuItem).where(MenuItem.id == item_id, MenuItem.restaurante_id == restaurante_id))
    if not item:
        raise NotFoundException("MenuItem", item_id)

    for field, value in datos.model_dump(exclude_unset=True).items():
        setattr(item, field, value)

    await db.commit()
    await db.refresh(item)

    logger.info(f"Item actualizado: {item.nombre}")
    return ItemMenuResponse(
        id=item.id, nombre=item.nombre, descripcion=item.descripcion,
        precio=item.precio, emoji=item.emoji, disponible=item.disponible,
        categoria_id=item.categoria_id,
    )
