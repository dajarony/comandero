"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: config.py
Tipo: Configuración → Centralizada
Líneas: ~35 / 200 MAX
Dependencias: 1 (pydantic-settings)

Acciones:
- Carga todas las variables de entorno desde .env
- Provee un único punto de acceso a la configuración
- Valida que las variables requeridas existan al arrancar

Última Modificación: 2026-03-10 | Dajarony
Cambio: Implementación inicial de configuración centralizada.
═══════════════════════════════════════════════════════════
"""

from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from functools import lru_cache
import logging


class Settings(BaseSettings):
    """Configuración centralizada — Single Source of Truth."""

    # --- Base de Datos ---
    DATABASE_URL: str = "postgresql+asyncpg://localhost/comandero"

    # --- Seguridad ---
    JWT_SECRET: str = "CHANGE_ME_IN_PRODUCTION"

    @field_validator("JWT_SECRET")
    @classmethod
    def jwt_secret_no_default(cls, v: str) -> str:
        if v == "CHANGE_ME_IN_PRODUCTION":
            logging.warning(
                "⚠️  JWT_SECRET usa valor por defecto — CAMBIAR en produccion"
            )
        if len(v) < 32:
            logging.warning(
                "⚠️  JWT_SECRET muy corto (%d chars). Mínimo recomendado: 32",
                len(v),
            )
        return v
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 480

    # --- IA ---
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # --- Restaurante ---
    RESTAURANT_NAME: str = "RESTAURANTE CARIBE"

    # --- Servidor ---
    # En producción, usar dominios explícitos separados por coma
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:8100"
    LOG_LEVEL: str = "INFO"
    APP_ENV: str = "development"
    ENABLE_DEMO_USERS: bool = False

    @model_validator(mode="after")
    def production_requires_secure_settings(self):
        env = self.APP_ENV.lower()
        if env in {"production", "prod"}:
            if self.JWT_SECRET == "CHANGE_ME_IN_PRODUCTION" or len(self.JWT_SECRET) < 32:
                raise ValueError("JWT_SECRET seguro es obligatorio en produccion")
            if self.ENABLE_DEMO_USERS:
                raise ValueError("ENABLE_DEMO_USERS no puede estar activo en produccion")
        return self

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    """Retorna instancia cacheada de configuración."""
    return Settings()
