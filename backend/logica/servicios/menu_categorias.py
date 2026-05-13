"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: logica/servicios/menu_categorias.py
Tipo: Constantes → Categorías y emojis del menú
Líneas: ~70 / 200 MAX
Dependencias: 0

S (Setup): Listas de categorías conocidas + mapeo emojis.
U (Use):   categorizar_mock() — heurística sin IA.
M (Manage): Diccionario palabras clave → categoría.
E (Error):  Ninguno (fallback siempre a "Otros").

Última Modificación: 2026-03-17 | Auditoría
Cambio: Extraído de menu_ingest_service.py para respetar 200 líneas.
═══════════════════════════════════════════════════════════
"""

CATEGORIAS_CONOCIDAS = [
    "Bebidas", "Cervezas", "Vinos", "Refrescos", "Cafés",
    "Carnes", "Pescados", "Ensaladas", "Sopas",
    "Postres", "Hamburguesas", "Tapas", "Bocadillos", "Fritos",
    "Sandwiches", "Pizzas", "Pasta", "Aperitivos", "Paellas",
    "Flambeados", "Especialidades",
    "Otros",
]

EMOJIS_CATEGORIA = {
    "Bebidas": "🍹", "Cervezas": "🍺", "Vinos": "🍷",
    "Refrescos": "🥤", "Cafés": "☕", "Carnes": "🥩",
    "Pescados": "🐟", "Ensaladas": "🥗", "Sopas": "🍲",
    "Postres": "🍮", "Hamburguesas": "🍔", "Tapas": "🫓",
    "Bocadillos": "🥪", "Fritos": "🍟", "Sandwiches": "🥪",
    "Pizzas": "🍕", "Pasta": "🍝", "Aperitivos": "🍗",
    "Paellas": "🥘", "Flambeados": "🔥", "Especialidades": "⭐",
    "Otros": "🍽️",
}

_PALABRAS_CLAVE = {
    "Cervezas": ["cerveza", "caña", "tercer", "estrella", "mahou"],
    "Vinos": ["vino", "cava", "rioja", "albariño", "rosado"],
    "Refrescos": ["coca-cola", "fanta", "sprite", "tónica", "agua", "refresco"],
    "Cafés": ["café", "cortado", "cappuccino", "latte", "té", "infusión"],
    "Carnes": ["carne", "filete", "entrecot", "pollo", "cerdo", "ternera", "solomillo"],
    "Pescados": ["pescado", "merluza", "salmón", "bacalao", "pulpo", "gambas"],
    "Ensaladas": ["ensalada", "verde", "mixta", "césar"],
    "Sopas": ["sopa", "caldo", "crema", "gazpacho"],
    "Hamburguesas": ["hamburguesa", "burger"],
    "Tapas": ["tapa", "pincho", "ración", "croqueta"],
    "Fritos": ["frito", "patatas", "rebozado", "calamares"],
    "Postres": ["postre", "tarta", "helado", "flan", "tiramisú"],
}


def categorizar_mock(items: list[dict]) -> list[dict]:
    """Categorización heurística sin IA — modo desarrollo."""
    resultado = []
    for item in items:
        nombre_lower = item["nombre"].lower()
        categoria = "Otros"
        for cat, palabras in _PALABRAS_CLAVE.items():
            if any(p in nombre_lower for p in palabras):
                categoria = cat
                break
        resultado.append({**item, "categoria": categoria})
    return resultado
