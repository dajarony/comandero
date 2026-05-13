# Modularización ia.py + Fix Bug 503 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Dividir `entradas/routers/ia.py` (335 líneas) en 3 archivos SUME-compliant y corregir el bug de contrato 503.

**Architecture:** Extraer lógica pura a `logica/servicios/ia_context.py` (contexto DB) y `logica/servicios/ia_tools.py` (tools OpenAI + ejecutores). El router `ia.py` queda solo con schemas + endpoints. Bug 503 se corrige devolviendo JSONResponse con estructura ApiResponse en lugar de HTTPException desnudo.

**Tech Stack:** FastAPI, SQLAlchemy async, OpenAI AsyncOpenAI, Pydantic, pytest

---

### Task 1: Crear `logica/servicios/ia_context.py`

**Files:**
- Create: `backend/logica/servicios/ia_context.py`
- Test: `backend/tests/test_ia_context.py`

**Step 1: Escribir el test que falla**

Crear `backend/tests/test_ia_context.py`:

```python
"""
Test suite para ia_context — verifica que build_context es importable y pública.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

def test_build_context_es_importable():
    """build_context debe ser pública (sin guion bajo) e importable."""
    from logica.servicios.ia_context import build_context
    assert callable(build_context)

def test_funciones_privadas_existen():
    """Las tres queries privadas deben existir en el módulo."""
    import logica.servicios.ia_context as m
    assert hasattr(m, "_gastos_ctx")
    assert hasattr(m, "_personal_ctx")
    assert hasattr(m, "_historial_ctx")
```

**Step 2: Verificar que el test falla**

```bash
cd backend
pytest tests/test_ia_context.py -v
```
Resultado esperado: `ImportError: cannot import name 'build_context'`

**Step 3: Crear el archivo**

Crear `backend/logica/servicios/ia_context.py`:

```python
"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/servicios/ia_context.py
Tipo: Servicio → Contexto de negocio para IA
Líneas: ~55 / 200 MAX

Entradas : db (AsyncSession), restaurante_id (int)
Acciones : Consulta gastos, personal e historial de pedidos
Salidas  : str — bloque de contexto listo para GPT-4o

Logs Generados:
  ia_context:build_start (debug)
  ia_context:build_error (error)

Última Modificación: 2026-04-04 | Dajarony
Cambio: Extraído de entradas/routers/ia.py para cumplir SUME 200L.
═══════════════════════════════════════════════════════════
"""

import json
from datetime import datetime, date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from modelos.usuario import Usuario
from modelos.gasto import Gasto
from modelos.pedido import Pedido
from logica.servicios.stats_service import estadisticas_resumen
from config import get_settings
from seguridad.logger import obtener_logger

logger   = obtener_logger("ia_context")
settings = get_settings()


async def _gastos_ctx(db: AsyncSession, rid: int) -> dict:
    rows = (await db.execute(
        select(Gasto).where(Gasto.restaurante_id == rid, Gasto.activo == True)
    )).scalars().all()
    total = sum(g.importe for g in rows)
    return {
        "total_mensual": round(total, 2),
        "coste_diario":  round(total / 30, 2),
        "detalle": [
            {"id": g.id, "nombre": g.nombre, "categoria": g.categoria, "importe": g.importe}
            for g in rows
        ],
    }


async def _personal_ctx(db: AsyncSession, rid: int) -> list:
    rows = (await db.execute(
        select(Usuario).where(Usuario.restaurante_id == rid, Usuario.activo == True)
    )).scalars().all()
    return [{"id": u.id, "nombre": u.nombre, "rol": u.rol, "email": u.email} for u in rows]


async def _historial_ctx(db: AsyncSession, rid: int) -> list:
    hace7 = datetime.now() - timedelta(days=7)
    rows = (await db.execute(
        select(Pedido)
        .where(Pedido.restaurante_id == rid, Pedido.estado == "CERRADO", Pedido.created_at >= hace7)
        .order_by(Pedido.created_at.desc()).limit(20)
    )).scalars().all()
    return [
        {"id": p.id, "mesa": p.mesa_id, "total": p.total, "propina": p.propina,
         "metodo_pago": p.metodo_pago, "fecha": p.created_at.strftime("%d/%m %H:%M")}
        for p in rows
    ]


async def build_context(db: AsyncSession, rid: int) -> str:
    """Construye el string de contexto completo que recibe GPT-4o."""
    logger.debug(f"ia_context:build_start restaurante_id={rid}")
    hoy  = await estadisticas_resumen(db, rid, "hoy")
    sem  = await estadisticas_resumen(db, rid, "semana")
    gas  = await _gastos_ctx(db, rid)
    per  = await _personal_ctx(db, rid)
    hist = await _historial_ctx(db, rid)
    v    = hoy.get("ventas_total", 0)
    cd   = gas.get("coste_diario", 0)
    return (
        f"=== {settings.RESTAURANT_NAME} | {date.today().strftime('%A %d/%m/%Y')} ===\n"
        f"VENTAS HOY: {json.dumps(hoy, ensure_ascii=False)}\n"
        f"VENTAS SEMANA: ventas={sem['ventas_total']}€ pedidos={sem['pedidos_count']}\n"
        f"GASTOS: {json.dumps(gas, ensure_ascii=False)}\n"
        f"FINANZAS: ventas={v}€ coste_dia={cd}€ benef_bruto={round(v-cd,2)}€ "
        f"reserva_iva={round(v*0.1,2)}€ benef_neto={round(v-cd-v*0.1,2)}€\n"
        f"PERSONAL ({len(per)} activos): {json.dumps(per, ensure_ascii=False)}\n"
        f"HISTORIAL 7d: {json.dumps(hist, ensure_ascii=False)}"
    )
```

