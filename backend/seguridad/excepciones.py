"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seguridad/excepciones.py
Tipo: Seguridad → Manejo Centralizado de Errores
Líneas: ~60 / 200 MAX
Dependencias: 2 (fastapi, logger)

Acciones:
- Define excepciones personalizadas del sistema
- Middleware global que captura todas las excepciones
- Loguea errores automáticamente con contexto
- Retorna respuestas JSON estandarizadas

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial middleware de excepciones.
═══════════════════════════════════════════════════════════
"""

from fastapi import Request
from fastapi.responses import JSONResponse
from seguridad.logger import obtener_logger
from datetime import datetime

logger = obtener_logger("excepciones")


class AppException(Exception):
    """Excepción base del sistema Comandero."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundException(AppException):
    """Recurso no encontrado."""

    def __init__(self, recurso: str, id_recurso: int | str = ""):
        super().__init__(
            message=f"{recurso} no encontrado: {id_recurso}",
            status_code=404,
        )


class AuthException(AppException):
    """Error de autenticación o autorización."""

    def __init__(self, message: str = "No autorizado"):
        super().__init__(message=message, status_code=401)


class ForbiddenException(AppException):
    """Permisos insuficientes."""

    def __init__(self, message: str = "Permisos insuficientes"):
        super().__init__(message=message, status_code=403)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Middleware global — captura TODA excepción no controlada."""

    if isinstance(exc, AppException):
        logger.warning(f"[{exc.status_code}] {request.method} {request.url.path} → {exc.message}")
        status = exc.status_code
        message = exc.message
    else:
        logger.error(f"[500] {request.method} {request.url.path} → {str(exc)}", exc_info=True)
        status = 500
        message = "Error interno del servidor"

    return JSONResponse(
        status_code=status,
        content={
            "success": False,
            "data": None,
            "error": message,
            "timestamp": datetime.utcnow().isoformat(),
        },
    )
