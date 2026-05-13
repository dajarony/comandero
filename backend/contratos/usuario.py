"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: contratos/usuario.py
Tipo: Contrato → Schemas de Usuario
Líneas: ~40 / 200 MAX
Dependencias: 1 (pydantic)

Entradas/Salidas:
- UsuarioCreate: Registro de nuevo camarero/admin.
- UsuarioLogin: Credenciales de autenticación.
- UsuarioResponse: Datos públicos del usuario (sin password).
- TokenResponse: JWT + metadata de sesión.

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial de contratos de usuario.
═══════════════════════════════════════════════════════════
"""

from pydantic import BaseModel, Field
from enum import Enum


class RolUsuario(str, Enum):
    CAMARERO = "CAMARERO"
    COCINA = "COCINA"
    ADMIN = "ADMIN"


class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=8, max_length=128)
    rol: RolUsuario = RolUsuario.CAMARERO
    restaurante_id: int = Field(default=1)


class UsuarioLogin(BaseModel):
    email: str
    password: str


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    rol: str
    activo: bool = True

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioResponse


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(None, min_length=2, max_length=100)
    email: str | None = Field(None, min_length=5, max_length=150)
    rol: RolUsuario | None = None
    activo: bool | None = None


class UsuarioPasswordReset(BaseModel):
    nueva_password: str = Field(..., min_length=8, max_length=128)


class RegistroRestauranteCreate(BaseModel):
    """Crea un restaurante nuevo + su primer usuario ADMIN en una sola llamada."""
    nombre_restaurante: str = Field(..., min_length=2, max_length=100)
    nombre_admin: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=8, max_length=128)

