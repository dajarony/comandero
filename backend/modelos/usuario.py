"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/usuario.py
Tipo: Modelo ORM → Usuario (Camarero/Admin)
Líneas: ~40 / 200 MAX
Dependencias: 2 (sqlalchemy, base)

Campos:
- id, nombre, email, password_hash, rol, activo
- created_at (auto)

Relaciones:
- pedidos: Un usuario tiene muchos pedidos

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy import String, Boolean, DateTime, func, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from .base import Base


class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = (
        # Email único por restaurante (dos restaurantes pueden tener el mismo email de empleado)
        UniqueConstraint('restaurante_id', 'email', name='uix_restaurante_email'),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    rol: Mapped[str] = mapped_column(String(20), default="CAMARERO")
    activo: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relaciones
    restaurante: Mapped["Restaurante"] = relationship("Restaurante", back_populates="usuarios")
    pedidos: Mapped[list["Pedido"]] = relationship("Pedido", back_populates="usuario")
