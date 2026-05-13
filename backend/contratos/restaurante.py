"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: contratos/restaurante.py
Tipo: Contrato → Schemas de Restaurante
Líneas: ~25 / 200 MAX

Entradas/Salidas:
- RestauranteResponse: Datos públicos del restaurante.
- RestauranteUpdate: Campos editables por el admin.

Última Modificación: 2026-04-02 | Dajarony
Cambio: Creado para la página de configuración.
═══════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RestauranteResponse(BaseModel):
    id: int
    nombre: str
    activo: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RestauranteUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=2, max_length=100)
    activo: Optional[bool] = None
