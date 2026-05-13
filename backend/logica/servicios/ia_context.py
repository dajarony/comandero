"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/servicios/ia_context.py
Tipo: Servicio → Contexto de negocio para IA
Líneas: ~80 / 200 MAX

Entradas : db (AsyncSession), restaurante_id (int)
Acciones : Consulta gastos, personal e historial de pedidos
Salidas  : str — bloque de contexto listo para GPT-4o

Funciones públicas:
  gastos_ctx           → dict con resumen de gastos
  personal_ctx         → list con personal activo
  build_context        → str contexto completo para GPT-4o
  get_datos_financieros → dict resumen financiero del día

Logs Generados:
  ia_context:build_start (debug)
  ia_context:build_error (error)

Última Modificación: 2026-04-04 | Dajarony
Cambio: Renombrar privadas a públicas, try/except en build_context,
        nueva función get_datos_financieros.
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


async def gastos_ctx(db: AsyncSession, rid: int) -> dict:
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


async def personal_ctx(db: AsyncSession, rid: int) -> list:
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
    try:
        logger.debug(f"ia_context:build_start restaurante_id={rid}")
        hoy  = await estadisticas_resumen(db, rid, "hoy")
        sem  = await estadisticas_resumen(db, rid, "semana")
        gas  = await gastos_ctx(db, rid)
        per  = await personal_ctx(db, rid)
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
    except Exception as e:
        logger.error(f"ia_context:build_error {e}")
        raise


async def get_datos_financieros(db: AsyncSession, rid: int) -> dict:
    """Devuelve resumen financiero del día para el informe."""
    hoy = await estadisticas_resumen(db, rid, "hoy")
    gas = await gastos_ctx(db, rid)
    v   = hoy.get("ventas_total", 0)
    c   = gas.get("coste_diario", 0)
    return {
        "ventas":          v,
        "coste_diario":    c,
        "beneficio_bruto": round(v - c, 2),
        "reserva_iva":     round(v * 0.1, 2),
        "beneficio_neto":  round(v - c - v * 0.1, 2),
    }
