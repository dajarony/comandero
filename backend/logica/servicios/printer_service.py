"""
===============================================================
SUME DOCBLOCK v2.0
===============================================================
Archivo: logica/servicios/printer_service.py
Tipo: Servicio -> Generacion de tickets texto plano ESC/POS
Lineas: ~90 / 200 MAX
Dependencias: 0 (solo tipos nativos Python)

Acciones:
- generar_ticket_texto: Genera ticket imprimible (32 chars)
- _formatear_linea_item: Formatea una linea de producto
- _linea_precio: Alinea texto izq y precio der en 32 chars

Ultima Modificacion: 2026-03-15 | Dajarony
Cambio: Implementacion inicial servicio de impresion.
===============================================================
"""

from datetime import datetime
from config import get_settings

ANCHO = 32
SEPARADOR = "=" * ANCHO
SEPARADOR_FINO = "-" * ANCHO


def generar_ticket_texto(
    pedido: dict,
    mesa_numero: str,
    usuario_nombre: str,
) -> str:
    """Genera ticket en texto plano de 32 columnas."""
    fecha_dt = _parsear_fecha(pedido.get("created_at"))
    fecha_str = fecha_dt.strftime("%d/%m/%y")
    hora_str = fecha_dt.strftime("%H:%M")

    cabecera = _construir_cabecera(mesa_numero, usuario_nombre, fecha_str, hora_str)
    cuerpo = _construir_cuerpo(pedido.get("lineas", []))
    pie = _construir_pie(pedido.get("total", 0.0))

    return cabecera + cuerpo + pie


def _parsear_fecha(valor) -> datetime:
    """Parsea fecha ISO o devuelve ahora."""
    if isinstance(valor, datetime):
        return valor
    if isinstance(valor, str):
        try:
            return datetime.fromisoformat(valor)
        except ValueError:
            pass
    return datetime.now()


def _construir_cabecera(
    mesa: str, camarero: str, fecha: str, hora: str,
) -> str:
    """Construye cabecera del ticket (nombre + info)."""
    lineas = [
        SEPARADOR,
        get_settings().RESTAURANT_NAME.center(ANCHO),
        "Comandero Digital".center(ANCHO),
        SEPARADOR,
        _linea_dos_columnas(f"Mesa: {mesa}", f"Fecha: {fecha}"),
        _linea_dos_columnas(f"Cam: {camarero[:10]}", f"Hora: {hora}"),
        SEPARADOR_FINO,
    ]
    return "\n".join(lineas) + "\n"


def _construir_cuerpo(lineas: list[dict]) -> str:
    """Construye el listado de items del ticket."""
    resultado = []
    for linea in lineas:
        nombre = linea.get("item_nombre", "Item")
        cantidad = linea.get("cantidad", 1)
        precio = linea.get("precio_unitario", 0.0)
        nota = linea.get("nota")
        subtotal = cantidad * precio

        texto_item = f"{cantidad}x {nombre}"
        resultado.append(_linea_precio(texto_item, subtotal))

        if nota:
            resultado.append(f"   Nota: {nota[:25]}")

    return "\n".join(resultado) + "\n"


def _construir_pie(total: float) -> str:
    """Construye el pie del ticket con total y despedida."""
    lineas = [
        SEPARADOR_FINO,
        _linea_precio("TOTAL:", total),
        SEPARADOR,
        "Gracias por su visita".center(ANCHO),
        SEPARADOR,
    ]
    return "\n".join(lineas) + "\n"


def _linea_precio(texto: str, precio: float) -> str:
    """Alinea texto a la izq y precio a la derecha."""
    precio_str = f"{precio:.2f}E"
    espacio = ANCHO - len(texto) - len(precio_str)
    if espacio < 1:
        texto = texto[: ANCHO - len(precio_str) - 1]
        espacio = 1
    return texto + " " * espacio + precio_str


def _linea_dos_columnas(izq: str, der: str) -> str:
    """Dos textos alineados en 32 columnas."""
    espacio = ANCHO - len(izq) - len(der)
    if espacio < 1:
        espacio = 1
    return izq + " " * espacio + der
