"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/menu.py
Tipo: Modelo ORM → Categoria + MenuItem
Líneas: ~60 / 200 MAX
Dependencias: 2 (sqlalchemy, base)

Modelos:
- Categoria: id, nombre, emoji, orden
- MenuItem: id, nombre, descripcion, precio, emoji,
            disponible, categoria_id (FK)

Relaciones:
- Categoria → items (1:N con MenuItem)
- MenuItem → categoria (N:1 con Categoria)
- MenuItem → lineas_pedido (1:N con LineaPedido)

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy import String, Integer, Float, Boolean, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional
from .base import Base


class Categoria(Base):
    __tablename__ = "categorias"
    __table_args__ = (
        UniqueConstraint('restaurante_id', 'nombre', name='uix_restaurante_categoria_nombre'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    emoji: Mapped[str] = mapped_column(String(10), default="🍽️")
    orden: Mapped[int] = mapped_column(Integer, default=0)

    # Relaciones
    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="categorias")
    items: Mapped[list["MenuItem"]] = relationship("MenuItem", back_populates="categoria", cascade="all, delete-orphan")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    descripcion: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    precio: Mapped[float] = mapped_column(Float, nullable=False)
    emoji: Mapped[str] = mapped_column(String(10), default="🍽️")
    disponible: Mapped[bool] = mapped_column(Boolean, default=True)
    categoria_id: Mapped[int] = mapped_column(ForeignKey("categorias.id"), nullable=False, index=True)

    # Relaciones
    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="menu_items")
    categoria: Mapped["Categoria"] = relationship("Categoria", back_populates="items")
    lineas_pedido: Mapped[list["LineaPedido"]] = relationship("LineaPedido", back_populates="item_menu")