**Step 4: Verificar que el test pasa**

```bash
pytest tests/test_ia_context.py -v
```
Resultado esperado: `2 passed`

**Step 5: Commit**

```bash
git add logica/servicios/ia_context.py tests/test_ia_context.py
git commit -m "feat: extraer ia_context.py — contexto DB para GPT-4o (SUME)"
```

---

### Task 2: Crear `logica/servicios/ia_tools.py`

**Files:**
- Create: `backend/logica/servicios/ia_tools.py`
- Test: `backend/tests/test_ia_tools.py`

**Step 1: Escribir el test que falla**

Crear `backend/tests/test_ia_tools.py`:

```python
"""
Test suite para ia_tools — verifica schemas OpenAI y función pública ejecutar_tool.
"""
import sys, os, pytest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

def test_ia_functions_es_lista():
    from logica.servicios.ia_tools import IA_FUNCTIONS
    assert isinstance(IA_FUNCTIONS, list)
    assert len(IA_FUNCTIONS) == 4

def test_ia_functions_tienen_schema_openai():
    from logica.servicios.ia_tools import IA_FUNCTIONS
    nombres = {f["name"] for f in IA_FUNCTIONS}
    assert nombres == {"crear_empleado", "desactivar_empleado", "registrar_gasto", "eliminar_gasto"}
    for f in IA_FUNCTIONS:
        assert "description" in f
        assert "parameters" in f

def test_ejecutar_tool_es_importable():
    from logica.servicios.ia_tools import ejecutar_tool
    assert callable(ejecutar_tool)

@pytest.mark.asyncio
async def test_ejecutar_tool_funcion_inexistente():
    """ejecutar_tool debe devolver mensaje de error si la función no existe."""
    from logica.servicios.ia_tools import ejecutar_tool
    result = await ejecutar_tool("funcion_inventada", {}, None, 1)
    assert "no disponible" in result
```

**Step 2: Verificar que el test falla**

```bash
pytest tests/test_ia_tools.py -v
```
Resultado esperado: `ImportError: cannot import name 'IA_FUNCTIONS'`

**Step 3: Crear el archivo**

Crear `backend/logica/servicios/ia_tools.py`:

