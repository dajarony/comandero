"""
Test suite para schemas de pedidos.
Verifica: contratos, validaciones, estados (ABIERTO/RETENIDO/MARCHADO/CERRADO).
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from contratos.pedido import (
    PedidoEstado, LineaPedidoCreate, PedidoCreate,
    LineaPedidoResponse, PedidoResponse,
)


def test_pedido_estados():
    """PedidoEstado should have 4 states including RETENIDO."""
    assert PedidoEstado.ABIERTO == "ABIERTO"
    assert PedidoEstado.RETENIDO == "RETENIDO"
    assert PedidoEstado.MARCHADO == "MARCHADO"
    assert PedidoEstado.CERRADO == "CERRADO"


def test_linea_pedido_create():
    """LineaPedidoCreate should validate."""
    linea = LineaPedidoCreate(item_menu_id=1, cantidad=2, nota="sin sal")
    assert linea.item_menu_id == 1
    assert linea.cantidad == 2
    assert linea.nota == "sin sal"


def test_linea_pedido_create_min_cantidad():
    """LineaPedidoCreate should reject cantidad < 1."""
    with pytest.raises(Exception):
        LineaPedidoCreate(item_menu_id=1, cantidad=0)


def test_pedido_create():
    """PedidoCreate should validate with lineas."""
    pedido = PedidoCreate(
        mesa_id=1,
        lineas=[LineaPedidoCreate(item_menu_id=1, cantidad=2)],
    )
    assert pedido.mesa_id == 1
    assert len(pedido.lineas) == 1


def test_pedido_create_empty_lineas():
    """PedidoCreate should reject empty lineas."""
    with pytest.raises(Exception):
        PedidoCreate(mesa_id=1, lineas=[])


def test_linea_pedido_response():
    """LineaPedidoResponse should work."""
    data = {
        "id": 1, "item_menu_id": 5,
        "item_nombre": "Cerveza", "item_emoji": "🍺",
        "cantidad": 2, "precio_unitario": 3.50, "nota": None,
    }
    resp = LineaPedidoResponse(**data)
    assert resp.item_nombre == "Cerveza"
    assert resp.precio_unitario == 3.50


def test_pedido_response_with_destino():
    """PedidoResponse should include destino field."""
    data = {
        "id": 1, "mesa_id": 3, "usuario_id": 1,
        "estado": "MARCHADO", "destino": "COCINA",
        "total": 7.00, "notas": None,
        "created_at": "2026-03-15T14:00:00",
        "lineas": [{
            "id": 1, "item_menu_id": 5,
            "item_nombre": "Cerveza", "item_emoji": "🍺",
            "cantidad": 2, "precio_unitario": 3.50, "nota": None,
        }],
    }
    resp = PedidoResponse(**data)
    assert resp.estado == PedidoEstado.MARCHADO
    assert resp.destino == "COCINA"
    assert len(resp.lineas) == 1


def test_pedido_response_destino_barra():
    """PedidoResponse should accept BARRA as destino."""
    data = {
        "id": 2, "mesa_id": 3, "usuario_id": 1,
        "estado": "MARCHADO", "destino": "BARRA",
        "total": 4.55, "notas": None,
    }
    resp = PedidoResponse(**data)
    assert resp.destino == "BARRA"


def test_pedido_response_retenido():
    """PedidoResponse should accept RETENIDO state."""
    data = {
        "id": 1, "mesa_id": 3, "usuario_id": 1,
        "estado": "RETENIDO", "total": 0.0,
        "notas": None,
    }
    resp = PedidoResponse(**data)
    assert resp.estado == PedidoEstado.RETENIDO
    assert resp.destino is None


def test_pedido_response_destino_optional():
    """PedidoResponse should work without destino."""
    data = {
        "id": 1, "mesa_id": 3, "usuario_id": 1,
        "estado": "ABIERTO", "total": 0.0,
        "notas": None,
    }
    resp = PedidoResponse(**data)
    assert resp.destino is None
    assert resp.lineas == []


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
