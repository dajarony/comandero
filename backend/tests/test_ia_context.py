"""
Test suite para ia_context — verifica que build_context es importable y pública.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

def test_build_context_es_importable():
    """build_context debe ser pública (sin guion bajo) e importable."""
    from logica.servicios.ia_context import build_context
    assert callable(build_context)

def test_funciones_publicas_existen():
    """gastos_ctx y personal_ctx son públicas; _historial_ctx sigue privada."""
    import logica.servicios.ia_context as m
    assert hasattr(m, "gastos_ctx")
    assert hasattr(m, "personal_ctx")
    assert hasattr(m, "_historial_ctx")
    assert hasattr(m, "get_datos_financieros")
