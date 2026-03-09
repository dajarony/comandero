// src/features/order/api/menuMockV2.ts
import type { Bloque, MenuItemV2, Modificador } from '../types/OrderTypesV2';

export const BLOQUES_MOCK: Bloque[] = [
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    emoji: '🍹',
    colorClass: 'bg-teal-50 border-teal-200',
    subcategorias: [
      { id: 'cervezas', nombre: 'Cervezas', emoji: '🍺', bloqueId: 'bebidas' },
      { id: 'cafes', nombre: 'Cafés', emoji: '☕', bloqueId: 'bebidas' },
      { id: 'refrescos', nombre: 'Refrescos', emoji: '🥤', bloqueId: 'bebidas' },
      { id: 'vinos', nombre: 'Vinos & Cavas', emoji: '🍷', bloqueId: 'bebidas' },
      { id: 'zumos', nombre: 'Zumos & Agua', emoji: '🍊', bloqueId: 'bebidas' },
    ],
  },
  {
    id: 'comidas',
    nombre: 'Comidas',
    emoji: '🍽️',
    colorClass: 'bg-orange-50 border-orange-200',
    subcategorias: [
      { id: 'carnes', nombre: 'Carnes', emoji: '🥩', bloqueId: 'comidas' },
      { id: 'carnes-flambeadas', nombre: 'Carnes Flambeadas', emoji: '🔥', bloqueId: 'comidas' },
      { id: 'pescados', nombre: 'Pescados', emoji: '🐟', bloqueId: 'comidas' },
      { id: 'sopas', nombre: 'Sopas', emoji: '🍲', bloqueId: 'comidas' },
      { id: 'ensaladas', nombre: 'Ensaladas', emoji: '🥗', bloqueId: 'comidas' },
    ],
  },
  {
    id: 'snacks',
    nombre: 'Snacks',
    emoji: '🍔',
    colorClass: 'bg-yellow-50 border-yellow-200',
    subcategorias: [
      { id: 'hamburguesas', nombre: 'Hamburguesas', emoji: '🍔', bloqueId: 'snacks' },
      { id: 'tapas', nombre: 'Tapas', emoji: '🫓', bloqueId: 'snacks' },
      { id: 'fritos', nombre: 'Fritos', emoji: '🍟', bloqueId: 'snacks' },
    ],
  },
  {
    id: 'ingredientes',
    nombre: 'Ingredientes',
    emoji: '🧂',
    colorClass: 'bg-purple-50 border-purple-200',
    subcategorias: [
      { id: 'ing-bebidas', nombre: 'Para Bebidas', emoji: '🍋', bloqueId: 'ingredientes' },
      { id: 'ing-comidas', nombre: 'Para Comidas', emoji: '🥣', bloqueId: 'ingredientes' },
    ],
  },
  {
    id: 'menu-nino',
    nombre: 'Menú Niño',
    emoji: '👶',
    colorClass: 'bg-pink-50 border-pink-200',
    subcategorias: [
      { id: 'nino-comidas', nombre: 'Platos Niño', emoji: '🍗', bloqueId: 'menu-nino' },
      { id: 'nino-bebidas', nombre: 'Bebidas Niño', emoji: '🥛', bloqueId: 'menu-nino' },
    ],
  },
];

const MOD_PUNTO_CARNE: Modificador = {
  id: 'punto-carne',
  nombre: 'Punto de la Carne',
  tipo: 'radio',
  obligatorio: true,
  opciones: [
    { id: 'poco', label: 'Poco hecho', precioExtra: 0 },
    { id: 'punto', label: 'Al punto', precioExtra: 0 },
    { id: 'hecho', label: 'Hecho', precioExtra: 0 },
    { id: 'muy-hecho', label: 'Muy hecho', precioExtra: 0 },
  ],
};

const MOD_EXTRAS_BURGER: Modificador = {
  id: 'extras-burger',
  nombre: 'Añadir Extras',
  tipo: 'checkbox',
  obligatorio: false,
  opciones: [
    { id: 'bacon', label: 'Bacon Crujiente', precioExtra: 1.50 },
    { id: 'huevo', label: 'Huevo Frito', precioExtra: 1.50 },
    { id: 'queso-extra', label: 'Queso Cheddar Extra', precioExtra: 1.00 },
    { id: 'aguacate', label: 'Aguacate', precioExtra: 2.00 },
  ],
};

