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