```python
"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/servicios/ia_tools.py
Tipo: Servicio → Tools de OpenAI + ejecutores de acciones
Líneas: ~75 / 200 MAX

Entradas : nombre (str), args (dict), db (AsyncSession), restaurante_id (int)
Acciones : Define schemas para GPT-4o; ejecuta acciones reales en DB
Salidas  : str — resultado legible de la acción ejecutada

Funciones públicas:
  IA_FUNCTIONS   → lista de schemas para GPT-4o
  ejecutar_tool  → despacha a ejecutor por nombre

Logs Generados:
  ia_tools:exec_start (debug)
  ia_tools:exec_error (error)

Última Modificación: 2026-04-04 | Dajarony
Cambio: Extraído de entradas/routers/ia.py para cumplir SUME 200L.
═══════════════════════════════════════════════════════════
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from modelos.usuario import Usuario
from modelos.gasto import Gasto
from contratos.usuario import UsuarioCreate, RolUsuario
from logica.auth_service import registrar_usuario
from seguridad.logger import obtener_logger

logger = obtener_logger("ia_tools")

# ── Schemas para GPT-4o ──────────────────────────────────

IA_FUNCTIONS = [
    {
        "name": "crear_empleado",
        "description": "Añade un nuevo empleado al restaurante (camarero, cocinero o admin).",
        "parameters": {
            "type": "object",
            "properties": {
                "nombre":   {"type": "string", "description": "Nombre completo del empleado"},
                "email":    {"type": "string", "description": "Email del empleado (usuario de login)"},
                "password": {"type": "string", "description": "Contraseña inicial (mínimo 8 caracteres)"},
                "rol":      {"type": "string", "enum": ["CAMARERO", "COCINA", "ADMIN"]},
            },
            "required": ["nombre", "email", "password", "rol"],
        },
    },
    {
        "name": "desactivar_empleado",
        "description": "Desactiva un empleado existente (pierde acceso al sistema).",
        "parameters": {
            "type": "object",
            "properties": {
                "usuario_id": {"type": "integer", "description": "ID numérico del empleado"},
            },
            "required": ["usuario_id"],
        },
    },
    {
        "name": "registrar_gasto",
        "description": "Registra un gasto del negocio (alquiler, nómina, luz, etc.).",
        "parameters": {
            "type": "object",
            "properties": {
                "nombre":          {"type": "string"},
                "categoria":       {"type": "string", "enum": ["FIJO_MENSUAL", "NOMINA", "VARIABLE", "IRREGULAR"]},
                "importe":         {"type": "number", "description": "Importe en euros"},
                "dia_vencimiento": {"type": "integer", "description": "Día del mes (1-31), opcional"},
            },
            "required": ["nombre", "categoria", "importe"],
        },
    },
    {
        "name": "eliminar_gasto",
        "description": "Elimina un gasto registrado por su ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "gasto_id": {"type": "integer", "description": "ID del gasto a eliminar"},
            },
            "required": ["gasto_id"],
        },
    },
]

# ── Ejecutores privados ──────────────────────────────────

async def _exec_crear_empleado(args: dict, db: AsyncSession, rid: int) -> str:
    try:
        datos = UsuarioCreate(
            nombre=args["nombre"], email=args["email"],
            password=args["password"], rol=RolUsuario(args["rol"]),
            restaurante_id=rid,
        )
        u = await registrar_usuario(db, datos)
        return f"✅ Empleado '{u.nombre}' creado con rol {u.rol}. Email: {u.email}"
    except Exception as e:
        logger.error(f"ia_tools:exec_error crear_empleado {e}")
        return f"❌ No se pudo crear el empleado: {e}"


async def _exec_desactivar_empleado(args: dict, db: AsyncSession, rid: int) -> str:
    uid = args["usuario_id"]
    row = (await db.execute(
        select(Usuario).where(Usuario.id == uid, Usuario.restaurante_id == rid)
    )).scalar_one_or_none()
    if not row:
        return f"❌ No existe empleado con ID {uid} en este restaurante."
    row.activo = False
    await db.commit()
    return f"✅ Empleado '{row.nombre}' desactivado correctamente."


async def _exec_registrar_gasto(args: dict, db: AsyncSession, rid: int) -> str:
    g = Gasto(
        restaurante_id=rid, nombre=args["nombre"],
        categoria=args["categoria"], importe=args["importe"],
        dia_vencimiento=args.get("dia_vencimiento"),
    )
    db.add(g)
    await db.commit()
    return f"✅ Gasto '{g.nombre}' registrado: {g.importe}€ ({g.categoria})"


async def _exec_eliminar_gasto(args: dict, db: AsyncSession, rid: int) -> str:
    gid = args["gasto_id"]
    row = (await db.execute(
        select(Gasto).where(Gasto.id == gid, Gasto.restaurante_id == rid)
    )).scalar_one_or_none()
    if not row:
        return f"❌ No existe gasto con ID {gid}."
    await db.delete(row)
    await db.commit()
    return f"✅ Gasto '{row.nombre}' eliminado."


_EJECUTORES = {
    "crear_empleado":      _exec_crear_empleado,
    "desactivar_empleado": _exec_desactivar_empleado,
    "registrar_gasto":     _exec_registrar_gasto,
    "eliminar_gasto":      _exec_eliminar_gasto,
}

# ── Dispatcher público ───────────────────────────────────

async def ejecutar_tool(nombre: str, args: dict, db: AsyncSession, rid: int) -> str:
    """Despacha al ejecutor correspondiente. Devuelve error legible si no existe."""
    logger.debug(f"ia_tools:exec_start fn={nombre}")
    executor = _EJECUTORES.get(nombre)
    if not executor:
        return f"❌ Función '{nombre}' no disponible en este asistente."
    return await executor(args, db, rid)
```