const MOD_RACION_CARNE: Modificador = {
  id: 'racion-carne',
  nombre: 'Cantidad de Carne',
  tipo: 'stepper',
  obligatorio: false,
  maxStepper: 3,
  opciones: [
    { id: 'simple', label: 'Ración simple', precioExtra: 0 },
    { id: 'doble', label: 'Ración doble', precioExtra: 4.00 },
    { id: 'triple', label: 'Ración triple', precioExtra: 8.00 },
  ],
};

const MOD_HIELO_LIMON: Modificador = {
  id: 'hielo-limon',
  nombre: 'Opciones',
  tipo: 'checkbox',
  obligatorio: false,
  opciones: [
    { id: 'hielo', label: 'Con hielo', precioExtra: 0 },
    { id: 'limon', label: 'Con limón', precioExtra: 0 },
    { id: 'azucar', label: 'Sin azúcar', precioExtra: 0 },
  ],
};

const MOD_NOTAS: Modificador = {
  id: 'notas',
  nombre: 'Notas especiales',
  tipo: 'textarea',
  obligatorio: false,
  opciones: [],
};

const MOD_CAFE_TIPO: Modificador = {
  id: 'cafe-tipo',
  nombre: 'Tipo de café',
  tipo: 'radio',
  obligatorio: true,
  opciones: [
    { id: 'solo', label: 'Solo', precioExtra: 0 },
    { id: 'cortado', label: 'Cortado', precioExtra: 0 },
    { id: 'con-leche', label: 'Con leche', precioExtra: 0 },
    { id: 'americano', label: 'Americano', precioExtra: 0.30 },
    { id: 'capuchino', label: 'Capuchino', precioExtra: 0.50 },
  ],
};

const MOD_LECHE_TIPO: Modificador = {
  id: 'leche-tipo',
  nombre: 'Tipo de leche',
  tipo: 'radio',
  obligatorio: false,
  opciones: [
    { id: 'entera', label: 'Entera', precioExtra: 0 },
    { id: 'desnatada', label: 'Desnatada', precioExtra: 0 },
    { id: 'soja', label: 'Soja', precioExtra: 0.50 },
    { id: 'avena', label: 'Avena', precioExtra: 0.50 },
  ],
};

