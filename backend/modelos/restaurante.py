"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/restaurante.py
Tipo: Infraestructura → Modelo ORM (Tenant)
Líneas: ~35 / 200 MAX
Dependencias: 2 (sqlalchemy, base)

Campos:
- id, nombre, activo, created_at

Relaciones:
- usuarios, mesas, categorias, items, pedidos (1:N)

Última Modificación: 2026-03-29 | Dajarony/Antigravity
Cambio: Implementación inicial para Multi-Tenant SaaS.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy import String, Boolean, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base


class Restaurante(Base):
    __tablename__ = "restaurantes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    modo: Mapped[str] = mapped_column(String(12), default="TPV", server_default="TPV")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relaciones Multi-Tenant Inversas (cascade: borrar tenant borra todo su contenido)
    usuarios: Mapped[list["Usuario"]] = relationship("Usuario", back_populates="restaurante", cascade="all, delete-orphan")
    mesas: Mapped[list["Mesa"]] = relationship("Mesa", back_populates="restaurante", cascade="all, delete-orphan")
    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", back_populates="restaurante", cascade="all, delete-orphan")
    categorias: Mapped[list["Categoria"]] = relationship("Categoria", back_populates="restaurante", cascade="all, delete-orphan")
    menu_items: Mapped[list["MenuItem"]] = relationship("MenuItem", back_populates="restaurante", cascade="all, delete-orphan")
