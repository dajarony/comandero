"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: modelos/gasto.py
Tipo: Modelo ORM → Gasto
Líneas: ~45 / 200 MAX
Dependencias: 2 (sqlalchemy, base)

Modelos:
- Gasto: id, restaurante_id, nombre, categoria, importe,
         dia_vencimiento, activo, created_at

Categorías válidas: FIJO_MENSUAL | NOMINA | VARIABLE | IRREGULAR

Relaciones:
- Gasto → restaurante (N:1)

Última Modificación: 2026-04-03 | Dajarony
Cambio: Implementación inicial del modelo de gastos.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Boolean, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from typing import Optional
from .base import Base


class Gasto(Base):
    __tablename__ = "gastos"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(ForeignKey("restaurantes.id"), nullable=False, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    categoria: Mapped[str] = mapped_column(String(50), nullable=False, default="VARIABLE")
    importe: Mapped[float] = mapped_column(Float, nullable=False)
    dia_vencimiento: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    activo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relaciones
    restaurante: Mapped["Restaurante"] = relationship("Restaurante")