**Step 4: Verificar que los tests pasan**

```bash
pytest tests/test_ia_tools.py -v
```
Resultado esperado: `4 passed`

**Step 5: Commit**

```bash
git add logica/servicios/ia_tools.py tests/test_ia_tools.py
git commit -m "feat: extraer ia_tools.py — tools OpenAI + ejecutores (SUME)"
```

---

### Task 3: Reescribir `entradas/routers/ia.py`

**Files:**
- Modify: `backend/entradas/routers/ia.py` (reescribir completo)

**Step 1: Reemplazar el contenido completo**

Sobreescribir `backend/entradas/routers/ia.py` con:

```python
"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/ia.py
Tipo: Adaptador HTTP → Asistente IA
Líneas: ~100 / 200 MAX

Rutas:
  POST /ia/chat        → Chat + function calling con GPT-4o
  POST /ia/informe     → Informe narrativo diario completo
  GET  /ia/sugerencias → Chips contextuales según negocio

Dependencias:
  logica.servicios.ia_context → build_context
  logica.servicios.ia_tools   → IA_FUNCTIONS, ejecutar_tool

Última Modificación: 2026-04-04 | Dajarony
Cambio: Refactor SUME — router queda solo con schemas + endpoints.
         Fix bug 503: HTTPException → JSONResponse con ApiResponse.
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
from logica.servicios.ia_context import build_context, _gastos_ctx, _personal_ctx
from logica.servicios.ia_tools import IA_FUNCTIONS, ejecutar_tool
from logica.servicios.stats_service import estadisticas_resumen
from seguridad.deps import get_current_user
from seguridad.logger import obtener_logger

router   = APIRouter()
logger   = obtener_logger("ia")
settings = get_settings()

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

        client   = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o", messages=messages,
            tools=[{"type": "function", "function": f} for f in IA_FUNCTIONS],
            tool_choice="auto",
        )
        msg = response.choices[0].message

        if not msg.tool_calls:
            return ApiResponse(success=True, data={"respuesta": msg.content, "accion": None})

        acciones, tool_results = [], []
        for tc in msg.tool_calls:
            nombre   = tc.function.name
            args     = json.loads(tc.function.arguments)
            resultado = await ejecutar_tool(nombre, args, db, user.restaurante_id)
            acciones.append({"funcion": nombre, "args": args, "resultado": resultado})
            tool_results.append({"tool_call_id": tc.id, "role": "tool", "content": resultado})

        messages.append(msg)
        messages.extend(tool_results)
        followup = await client.chat.completions.create(model="gpt-4o", messages=messages)
        return ApiResponse(success=True, data={
            "respuesta": followup.choices[0].message.content,
            "accion": acciones[0] if acciones else None,
        })

    except Exception as e:
        logger.error(f"ia:chat_error {e}")
        return ApiResponse(success=True, data={"respuesta": f"Error del asistente: {e}", "accion": None})


@router.post("/informe", response_model=ApiResponse[dict])
async def informe_diario(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Informe narrativo diario completo con análisis financiero."""
    if not settings.OPENAI_API_KEY:
        return _NO_KEY_RESPONSE
    try:
        ctx  = await build_context(db, user.restaurante_id)
        hoy  = await estadisticas_resumen(db, user.restaurante_id, "hoy")
        gas  = await _gastos_ctx(db, user.restaurante_id)
        v, c = hoy.get("ventas_total", 0), gas.get("coste_diario", 0)
        datos = {
            "ventas": v, "coste_diario": c,
            "beneficio_bruto": round(v - c, 2),
            "reserva_iva": round(v * 0.1, 2),
            "beneficio_neto": round(v - c - v * 0.1, 2),
        }
        prompt = (
            "Genera un informe diario completo. Incluye: ventas, gastos del día, beneficio neto, "
            "top productos, rendimiento del personal, horas pico y 3 recomendaciones concretas. "
            "Usa secciones con emojis. Sé conciso.\n\n" + ctx
        )
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        resp   = await client.chat.completions.create(
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
    hoy = await estadisticas_resumen(db, user.restaurante_id, "hoy")
    gas = await _gastos_ctx(db, user.restaurante_id)
    v, c = hoy.get("ventas_total", 0), gas.get("coste_diario", 0)
    chips = ["¿Cuánto he ganado hoy?", "¿Qué plato vendo más?", "Dame el resumen de la semana"]
    if v < c:
        chips.insert(0, "¿Cuánto me falta para cubrir gastos?")
    elif v > c * 2:
        chips.insert(0, "¿Cuál es mi beneficio neto de hoy?")
    per = await _personal_ctx(db, user.restaurante_id)
    if len(per) > 1:
        chips.append("¿Quién trabaja hoy?")
    chips.extend(["Añade a un empleado nuevo", "Registra un gasto"])
    return ApiResponse(success=True, data=chips[:6])
```

**Step 2: Verificar líneas de los 3 archivos**

```bash
wc -l logica/servicios/ia_context.py logica/servicios/ia_tools.py entradas/routers/ia.py
```
Resultado esperado: los 3 por debajo de 200 líneas.

**Step 3: Commit**

```bash
git add entradas/routers/ia.py
git commit -m "refactor: ia.py → solo endpoints, importa de ia_context + ia_tools (SUME fix)"
```

---

### Task 4: Verificación final

**Step 1: Ejecutar todos los tests**

```bash
cd backend
pytest tests/ -v
```
Resultado esperado: todos los tests en verde, incluyendo `test_ia_context.py` y `test_ia_tools.py`.

**Step 2: Verificar conteo de líneas final**

```bash
wc -l entradas/routers/ia.py logica/servicios/ia_context.py logica/servicios/ia_tools.py
```
Resultado esperado: ninguno supera 200.

**Step 3: Deploy a Cloud Run**

```bash
cd ..
gcloud builds submit --config backend/cloudbuild.yaml
```

**Step 4: Commit final con deploy**

```bash
git add docs/plans/
git commit -m "docs: plan modularizacion ia.py + fix 503"
```
