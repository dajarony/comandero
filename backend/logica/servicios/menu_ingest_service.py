"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/servicios/menu_ingest_service.py
Tipo: Servicio → Ingesta Inteligente de Carta (CSV)
Líneas: ~120 / 200 MAX
Dependencias: 5 (csv, anthropic, sqlalchemy, contratos, logger)

Flujo:
  CSV (bytes) → parsear_csv() → IA categoriza() → guardar_items()

S (Setup): Cliente Anthropic, reglas de categorización.
U (Use):   procesar_csv_y_guardar() — pipeline completo.
M (Manage): _parsear_csv(), _categorizar_con_ia(), _guardar_en_db()
E (Error):  MENU_INGEST_PARSE_FAILED, MENU_INGEST_SAVE_FAILED.

Nota: Usa Claude claude-haiku-4-5-20251001 para minimizar coste.
      Si ANTHROPIC_API_KEY no está configurada, usa categorización
      mock (modo desarrollo).

Última Modificación: 2026-03-17 | Auditoría
Cambio: Extraídas constantes y mock → menu_categorias.py
═══════════════════════════════════════════════════════════
"""

import csv
import io
import json
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException

from modelos.menu import Categoria, MenuItem
from seguridad.logger import obtener_logger
from config import get_settings
from logica.servicios.menu_categorias import (
    CATEGORIAS_CONOCIDAS, EMOJIS_CATEGORIA, categorizar_mock,
)

# ── S (Setup) ────────────────────────────────────────────
logger = obtener_logger("menu_ingest_service")
settings = get_settings()


# ── M (Manage) ───────────────────────────────────────────
def _parsear_csv(contenido: bytes) -> list[dict]:
    """Parsea CSV con columnas nombre,precio (mínimo requerido)."""
    try:
        texto = contenido.decode("utf-8-sig")
        reader = csv.DictReader(io.StringIO(texto))
        items = []
        for row in reader:
            nombre = (row.get("nombre") or row.get("Nombre") or "").strip()
            precio_str = (row.get("precio") or row.get("Precio") or "0").strip()
            precio_str = precio_str.replace(",", ".").replace("€", "").strip()
            if not nombre or not precio_str:
                continue
            try:
                precio = float(precio_str)
            except ValueError:
                continue
            items.append({"nombre": nombre, "precio": precio})
        return items
    except Exception as e:
        logger.error(f"Error parseando CSV: {e}")
        raise HTTPException(status_code=400, detail="MENU_INGEST_PARSE_FAILED")


async def _categorizar_con_ia(items: list[dict], api_key: str) -> list[dict]:
    """Usa Claude para categorizar los items del CSV."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)

        lista_items = "\n".join(f"- {i['nombre']} ({i['precio']}€)" for i in items)
        prompt = f"""Eres un experto en gastronomía española. Categoriza cada item del menú.
Categorías disponibles: {', '.join(CATEGORIAS_CONOCIDAS)}

Items a categorizar:
{lista_items}

Responde ÚNICAMENTE con un JSON válido. Array de objetos con campos:
"nombre" (string), "precio" (number), "categoria" (string de la lista).
No añadas explicaciones, solo el JSON."""

        mensaje = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        texto = mensaje.content[0].text.strip()
        if "```" in texto:
            partes = texto.split("```")
            bloque = partes[1] if len(partes) >= 2 else partes[0]
            bloque = bloque.removeprefix("json").strip()
            texto = bloque
        return json.loads(texto.strip())
    except Exception as e:
        logger.warning(f"IA falló, usando categorización mock: {e}")
        return categorizar_mock(items)


async def _guardar_en_db(items_categorizados: list[dict], db: AsyncSession, restaurante_id: int) -> dict:
    """Persiste categorías e items en la base de datos."""
    categorias_cache: dict[str, int] = {}
    items_creados = 0

    for item_data in items_categorizados:
        cat_nombre = item_data.get("categoria", "Otros")
        emoji = EMOJIS_CATEGORIA.get(cat_nombre, "🍽️")

        if cat_nombre not in categorias_cache:
            result = await db.execute(
                select(Categoria).where(Categoria.nombre == cat_nombre, Categoria.restaurante_id == restaurante_id)
            )
            cat = result.scalar_one_or_none()
            if not cat:
                cat = Categoria(nombre=cat_nombre, emoji=emoji, orden=len(categorias_cache), restaurante_id=restaurante_id)
                db.add(cat)
                await db.flush()
            categorias_cache[cat_nombre] = cat.id

        nuevo_item = MenuItem(
            nombre=item_data["nombre"],
            precio=float(item_data["precio"]),
            categoria_id=categorias_cache[cat_nombre],
            restaurante_id=restaurante_id,
            disponible=True,
        )
        db.add(nuevo_item)
        items_creados += 1

    await db.commit()
    return {
        "items_guardados": items_creados,
        "categorias_usadas": list(categorias_cache.keys()),
    }


# ── U (Use) ──────────────────────────────────────────────
async def procesar_csv_y_guardar(
    contenido: bytes,
    db: AsyncSession,
    restaurante_id: int,
    api_key: Optional[str] = None,
) -> dict:
    """Pipeline completo: CSV → IA → DB."""
    try:
        items_raw = _parsear_csv(contenido)
        if not items_raw:
            raise HTTPException(status_code=400, detail="MENU_INGEST_CSV_EMPTY")

        logger.info(f"CSV parseado: {len(items_raw)} items detectados")

        usar_ia = bool(api_key or getattr(settings, "ANTHROPIC_API_KEY", None))
        key = api_key or getattr(settings, "ANTHROPIC_API_KEY", None)

        if usar_ia and key:
            items_categorizados = await _categorizar_con_ia(items_raw, key)
        else:
            logger.info("Usando categorización mock (sin API key de IA)")
            items_categorizados = categorizar_mock(items_raw)

        resultado = await _guardar_en_db(items_categorizados, db, restaurante_id)
        logger.info(f"Ingesta completada: {resultado}")
        return resultado
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en ingesta CSV: {e}")
        raise HTTPException(status_code=500, detail="MENU_INGEST_SAVE_FAILED")
