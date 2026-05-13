"""
═══════════════════════════════════════════════════════════
SUME DOCBLOCK v2.0
═══════════════════════════════════════════════════════════
Archivo: seeds/seed_menu.py
Tipo: Datos → Catálogo de Bebidas y Vinos
Líneas: ~160 / 200 MAX
Dependencias: 0

Datos del menú de bebidas y vinos del restaurante Caribe.
Cada categoría tiene emoji + orden, cada item tiene
(nombre, precio, emoji).

Última Modificación: 2026-03-15 | Dajarony
Cambio: Menú completo de bebidas y vinos.
═══════════════════════════════════════════════════════════
"""

# ═══ Categorías de Bebidas y Vinos ═══
CATEGORIAS = [
    {"nombre": "Cervezas", "emoji": "🍺", "orden": 1},
    {"nombre": "Refrescos", "emoji": "🥤", "orden": 2},
    {"nombre": "Zumos", "emoji": "🧃", "orden": 3},
    {"nombre": "Sidras y Alcopops", "emoji": "🍎", "orden": 4},
    {"nombre": "Aperitivos", "emoji": "🍸", "orden": 5},
    {"nombre": "Ron", "emoji": "🥃", "orden": 6},
    {"nombre": "Ginebra", "emoji": "🫒", "orden": 7},
    {"nombre": "Vodka", "emoji": "🍸", "orden": 8},
    {"nombre": "Whisky", "emoji": "🥃", "orden": 9},
    {"nombre": "Brandy", "emoji": "🍷", "orden": 10},
    {"nombre": "Licores", "emoji": "🍹", "orden": 11},
    {"nombre": "Vinos Tintos", "emoji": "🍷", "orden": 12},
    {"nombre": "Vinos Blancos", "emoji": "🥂", "orden": 13},
    {"nombre": "Vinos Rosados", "emoji": "🌸", "orden": 14},
    {"nombre": "Cava", "emoji": "🥂", "orden": 15},
    {"nombre": "Sangría", "emoji": "🍊", "orden": 16},
]

# ═══ Items por categoría: (nombre, precio, emoji) ═══
ITEMS_POR_CATEGORIA = {
    "Cervezas": [
        ("Small Beer", 2.25, "🍺"),
        ("Large Beer", 3.25, "🍺"),
        ("Peroni", 3.65, "🍺"),
        ("Paulaner", 4.65, "🍺"),
        ("Cruzcampo G.R.", 3.65, "🍺"),
        ("Budweiser", 3.65, "🍺"),
        ("Coronita", 3.65, "🍺"),
        ("Desperado", 3.55, "🍺"),
        ("Guinness", 4.65, "🍺"),
        ("Heineken", 3.55, "🍺"),
        ("Radler Limón", 3.55, "🍋"),
        ("Tropical Bottle", 3.35, "🌴"),
        ("Alcohol Free", 3.55, "🚫"),
    ],
    "Refrescos": [
        ("Still Water", 2.25, "💧"),
        ("Sparkling Water", 2.35, "🫧"),
        ("CocaCola", 3.55, "🥤"),
        ("Fanta Limón", 3.55, "🍋"),
        ("Fanta Naranja", 3.55, "🍊"),
        ("Tónica", 2.55, "🥤"),
        ("Nestea", 3.00, "🍵"),
        ("Appletiser", 3.50, "🍏"),
        ("Aquarius", 3.55, "💧"),
    ],
    "Zumos": [
        ("Orange Juice", 3.55, "🍊"),
        ("Apple Juice", 2.95, "🍏"),
    ],
    "Sidras y Alcopops": [
        ("Strongbow", 3.55, "🍎"),
        ("L. De Manzanas", 3.00, "🍏"),
        ("Magner's", 4.55, "🍎"),
        ("Kopparberg", 4.55, "🍎"),
        ("Smirnoff Ice", 3.55, "🧊"),
        ("Bacardi Breezer", 3.55, "🌴"),
    ],
    "Aperitivos": [
        ("Campari & Orange", 6.95, "🍊"),
        ("Aperol Spritz", 6.55, "🧡"),
    ],
    "Ron": [
        ("Bacardi", 6.95, "🥃"),
        ("Capt. Morgan Dark", 6.95, "🏴‍☠️"),
        ("Arehucas Oro", 6.95, "🥃"),
        ("Arehucas White", 6.95, "🥃"),
    ],
    "Ginebra": [
        ("Gordon's", 6.95, "🫒"),
        ("Bombay Saphire", 6.95, "💎"),
        ("Beefeater", 6.95, "🫒"),
    ],
    "Vodka": [
        ("Smirnoff", 6.95, "🧊"),
        ("Moskovskaya", 6.95, "🧊"),
    ],
    "Whisky": [
        ("Grant's", 5.55, "🥃"),
        ("Jack Daniel's", 6.55, "🥃"),
        ("J&B", 5.55, "🥃"),
        ("100 Pipers", 5.55, "🥃"),
        ("Red Label", 5.55, "🟥"),
        ("Black Label", 6.95, "⬛"),
        ("Jameson's", 5.95, "🍀"),
        ("Ballantine's", 5.55, "🥃"),
    ],
    "Brandy": [
        ("Carlos III", 5.55, "🍷"),
        ("Carlos I", 7.55, "👑"),
        ("Magno", 5.35, "🍷"),
        ("Veterano", 4.95, "🍷"),
    ],
    "Licores": [
        ("Ramazzoti", 4.95, "🍹"),
        ("Sambuca", 4.95, "⭐"),
        ("Cointreau", 4.95, "🍊"),
        ("Tia Maria", 4.95, "☕"),
        ("Amaretto", 4.95, "🌰"),
        ("Bailey's", 4.95, "🍫"),
        ("Drambuie", 5.50, "🍯"),
        ("Fernet Branca", 4.95, "🌿"),
        ("Jägermeister", 4.95, "🦌"),
        ("Aquavit", 5.50, "🌾"),
        ("Tequila J. Cuervo", 5.50, "🌵"),
    ],
    "Vinos Tintos": [
        ("Tinto de la Casa", 18.95, "🍷"),
        ("Ribera del Duero (1)", 19.95, "🍷"),
        ("Ribera del Duero (2)", 21.95, "🍷"),
        ("Rioja (1)", 19.95, "🍷"),
        ("Rioja (2)", 21.95, "🍷"),
        ("Copa de Vino Tinto", 3.55, "🍷"),
    ],
    "Vinos Blancos": [
        ("Blanco de la Casa", 18.95, "🥂"),
        ("Viña Sol (Torres)", 18.95, "☀️"),
        ("Verdejo (Rueda)", 19.95, "🍇"),
        ("Copa de Vino Blanco", 3.55, "🥂"),
    ],
    "Vinos Rosados": [
        ("Rosado de la Casa", 19.95, "🌸"),
        ("Copa de Vino Rosado", 3.55, "🌸"),
    ],
    "Cava": [
        ("Cava Seco 75CL", 21.95, "🥂"),
        ("Cava Semi 75CL", 19.95, "🥂"),
        ("Piccolo Seco 20CL", 5.65, "🥂"),
        ("Piccolo Semi 20CL", 5.55, "🥂"),
    ],
    "Sangría": [
        ("Litro Sangría de Vino", 14.95, "🍊"),
        ("Copa Sangría de Vino", 4.55, "🍊"),
        ("Litro Sangría de Cava", 17.95, "🥂"),
        ("Copa Sangría de Cava", 5.95, "🥂"),
    ],
}
