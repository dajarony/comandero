"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: contratos/mesa.py
Tipo: Contrato → Schemas de Mesa
Líneas: ~35 / 200 MAX
Dependencias: 1 (pydantic)

Entradas/Salidas:
- MesaEstado: Enum de estados posibles.
- MesaResponse: Representación completa de una mesa.
- MesaCambioEstado: Payload para cambiar estado de mesa.
- MesaNotaUpdate: Payload para actualizar nota de mesa.

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial de contratos de mesa.
═══════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from enum import Enum


class MesaEstado(str, Enum):
    LIBRE = "LIBRE"
    OCUPADA = "OCUPADA"
    PENDIENTE_COBRO = "PENDIENTE_COBRO"


class MesaResponse(BaseModel):
    id: int
    numero: str
    estado: MesaEstado
    comensales: Optional[int] = None
    hora_apertura: Optional[str] = None
    total_cuenta: float = 0.0
    nota: Optional[str] = None
    turno: int = Field(default=0, ge=0)

    @field_validator("turno", mode="before")
    @classmethod
    def turno_inicial(cls, value: int | None) -> int:
        return 0 if value is None else value

    model_config = {"from_attributes": True}


class MesaNotaUpdate(BaseModel):
    nota: Optional[str] = Field(None, max_length=300)


class MesaCambioEstado(BaseModel):
    estado: MesaEstado
    comensales: Optional[int] = None
