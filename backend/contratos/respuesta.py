"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: contratos/respuesta.py
Tipo: Contrato → Wrapper de Respuesta
Líneas: ~30 / 200 MAX
Dependencias: 1 (pydantic)

Acciones:
- Define ApiResponse[T] genérico para todas las respuestas
- Estandariza el formato JSON de salida del sistema
- Incluye timestamp automático en cada respuesta

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial del wrapper estándar.
═══════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field
from typing import TypeVar, Generic, Optional
from datetime import datetime

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """Wrapper estándar para todas las respuestas de la API."""

    success: bool = True
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
