"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: entradas/routers/gastos.py
Tipo: Adaptador HTTP → Gastos
Líneas: ~115 / 200 MAX
Dependencias: 4 (fastapi, sqlalchemy, database, modelos)

Rutas:
  GET    /gastos/         → Lista gastos del restaurante
  POST   /gastos/         → Crea un gasto
  PUT    /gastos/{id}     → Actualiza gasto existente
  DELETE /gastos/{id}     → Elimina gasto
  GET    /gastos/resumen  → Totales y vencimientos próximos

Última Modificación: 2026-04-03 | Dajarony
Cambio: Implementación inicial CRUD de gastos.
═══════════════════════════════════════════════════════════
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import date

from database import get_db
from contratos.respuesta import ApiResponse
from modelos.gasto import Gasto
from modelos.usuario import Usuario
from seguridad.deps import get_current_user

router = APIRouter()

CATEGORIAS_VALIDAS = {"FIJO_MENSUAL", "NOMINA", "VARIABLE", "IRREGULAR"}


class GastoIn(BaseModel):
    nombre: str
    categoria: str
    importe: float
    dia_vencimiento: Optional[int] = None


@router.get("/", response_model=ApiResponse[list])
async def listar_gastos(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Lista todos los gastos del restaurante del usuario autenticado."""
    result = await db.execute(
        select(Gasto).where(Gasto.restaurante_id == user.restaurante_id)
    )
    gastos = result.scalars().all()
    data = [
        {
            "id": g.id, "nombre": g.nombre, "categoria": g.categoria,
            "importe": g.importe, "dia_vencimiento": g.dia_vencimiento,
            "activo": g.activo,
        }
        for g in gastos
    ]
    return ApiResponse(success=True, data=data)


@router.post("/", response_model=ApiResponse[dict])
async def crear_gasto(
    body: GastoIn,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Crea un nuevo gasto para el restaurante del usuario autenticado."""
    if body.categoria not in CATEGORIAS_VALIDAS:
        raise HTTPException(status_code=422, detail=f"Categoría inválida. Válidas: {CATEGORIAS_VALIDAS}")
    gasto = Gasto(
        restaurante_id=user.restaurante_id,
        nombre=body.nombre,
        categoria=body.categoria,
        importe=body.importe,
        dia_vencimiento=body.dia_vencimiento,
    )
    db.add(gasto)
    await db.commit()
    await db.refresh(gasto)
    return ApiResponse(success=True, data={"id": gasto.id, "nombre": gasto.nombre})


@router.put("/{gasto_id}", response_model=ApiResponse[dict])
async def actualizar_gasto(
    gasto_id: int,
    body: GastoIn,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Actualiza un gasto existente, verificando pertenencia al restaurante."""
    result = await db.execute(
        select(Gasto).where(Gasto.id == gasto_id, Gasto.restaurante_id == user.restaurante_id)
    )
    gasto = result.scalar_one_or_none()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    if body.categoria not in CATEGORIAS_VALIDAS:
        raise HTTPException(status_code=422, detail=f"Categoría inválida. Válidas: {CATEGORIAS_VALIDAS}")
    gasto.nombre = body.nombre
    gasto.categoria = body.categoria
    gasto.importe = body.importe
    gasto.dia_vencimiento = body.dia_vencimiento
    await db.commit()
    return ApiResponse(success=True, data={"id": gasto.id, "nombre": gasto.nombre})


@router.delete("/{gasto_id}", response_model=ApiResponse[dict])
async def eliminar_gasto(
    gasto_id: int,
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Elimina un gasto verificando pertenencia al restaurante."""
    result = await db.execute(
        select(Gasto).where(Gasto.id == gasto_id, Gasto.restaurante_id == user.restaurante_id)
    )
    gasto = result.scalar_one_or_none()
    if not gasto:
        raise HTTPException(status_code=404, detail="Gasto no encontrado")
    await db.delete(gasto)
    await db.commit()
    return ApiResponse(success=True, data={"eliminado": gasto_id})


@router.get("/resumen", response_model=ApiResponse[dict])
async def resumen_gastos(
    db: AsyncSession = Depends(get_db),
    user: Usuario = Depends(get_current_user),
):
    """Calcula totales, coste diario, agrupación por categoría y vencimientos próximos."""
    result = await db.execute(
        select(Gasto).where(Gasto.restaurante_id == user.restaurante_id, Gasto.activo == True)
    )
    gastos = result.scalars().all()

    total_mensual = sum(g.importe for g in gastos)
    coste_diario = round(total_mensual / 30, 2)

    por_categoria: dict = {}
    for g in gastos:
        por_categoria.setdefault(g.categoria, 0.0)
        por_categoria[g.categoria] = round(por_categoria[g.categoria] + g.importe, 2)

    hoy = date.today().day
    proximos = [
        {"id": g.id, "nombre": g.nombre, "importe": g.importe, "dia_vencimiento": g.dia_vencimiento}
        for g in gastos
        if g.dia_vencimiento is not None and 0 <= (g.dia_vencimiento - hoy) <= 7
    ]

    return ApiResponse(success=True, data={
        "total_mensual": round(total_mensual, 2),
        "coste_diario": coste_diario,
        "por_categoria": por_categoria,
        "proximos_vencimientos": proximos,
    })
