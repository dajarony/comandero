"""
Test suite para endpoints de mesas.
Verifica: CRUD, estados, notas, liberacion.
"""
import asyncio
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from modelos.mesa import Mesa
from contratos.mesa import MesaResponse, MesaNotaUpdate, MesaEstado


def test_mesa_model_has_nota():
    """Mesa model should have nota field."""
    mesa = Mesa()
    assert hasattr(mesa, "nota"), "Mesa model missing 'nota' field"


def test_mesa_response_has_nota():
    """MesaResponse schema should include nota."""
    data = {
        "id": 1, "numero": "01", "estado": "LIBRE",
        "comensales": None, "hora_apertura": None,
        "total_cuenta": 0.0, "nota": "cumple cliente",
    }
    resp = MesaResponse(**data)
    assert resp.nota == "cumple cliente"


def test_mesa_response_nota_optional():
    """MesaResponse should work without nota."""
    data = {
        "id": 1, "numero": "01", "estado": "LIBRE",
        "comensales": None, "hora_apertura": None,
        "total_cuenta": 0.0,
    }
    resp = MesaResponse(**data)
    assert resp.nota is None


def test_mesa_nota_update_schema():
    """MesaNotaUpdate should validate nota field."""
    update = MesaNotaUpdate(nota="alergico gluten")
    assert update.nota == "alergico gluten"


def test_mesa_nota_update_none():
    """MesaNotaUpdate should accept None."""
    update = MesaNotaUpdate(nota=None)
    assert update.nota is None


def test_mesa_estado_enum():
    """MesaEstado should have 3 states."""
    assert MesaEstado.LIBRE == "LIBRE"
    assert MesaEstado.OCUPADA == "OCUPADA"
    assert MesaEstado.PENDIENTE_COBRO == "PENDIENTE_COBRO"


def test_mesa_response_from_orm():
    """MesaResponse should work with from_attributes."""
    mesa = Mesa()
    mesa.id = 1
    mesa.numero = "05"
    mesa.estado = "OCUPADA"
    mesa.comensales = 4
    mesa.hora_apertura = "14:30"
    mesa.total_cuenta = 25.50
    mesa.nota = "mesa VIP"

    resp = MesaResponse.model_validate(mesa)
    assert resp.numero == "05"
    assert resp.estado == MesaEstado.OCUPADA
    assert resp.comensales == 4
    assert resp.nota == "mesa VIP"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
