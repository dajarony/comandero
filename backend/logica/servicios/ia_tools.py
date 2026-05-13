"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/servicios/ia_tools.py
Tipo: Servicio → Tools de OpenAI + ejecutores de acciones
Líneas: ~130 / 200 MAX

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
        u = await registrar_usuario(db, datos, rid)
        return f"✅ Empleado '{u.nombre}' creado con rol {u.rol}. Email: {u.email}"
    except Exception as e:
        logger.error(f"ia_tools:exec_error crear_empleado {e}")
        return f"❌ No se pudo crear el empleado: {e}"


async def _exec_desactivar_empleado(args: dict, db: AsyncSession, rid: int) -> str:
    try:
        uid = args["usuario_id"]
        row = (await db.execute(
            select(Usuario).where(Usuario.id == uid, Usuario.restaurante_id == rid)
        )).scalar_one_or_none()
        if not row:
            return f"❌ No existe empleado con ID {uid} en este restaurante."
        row.activo = False
        await db.commit()
        return f"✅ Empleado '{row.nombre}' desactivado correctamente."
    except Exception as e:
        logger.error(f"ia_tools:exec_error desactivar_empleado {e}")
        return f"❌ Error al desactivar empleado: {e}"


async def _exec_registrar_gasto(args: dict, db: AsyncSession, rid: int) -> str:
    try:
        g = Gasto(
            restaurante_id=rid, nombre=args["nombre"],
            categoria=args["categoria"], importe=args["importe"],
            dia_vencimiento=args.get("dia_vencimiento"),
        )
        db.add(g)
        await db.commit()
        return f"✅ Gasto '{g.nombre}' registrado: {g.importe}€ ({g.categoria})"
    except Exception as e:
        logger.error(f"ia_tools:exec_error registrar_gasto {e}")
        return f"❌ Error al registrar gasto: {e}"


async def _exec_eliminar_gasto(args: dict, db: AsyncSession, rid: int) -> str:
    try:
        gid = args["gasto_id"]
        row = (await db.execute(
            select(Gasto).where(Gasto.id == gid, Gasto.restaurante_id == rid)
        )).scalar_one_or_none()
        if not row:
            return f"❌ No existe gasto con ID {gid}."
        await db.delete(row)
        await db.commit()
        return f"✅ Gasto '{row.nombre}' eliminado."
    except Exception as e:
        logger.error(f"ia_tools:exec_error eliminar_gasto {e}")
        return f"❌ Error al eliminar gasto: {e}"


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
