from collections.abc import Awaitable, Callable
from typing import TypeVar

from fastapi import HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from modelos.idempotency import IdempotencyRecord

T = TypeVar("T")
PENDING_RESPONSE = {"_status": "pending"}


async def ejecutar_idempotente(
    db: AsyncSession,
    idempotency_key: str | None,
    restaurante_id: int,
    method: str,
    endpoint: str,
    operacion: Callable[[], Awaitable[T]],
) -> T:
    if not idempotency_key:
        return await operacion()

    key = idempotency_key.strip()
    if not key or len(key) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Idempotency-Key invalida",
        )

    existing = await _buscar_registro(db, restaurante_id, key)
    if existing:
        if existing.response_data == PENDING_RESPONSE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Solicitud idempotente ya en proceso",
            )
        return existing.response_data  # type: ignore[return-value]

    record = IdempotencyRecord(
        restaurante_id=restaurante_id,
        idempotency_key=key,
        method=method,
        endpoint=endpoint,
        response_data=PENDING_RESPONSE,
    )
    db.add(record)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        existing = await _buscar_registro(db, restaurante_id, key)
        if existing and existing.response_data != PENDING_RESPONSE:
            return existing.response_data  # type: ignore[return-value]
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solicitud idempotente ya en proceso",
        )

    try:
        resultado = await operacion()
    except Exception:
        await db.delete(record)
        await db.commit()
        raise

    record.response_data = jsonable_encoder(resultado)
    db.add(record)
    await db.commit()
    return resultado


async def _buscar_registro(
    db: AsyncSession,
    restaurante_id: int,
    idempotency_key: str,
) -> IdempotencyRecord | None:
    return await db.scalar(
        select(IdempotencyRecord).where(
            IdempotencyRecord.restaurante_id == restaurante_id,
            IdempotencyRecord.idempotency_key == idempotency_key,
        )
    )