export const MENU_MOCK_V2: MenuItemV2[] = [
  // === BEBIDAS — Cervezas ===
  { id: 'cer-1', nombre: 'Caña', descripcion: 'Cerveza de grifo 200ml', precio: 2.00, emoji: '🍺', bloque: 'bebidas', subcategoria: 'cervezas', modificadores: [MOD_NOTAS] },
  { id: 'cer-2', nombre: 'Cerveza 1/3', descripcion: 'Botellín 33cl bien fría', precio: 2.50, emoji: '🍺', bloque: 'bebidas', subcategoria: 'cervezas', modificadores: [MOD_NOTAS] },
  { id: 'cer-3', nombre: 'Jarra', descripcion: 'Cerveza de grifo 500ml', precio: 4.00, emoji: '🍺', bloque: 'bebidas', subcategoria: 'cervezas', modificadores: [MOD_NOTAS] },
  { id: 'cer-4', nombre: 'Cerveza Sin', descripcion: 'Sin alcohol 33cl', precio: 2.50, emoji: '🍺', bloque: 'bebidas', subcategoria: 'cervezas', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'cer-5', nombre: 'Radler', descripcion: 'Cerveza con limón', precio: 2.80, emoji: '🍋', bloque: 'bebidas', subcategoria: 'cervezas', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  // === BEBIDAS — Cafés ===
  { id: 'caf-1', nombre: 'Café', descripcion: 'Elige tu tipo y leche preferida', precio: 1.60, emoji: '☕', bloque: 'bebidas', subcategoria: 'cafes', modificadores: [MOD_CAFE_TIPO, MOD_LECHE_TIPO, MOD_NOTAS] },
  { id: 'caf-2', nombre: 'Té / Infusión', descripcion: 'Variedad de infusiones', precio: 1.80, emoji: '🍵', bloque: 'bebidas', subcategoria: 'cafes', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'caf-3', nombre: 'Chocolate Caliente', descripcion: 'Chocolate puro con leche', precio: 2.50, emoji: '🍫', bloque: 'bebidas', subcategoria: 'cafes', modificadores: [MOD_NOTAS] },
  // === BEBIDAS — Refrescos ===
  { id: 'ref-1', nombre: 'Coca Cola', descripcion: 'Lata 33cl', precio: 2.50, emoji: '🥤', bloque: 'bebidas', subcategoria: 'refrescos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'ref-2', nombre: 'Fanta Naranja', descripcion: 'Lata 33cl', precio: 2.20, emoji: '🍊', bloque: 'bebidas', subcategoria: 'refrescos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'ref-3', nombre: 'Sprite / 7Up', descripcion: 'Lata 33cl', precio: 2.20, emoji: '🥤', bloque: 'bebidas', subcategoria: 'refrescos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'ref-4', nombre: 'Tónica', descripcion: 'Schweppes 20cl', precio: 2.50, emoji: '🫧', bloque: 'bebidas', subcategoria: 'refrescos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  // === BEBIDAS — Vinos ===
  { id: 'vin-1', nombre: 'Vino Tinto Casa', descripcion: 'Copa de vino de la casa', precio: 2.50, emoji: '🍷', bloque: 'bebidas', subcategoria: 'vinos', modificadores: [MOD_NOTAS] },
  { id: 'vin-2', nombre: 'Vino Blanco Casa', descripcion: 'Copa de vino blanco', precio: 2.50, emoji: '🥂', bloque: 'bebidas', subcategoria: 'vinos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'vin-3', nombre: 'Rioja Crianza', descripcion: 'Copa Rioja D.O.C.', precio: 4.50, emoji: '🍷', bloque: 'bebidas', subcategoria: 'vinos', modificadores: [MOD_NOTAS] },
  { id: 'vin-4', nombre: 'Cava Brut', descripcion: 'Copa de cava catalán', precio: 5.00, emoji: '🍾', bloque: 'bebidas', subcategoria: 'vinos', modificadores: [MOD_NOTAS] },
  // === BEBIDAS — Zumos ===
  { id: 'zmo-1', nombre: 'Agua sin gas', descripcion: 'Botella 50cl', precio: 1.50, emoji: '💧', bloque: 'bebidas', subcategoria: 'zumos', modificadores: [MOD_NOTAS] },
  { id: 'zmo-2', nombre: 'Agua con gas', descripcion: 'Botella 33cl', precio: 1.80, emoji: '🫧', bloque: 'bebidas', subcategoria: 'zumos', modificadores: [MOD_NOTAS] },
  { id: 'zmo-3', nombre: 'Zumo Naranja', descripcion: 'Natural exprimido', precio: 3.50, emoji: '🍊', bloque: 'bebidas', subcategoria: 'zumos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  // === COMIDAS — Carnes ===
  { id: 'car-1', nombre: 'Entrecot 300g', descripcion: 'Entrecot de ternera a la parrilla con guarnición', precio: 18.00, emoji: '🥩', bloque: 'comidas', subcategoria: 'carnes', modificadores: [MOD_PUNTO_CARNE, { id: 'extras-carne', nombre: 'Extras', tipo: 'checkbox', obligatorio: false, opciones: [{ id: 'foie', label: 'Foie a la plancha', precioExtra: 3.50 }, { id: 'pimientos', label: 'Pimientos de padrón', precioExtra: 2.00 }] }, MOD_NOTAS] },
  { id: 'car-2', nombre: 'Chuletón 500g', descripcion: 'Chuletón de vaca madurada', precio: 28.00, emoji: '🥩', bloque: 'comidas', subcategoria: 'carnes', modificadores: [MOD_PUNTO_CARNE, MOD_NOTAS] },
  { id: 'car-3', nombre: 'Pollo a la Brasa', descripcion: 'Medio pollo con patatas asadas', precio: 13.50, emoji: '🍗', bloque: 'comidas', subcategoria: 'carnes', modificadores: [MOD_NOTAS] },
  { id: 'car-4', nombre: 'Costillas BBQ', descripcion: 'Costillas de cerdo con salsa BBQ', precio: 16.00, emoji: '🍖', bloque: 'comidas', subcategoria: 'carnes', modificadores: [MOD_NOTAS] },
  // === COMIDAS — Carnes Flambeadas ===
  { id: 'flam-1', nombre: 'Solomillo Flambeado', descripcion: 'Solomillo con salsa de brandy flambeado en mesa', precio: 24.00, emoji: '🔥', bloque: 'comidas', subcategoria: 'carnes-flambeadas', modificadores: [MOD_PUNTO_CARNE, MOD_NOTAS] },
  { id: 'flam-2', nombre: 'Ternera al Whisky', descripcion: 'Medallones de ternera flambeados al Bourbon', precio: 22.00, emoji: '🔥', bloque: 'comidas', subcategoria: 'carnes-flambeadas', modificadores: [MOD_PUNTO_CARNE, MOD_NOTAS] },
  // === COMIDAS — Pescados ===
  { id: 'pes-1', nombre: 'Merluza a la Romana', descripcion: 'Merluza rebozada con ensalada y patatas', precio: 14.00, emoji: '🐟', bloque: 'comidas', subcategoria: 'pescados', modificadores: [MOD_NOTAS] },
  { id: 'pes-2', nombre: 'Bacalao al Pil-Pil', descripcion: 'Bacalao tradicional con salsa pil-pil', precio: 16.50, emoji: '🐠', bloque: 'comidas', subcategoria: 'pescados', modificadores: [MOD_NOTAS] },
  { id: 'pes-3', nombre: 'Langostinos Plancha', descripcion: 'Langostinos frescos a la plancha con alioli', precio: 18.00, emoji: '🦐', bloque: 'comidas', subcategoria: 'pescados', modificadores: [MOD_NOTAS] },
  // === COMIDAS — Sopas ===
  { id: 'sop-1', nombre: 'Sopa del Día', descripcion: 'Consultar con el camarero', precio: 5.00, emoji: '🍲', bloque: 'comidas', subcategoria: 'sopas', modificadores: [MOD_NOTAS] },
  { id: 'sop-2', nombre: 'Crema de Verduras', descripcion: 'Crema de temporada con picatostes', precio: 6.00, emoji: '🥣', bloque: 'comidas', subcategoria: 'sopas', modificadores: [MOD_NOTAS] },
  // === COMIDAS — Ensaladas ===
  { id: 'ens-1', nombre: 'Ensalada César', descripcion: 'Lechuga romana, pollo, parmesano y croutons', precio: 9.00, emoji: '🥗', bloque: 'comidas', subcategoria: 'ensaladas', modificadores: [{ id: 'sin-ingrediente', nombre: 'Sin ingredientes', tipo: 'checkbox', obligatorio: false, opciones: [{ id: 'sin-anchoas', label: 'Sin anchoas', precioExtra: 0 }, { id: 'sin-crutones', label: 'Sin croutons', precioExtra: 0 }] }, MOD_NOTAS] },
  { id: 'ens-2', nombre: 'Ensalada Mixta', descripcion: 'Lechuga, tomate, zanahoria y aceitunas', precio: 6.50, emoji: '🥬', bloque: 'comidas', subcategoria: 'ensaladas', modificadores: [MOD_NOTAS] },
  // === SNACKS — Hamburguesas ===
  { id: 'hbg-1', nombre: 'Hamburguesa Clásica', descripcion: 'Ternera 180g, lechuga, tomate, cebolla y pepinillo', precio: 12.00, emoji: '🍔', bloque: 'snacks', subcategoria: 'hamburguesas', modificadores: [MOD_PUNTO_CARNE, MOD_EXTRAS_BURGER, MOD_RACION_CARNE, MOD_NOTAS] },
  { id: 'hbg-2', nombre: 'Hamburguesa BBQ', descripcion: 'Ternera 180g con salsa BBQ y onion rings', precio: 13.50, emoji: '🍔', bloque: 'snacks', subcategoria: 'hamburguesas', modificadores: [MOD_PUNTO_CARNE, MOD_EXTRAS_BURGER, MOD_NOTAS] },
  { id: 'hbg-3', nombre: 'Hamburguesa Vegana', descripcion: 'Hamburguesa de legumbres con remolacha', precio: 11.00, emoji: '🌿', bloque: 'snacks', subcategoria: 'hamburguesas', modificadores: [MOD_NOTAS] },
  // === SNACKS — Tapas ===
  { id: 'tap-1', nombre: 'Croquetas (6 ud)', descripcion: 'Croquetas caseras de jamón ibérico', precio: 7.00, emoji: '🫓', bloque: 'snacks', subcategoria: 'tapas', modificadores: [MOD_NOTAS] },
  { id: 'tap-2', nombre: 'Patatas Bravas', descripcion: 'Con salsa brava y alioli casero', precio: 6.00, emoji: '🍟', bloque: 'snacks', subcategoria: 'tapas', modificadores: [{ id: 'salsa-bravas', nombre: 'Salsa', tipo: 'radio', obligatorio: false, opciones: [{ id: 'brava', label: 'Solo brava', precioExtra: 0 }, { id: 'alioli', label: 'Solo alioli', precioExtra: 0 }, { id: 'mixta', label: 'Mixta (ambas)', precioExtra: 0 }] }, MOD_NOTAS] },
  { id: 'tap-3', nombre: 'Tabla de Quesos', descripcion: 'Selección de quesos nacionales con membrillo', precio: 12.00, emoji: '🧀', bloque: 'snacks', subcategoria: 'tapas', modificadores: [MOD_NOTAS] },
  // === SNACKS — Fritos ===
  { id: 'fri-1', nombre: 'Calamares a la Romana', descripcion: 'Anillas de calamar rebozadas con limón', precio: 8.50, emoji: '🦑', bloque: 'snacks', subcategoria: 'fritos', modificadores: [MOD_HIELO_LIMON, MOD_NOTAS] },
  { id: 'fri-2', nombre: 'Gambas al Ajillo', descripcion: 'Gambas en aceite de oliva con ajo y guindilla', precio: 10.00, emoji: '🦐', bloque: 'snacks', subcategoria: 'fritos', modificadores: [MOD_NOTAS] },
  // === INGREDIENTES — Para Bebidas ===
  { id: 'ing-b1', nombre: 'Hielo extra', descripcion: 'Cubo de hielo adicional', precio: 0.50, emoji: '🧊', bloque: 'ingredientes', subcategoria: 'ing-bebidas', modificadores: [] },
  { id: 'ing-b2', nombre: 'Rodaja de limón', descripcion: 'Limón natural', precio: 0.30, emoji: '🍋', bloque: 'ingredientes', subcategoria: 'ing-bebidas', modificadores: [] },
  { id: 'ing-b3', nombre: 'Sobre de azúcar', descripcion: 'Normal o moreno', precio: 0.20, emoji: '🍬', bloque: 'ingredientes', subcategoria: 'ing-bebidas', modificadores: [] },
  // === INGREDIENTES — Para Comidas ===
  { id: 'ing-c1', nombre: 'Pan extra', descripcion: 'Rebanadas de pan de hogaza', precio: 1.00, emoji: '🍞', bloque: 'ingredientes', subcategoria: 'ing-comidas', modificadores: [] },
  { id: 'ing-c2', nombre: 'Salsa extra', descripcion: 'Mayonesa, ketchup, mostaza...', precio: 0.50, emoji: '🫙', bloque: 'ingredientes', subcategoria: 'ing-comidas', modificadores: [{ id: 'tipo-salsa', nombre: 'Tipo de salsa', tipo: 'radio', obligatorio: true, opciones: [{ id: 'mayo', label: 'Mayonesa', precioExtra: 0 }, { id: 'ketc', label: 'Ketchup', precioExtra: 0 }, { id: 'most', label: 'Mostaza', precioExtra: 0 }, { id: 'bbq', label: 'BBQ', precioExtra: 0 }] }] },
  // === MENÚ NIÑO ===
  { id: 'nno-1', nombre: 'Mini Hamburguesa', descripcion: 'Hamburguesa pequeña con patatas y bebida', precio: 8.00, emoji: '🍔', bloque: 'menu-nino', subcategoria: 'nino-comidas', modificadores: [MOD_NOTAS] },
  { id: 'nno-2', nombre: 'Nuggets de Pollo (6ud)', descripcion: 'Con patatas fritas y salsa', precio: 7.50, emoji: '🍗', bloque: 'menu-nino', subcategoria: 'nino-comidas', modificadores: [MOD_NOTAS] },
  { id: 'nno-3', nombre: 'Macarrones', descripcion: 'Con salsa de tomate casera y parmesano', precio: 6.50, emoji: '🍝', bloque: 'menu-nino', subcategoria: 'nino-comidas', modificadores: [MOD_NOTAS] },
  { id: 'nno-4', nombre: 'Zumo Brick', descripcion: 'Zumo de melocotón o naranja', precio: 1.50, emoji: '🧃', bloque: 'menu-nino', subcategoria: 'nino-bebidas', modificadores: [] },
  { id: 'nno-5', nombre: 'Leche con Cola Cao', descripcion: 'Leche entera con Cola Cao', precio: 1.80, emoji: '🥛', bloque: 'menu-nino', subcategoria: 'nino-bebidas', modificadores: [] },
];
