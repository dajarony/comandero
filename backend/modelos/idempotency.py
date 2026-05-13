from datetime import datetime
from typing import Any

from sqlalchemy import DateTime, Integer, JSON, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class IdempotencyRecord(Base):
    __tablename__ = "idempotency_records"
    __table_args__ = (
        UniqueConstraint("restaurante_id", "idempotency_key", name="uq_idempotency_restaurante_key"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    restaurante_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    idempotency_key: Mapped[str] = mapped_column(String(128), nullable=False)
    method: Mapped[str] = mapped_column(String(10), nullable=False)
    endpoint: Mapped[str] = mapped_column(String(255), nullable=False)
    response_data: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
