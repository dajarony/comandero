"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/ia.py
Tipo: Adaptador HTTP → Asistente IA
Líneas: ~115 / 200 MAX

Rutas:
  POST /ia/chat        → Chat + function calling con GPT-4o
  POST /ia/informe     → Informe narrativo diario completo
  GET  /ia/sugerencias → Chips contextuales según negocio

Dependencias:
  logica.servicios.ia_context → build_context, gastos_ctx, personal_ctx, get_datos_financieros
  logica.servicios.ia_tools   → IA_FUNCTIONS, ejecutar_tool

Última Modificación: 2026-04-04 | Dajarony
Cambio: Fix calidad — AsyncOpenAI singleton, success=False en except chat,
        get_datos_financieros en informe, try/except en sugerencias,
        imports públicos (gastos_ctx, personal_ctx).
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
from openai import AsyncOpenAI
import json

from database import get_db
from config import get_settings
from contratos.respuesta import ApiResponse
from modelos.usuario import Usuario
from logica.servicios.ia_context import build_context, gastos_ctx, personal_ctx, get_datos_financieros
from logica.servicios.ia_tools import IA_FUNCTIONS, ejecutar_tool
from logica.servicios.stats_service import estadisticas_resumen
from seguridad.deps import get_current_user
from seguridad.logger import obtener_logger

router   = APIRouter()
logger   = obtener_logger("ia")
settings = get_settings()

_openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None

_NO_KEY_RESPONSE = JSONResponse(
    status_code=503,
    content={"success": False, "data": None, "error": "OPENAI_API_KEY no configurada"}
)

# ── Schema ────────────────────────────────────────────────

class ChatBody(BaseModel):
    mensaje: str
    historial: Optional[list[dict]] = []

# ── Endpoints ─────────────────────────────────────────────

@router.post("/chat", response_model=ApiResponse[dict])
async def chat_asistente(
    body: ChatBody,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Chat con function calling — la IA puede ejecutar acciones reales."""
    if not settings.OPENAI_API_KEY:
        return _NO_KEY_RESPONSE
    try:
        ctx    = await build_context(db, user.restaurante_id)
        system = (
            f"Eres el asistente de negocio de {settings.RESTAURANT_NAME}. "
            "Tienes acceso a datos reales y puedes ejecutar acciones. "
            "Responde en español, sé conciso. Si necesitas ejecutar una acción hazlo "
            "sin pedir confirmación salvo que falten datos esenciales.\n\n" + ctx
        )
        messages = [{"role": "system", "content": system}]
        for h in (body.historial or []):
            messages.append({
                "role": "user" if h.get("rol") == "usuario" else "assistant",
                "content": h.get("contenido", ""),
            })
        messages.append({"role": "user", "content": body.mensaje})

        response = await _openai.chat.completions.create(
            model="gpt-4o", messages=messages,
            tools=[{"type": "function", "function": f} for f in IA_FUNCTIONS],
            tool_choice="auto",
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return ApiResponse(success=True, data={"respuesta": msg.content, "accion": None})

        acciones, tool_results = [], []
        for tc in msg.tool_calls:
            nombre    = tc.function.name
            args      = json.loads(tc.function.arguments)
            resultado = await ejecutar_tool(nombre, args, db, user.restaurante_id)
            acciones.append({"funcion": nombre, "args": args, "resultado": resultado})
            tool_results.append({"tool_call_id": tc.id, "role": "tool", "content": resultado})

        messages.append(msg)
        messages.extend(tool_results)
        followup = await _openai.chat.completions.create(model="gpt-4o", messages=messages)
        return ApiResponse(success=True, data={
            "respuesta": followup.choices[0].message.content,
            "accion": acciones[0] if acciones else None,
        })

    except Exception as e:
        logger.error(f"ia:chat_error {e}")
        return ApiResponse(success=False, data=None, error=f"Error del asistente: {e}")


@router.post("/informe", response_model=ApiResponse[dict])
async def informe_diario(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Informe narrativo diario completo con análisis financiero."""
    if not settings.OPENAI_API_KEY:
        return _NO_KEY_RESPONSE
    try:
        ctx   = await build_context(db, user.restaurante_id)
        datos = await get_datos_financieros(db, user.restaurante_id)
        prompt = (
            "Genera un informe diario completo. Incluye: ventas, gastos del día, beneficio neto, "
            "top productos, rendimiento del personal, horas pico y 3 recomendaciones concretas. "
            "Usa secciones con emojis. Sé conciso.\n\n" + ctx
        )
        resp = await _openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": f"Eres el asesor financiero de {settings.RESTAURANT_NAME}. Responde en español."},
                {"role": "user", "content": prompt},
            ],
        )
        return ApiResponse(success=True, data={"informe": resp.choices[0].message.content, "datos": datos})
    except Exception as e:
        logger.error(f"ia:informe_error {e}")
        return ApiResponse(success=False, error=f"Error: {e}", data=None)


@router.get("/sugerencias", response_model=ApiResponse[list])
async def sugerencias_dinamicas(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Chips de sugerencia contextuales según el estado del negocio."""
    try:
        hoy = await estadisticas_resumen(db, user.restaurante_id, "hoy")
        gas = await gastos_ctx(db, user.restaurante_id)
        v, c = hoy.get("ventas_total", 0), gas.get("coste_diario", 0)
        chips = ["¿Cuánto he ganado hoy?", "¿Qué plato vendo más?", "Dame el resumen de la semana"]
        if v < c:
            chips.insert(0, "¿Cuánto me falta para cubrir gastos?")
        elif v > c * 2:
            chips.insert(0, "¿Cuál es mi beneficio neto de hoy?")
        per = await personal_ctx(db, user.restaurante_id)
        if len(per) > 1:
            chips.append("¿Quién trabaja hoy?")
        chips.extend(["Añade a un empleado nuevo", "Registra un gasto"])
        return ApiResponse(success=True, data=chips[:6])
    except Exception as e:
        logger.error(f"ia:sugerencias_error {e}")
        return ApiResponse(success=True, data=["¿Cuánto he ganado hoy?", "¿Qué plato vendo más?", "Dame el resumen de la semana"])
