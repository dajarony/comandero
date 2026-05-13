"""
Test suite para verificar que routers se cargan correctamente.
Verifica: imports, numero de rutas, endpoints, nuevos servicios.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


def test_mesas_router_routes():
    """Mesas router should have 6 routes."""
    from entradas.routers.mesas import router
    assert len(router.routes) == 6


def test_pedidos_router_routes():
    """Pedidos router should have 8 routes (6 + retener + liberar)."""
    from entradas.routers.pedidos import router
    assert len(router.routes) == 8


def test_auth_router_routes():
    """Auth router should have routes."""
    from entradas.routers.auth import router
    assert len(router.routes) >= 2


def test_menu_router_routes():
    """Menu router should have routes."""
    from entradas.routers.menu import router
    assert len(router.routes) >= 3


def test_stats_router_routes():
    """Stats router should have at least 1 route."""
    from entradas.routers.stats import router
    assert len(router.routes) >= 1


def test_mesa_service_imports():
    """Mesa service functions should import."""
    from logica.mesa_service import (
        listar_mesas, obtener_mesa, abrir_mesa,
        liberar_mesa, cambiar_estado, actualizar_nota_mesa,
    )
    assert callable(actualizar_nota_mesa)


def test_pedido_service_imports():
    """Pedido service should include retener and liberar."""
    from logica.pedido_service import (
        crear_pedido, obtener_pedido, listar_por_mesa,
        marchar_pedido, cerrar_pedido,
        retener_pedido, liberar_pedido,
    )
    assert callable(retener_pedido)
    assert callable(liberar_pedido)


def test_pedido_model_has_destino():
    """Pedido model should have destino field."""
    from modelos.pedido import Pedido
    pedido = Pedido()
    assert hasattr(pedido, "destino")


def test_models_import():
    """All models should import."""
    from modelos.mesa import Mesa
    from modelos.pedido import Pedido, LineaPedido
    from modelos.menu import Categoria, MenuItem
    from modelos.usuario import Usuario
    assert Mesa.__tablename__ == "mesas"
    assert Pedido.__tablename__ == "pedidos"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v"])
