# Order V2 — Menú Jerárquico + Modal Personalización

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rediseñar la pantalla de comanda con menú 2 niveles (Bloques → Sub-categorías → Items) y modal de personalización por item, usando el estilo visual del diseño Stitch.

**Architecture:** Se añade Tailwind CSS v4 al proyecto existente. Se reemplaza OrderPage con una versión V2 que tiene navegación 3 niveles. Los datos mock se enriquecen con sub-categorías y modificadores por item. El modal de personalización muestra opciones de punto/extras/notas y calcula precio en tiempo real.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 + @tailwindcss/vite, Zustand v5, react-router-dom v7, CSS custom properties

---

### Task 1: Instalar Tailwind CSS v4

**Files:**
- Modify: `package.json` (via npm)
- Modify: `vite.config.ts`
- Modify: `src/index.css`

**Step 1: Instalar Tailwind v4**

```bash
cd "C:\Users\gatak\Desktop\tpv movil comandero dijital universal\fronted\app"
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Actualizar vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 3: Añadir Tailwind + tema al inicio de src/index.css**

Añadir estas líneas AL INICIO del archivo (antes del `:root` existente):

```css
@import "tailwindcss";

@theme {
  --color-primary: #07d5a1;
  --color-accent: #F04770;
  --color-bg-app: #f5f8f8;
  --color-dark-navy: #073A4B;
  --font-display: "Manrope", system-ui, sans-serif;
}
```

**Step 4: Verificar build**

```bash
npm run build
```

Expected: Build limpio, sin errores.

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Tailwind CSS v4 to project"
```

---

### Task 2: Tipos y Mock Data V2 (menú jerárquico + modificadores)

**Files:**
- Create: `src/features/order/types/OrderTypesV2.ts`
- Create: `src/features/order/api/menuMockV2.ts`

**Step 1: Crear OrderTypesV2.ts**

```typescript
// src/features/order/types/OrderTypesV2.ts

export type TipoModificador = 'radio' | 'checkbox' | 'stepper' | 'textarea';

export interface OpcionModificador {
  id: string;
  label: string;
  precioExtra: number;
}

export interface Modificador {
  id: string;
  nombre: string;
  tipo: TipoModificador;
  obligatorio: boolean;
  opciones: OpcionModificador[];
  maxStepper?: number; // solo para tipo stepper
}

export interface MenuItemV2 {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  emoji: string;
  foto?: string;
  bloque: string;
  subcategoria: string;
  modificadores: Modificador[];
}

export interface Subcategoria {
  id: string;
  nombre: string;
  emoji: string;
  bloqueId: string;
}

export interface Bloque {
  id: string;
  nombre: string;
  emoji: string;
  colorClass: string; // Tailwind bg color
  subcategorias: Subcategoria[];
}

export interface ModificadorSeleccionado {
  modificadorId: string;
  valor: string | string[] | number; // radio→string, checkbox→string[], stepper→number
  precioExtra: number;
}

export interface LineaPedidoV2 {
  item: MenuItemV2;
  cantidad: number;
  nota: string;
  modificadores: ModificadorSeleccionado[];
  precioUnitario: number; // precio base + extras
}
```

**Step 2: Crear menuMockV2.ts**

```typescript
// src/features/order/api/menuMockV2.ts
import type { Bloque, MenuItemV2 } from '../types/OrderTypesV2';

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

const MOD_PUNTO_CARNE: MenuItemV2['modificadores'][0] = {
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

const MOD_EXTRAS_BURGER: MenuItemV2['modificadores'][0] = {
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

const MOD_RACION_CARNE: MenuItemV2['modificadores'][0] = {
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

const MOD_HIELO_LIMON: MenuItemV2['modificadores'][0] = {
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

const MOD_NOTAS: MenuItemV2['modificadores'][0] = {
  id: 'notas',
  nombre: 'Notas especiales',
  tipo: 'textarea',
  obligatorio: false,
  opciones: [],
};

const MOD_CAFE_TIPO: MenuItemV2['modificadores'][0] = {
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

const MOD_LECHE_TIPO: MenuItemV2['modificadores'][0] = {
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
```

**Step 3: Verificar build**

```bash
npm run build
```

Expected: Build limpio.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add menu mock V2 with 2-level hierarchy and modifiers"
```

---

### Task 3: Store V2 para carrito con modificadores

**Files:**
- Create: `src/features/order/state/orderStoreV2.ts`

**Step 1: Crear orderStoreV2.ts**

```typescript
// src/features/order/state/orderStoreV2.ts
import { create } from 'zustand';
import type { LineaPedidoV2, MenuItemV2, ModificadorSeleccionado } from '../types/OrderTypesV2';

function calcularPrecioLinea(item: MenuItemV2, mods: ModificadorSeleccionado[]): number {
  const extrasTotal = mods.reduce((acc, m) => acc + m.precioExtra, 0);
  return item.precio + extrasTotal;
}

interface OrderStateV2 {
  carritoPorMesa: Record<string, LineaPedidoV2[]>;
  addLineaV2: (mesaId: string, item: MenuItemV2, mods: ModificadorSeleccionado[], nota: string) => void;
  removeLineaV2: (mesaId: string, lineaIdx: number) => void;
  clearCarritoV2: (mesaId: string) => void;
  getCarritoV2: (mesaId: string) => LineaPedidoV2[];
  getTotalV2: (mesaId: string) => number;
  getTotalItemsV2: (mesaId: string) => number;
}

export const useOrderStoreV2 = create<OrderStateV2>((set, get) => ({
  carritoPorMesa: {},

  addLineaV2: (mesaId, item, mods, nota) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    const precioUnitario = calcularPrecioLinea(item, mods);
    const nuevaLinea: LineaPedidoV2 = { item, cantidad: 1, nota, modificadores: mods, precioUnitario };
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: [...carrito, nuevaLinea] } };
  }),

  removeLineaV2: (mesaId, lineaIdx) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: carrito.filter((_, i) => i !== lineaIdx) } };
  }),

  clearCarritoV2: (mesaId) => set(state => ({
    carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: [] },
  })),

  getCarritoV2: (mesaId) => get().carritoPorMesa[mesaId] ?? [],

  getTotalV2: (mesaId) => {
    const carrito = get().carritoPorMesa[mesaId] ?? [];
    return carrito.reduce((acc, l) => acc + l.precioUnitario * l.cantidad, 0);
  },

  getTotalItemsV2: (mesaId) => {
    const carrito = get().carritoPorMesa[mesaId] ?? [];
    return carrito.reduce((acc, l) => acc + l.cantidad, 0);
  },
}));
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add orderStoreV2 with modifier-aware cart"
```

---

### Task 4: Modal de Personalización de Item

**Files:**
- Create: `src/features/order/ui/ItemModal.tsx`

**Step 1: Crear ItemModal.tsx**

```tsx
// src/features/order/ui/ItemModal.tsx
import { useState } from 'react';
import type { MenuItemV2, ModificadorSeleccionado } from '../types/OrderTypesV2';

interface ItemModalProps {
  item: MenuItemV2;
  onConfirm: (mods: ModificadorSeleccionado[], nota: string) => void;
  onClose: () => void;
}

export function ItemModal({ item, onConfirm, onClose }: ItemModalProps) {
  const [selecciones, setSelecciones] = useState<Record<string, string | string[] | number>>({});
  const [nota, setNota] = useState('');

  const calcularTotal = () => {
    let extra = 0;
    item.modificadores.forEach(mod => {
      const sel = selecciones[mod.id];
      if (mod.tipo === 'radio' && sel) {
        const op = mod.opciones.find(o => o.id === sel);
        if (op) extra += op.precioExtra;
      }
      if (mod.tipo === 'checkbox' && Array.isArray(sel)) {
        sel.forEach(selId => {
          const op = mod.opciones.find(o => o.id === selId);
          if (op) extra += op.precioExtra;
        });
      }
      if (mod.tipo === 'stepper' && typeof sel === 'number' && sel > 0) {
        const op = mod.opciones[sel];
        if (op) extra += op.precioExtra;
      }
    });
    return item.precio + extra;
  };

  const handleRadio = (modId: string, opId: string) => {
    setSelecciones(prev => ({ ...prev, [modId]: opId }));
  };

  const handleCheckbox = (modId: string, opId: string) => {
    setSelecciones(prev => {
      const current = (prev[modId] as string[]) ?? [];
      const updated = current.includes(opId) ? current.filter(x => x !== opId) : [...current, opId];
      return { ...prev, [modId]: updated };
    });
  };

  const handleStepper = (modId: string, delta: number, max: number) => {
    setSelecciones(prev => {
      const current = (prev[modId] as number) ?? 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [modId]: next };
    });
  };

  const handleConfirm = () => {
    const mods: ModificadorSeleccionado[] = [];
    item.modificadores.forEach(mod => {
      const sel = selecciones[mod.id];
      if (mod.tipo === 'radio' && sel) {
        const op = mod.opciones.find(o => o.id === sel);
        mods.push({ modificadorId: mod.id, valor: sel as string, precioExtra: op?.precioExtra ?? 0 });
      }
      if (mod.tipo === 'checkbox' && Array.isArray(sel) && sel.length > 0) {
        const extra = sel.reduce((acc, sid) => acc + (mod.opciones.find(o => o.id === sid)?.precioExtra ?? 0), 0);
        mods.push({ modificadorId: mod.id, valor: sel, precioExtra: extra });
      }
      if (mod.tipo === 'stepper' && typeof sel === 'number' && sel > 0) {
        const op = mod.opciones[sel];
        mods.push({ modificadorId: mod.id, valor: sel, precioExtra: op?.precioExtra ?? 0 });
      }
    });
    onConfirm(mods, nota);
  };

  const stepperLabels = ['Ración simple', 'Ración doble', 'Ración triple'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header con foto */}
        <div className="relative h-44 shrink-0">
          {item.foto ? (
            <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200 flex items-center justify-center text-7xl">
              {item.emoji}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-5">
            <div>
              <h2 className="text-white text-xl font-extrabold tracking-tight">{item.nombre}</h2>
              <p className="text-[#07d5a1] font-semibold text-sm">{item.descripcion}</p>
              <p className="text-white/80 font-bold">Desde {item.precio.toFixed(2)}€</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full p-2 text-white transition-colors"
          >
            <span className="text-xl leading-none">✕</span>
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-7">
          {item.modificadores.map(mod => (
            <section key={mod.id}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                <span className="text-[#07d5a1]">■</span>
                {mod.nombre}
                {mod.obligatorio && <span className="text-red-400 text-xs">(obligatorio)</span>}
              </h3>

              {/* RADIO */}
              {mod.tipo === 'radio' && (
                <div className="grid grid-cols-2 gap-2">
                  {mod.opciones.map(op => {
                    const sel = selecciones[mod.id] === op.id;
                    return (
                      <button
                        key={op.id}
                        onClick={() => handleRadio(mod.id, op.id)}
                        className={`py-3 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                          sel
                            ? 'border-[#07d5a1] bg-teal-50 text-teal-700'
                            : 'border-slate-200 text-slate-600 hover:border-teal-300'
                        }`}
                      >
                        {op.label}
                        {op.precioExtra > 0 && <span className="block text-xs text-teal-600">+{op.precioExtra.toFixed(2)}€</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* CHECKBOX */}
              {mod.tipo === 'checkbox' && (
                <div className="space-y-2">
                  {mod.opciones.map(op => {
                    const checked = ((selecciones[mod.id] as string[]) ?? []).includes(op.id);
                    return (
                      <label
                        key={op.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-teal-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckbox(mod.id, op.id)}
                            className="w-5 h-5 rounded accent-teal-500"
                          />
                          <span className="font-medium text-sm">{op.label}</span>
                        </div>
                        {op.precioExtra > 0 && (
                          <span className="text-[#07d5a1] font-bold text-sm">+{op.precioExtra.toFixed(2)}€</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* STEPPER */}
              {mod.tipo === 'stepper' && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-semibold text-sm text-slate-700">Cantidad de carne</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleStepper(mod.id, -1, mod.maxStepper ?? 3)}
                      className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg font-bold hover:bg-[#07d5a1] hover:text-white hover:border-[#07d5a1] transition-all"
                    >−</button>
                    <span className="text-sm font-bold min-w-[80px] text-center text-slate-800">
                      {stepperLabels[(selecciones[mod.id] as number) ?? 0] ?? 'Ración simple'}
                    </span>
                    <button
                      onClick={() => handleStepper(mod.id, 1, mod.maxStepper ?? 3)}
                      className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg font-bold hover:bg-[#07d5a1] hover:text-white hover:border-[#07d5a1] transition-all"
                    >+</button>
                  </div>
                </div>
              )}

              {/* TEXTAREA (notas) */}
              {mod.tipo === 'textarea' && (
                <textarea
                  value={nota}
                  onChange={e => setNota(e.target.value)}
                  placeholder="Ej: Sin cebolla, salsas aparte, alergia a frutos secos..."
                  className="w-full h-20 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#07d5a1] focus:ring-1 focus:ring-[#07d5a1] p-3 text-sm outline-none resize-none"
                />
              )}
            </section>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-2xl bg-[#F04770] hover:bg-[#d63d61] text-white font-bold text-base flex items-center justify-center gap-4 transition-all shadow-lg active:scale-[0.98]"
          >
            <span>Confirmar y Añadir</span>
            <span className="w-px h-5 bg-white/30" />
            <span>{calcularTotal().toFixed(2)}€</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add ItemModal component with radio/checkbox/stepper/notes"
```

---

### Task 5: OrderPage V2 — Pantalla completa 3 niveles

**Files:**
- Create: `src/features/order/ui/OrderPageV2.tsx`
- Create: `src/features/order/logic/useOrderFlowV2.ts`

**Step 1: Crear useOrderFlowV2.ts**

```typescript
// src/features/order/logic/useOrderFlowV2.ts
/**
 * SUME DOCBLOCK
 * Nombre: Order Flow V2
 * Tipo: Logic Block
 * Entradas: mesaId, bloque activo, subcategoria activa, item seleccionado
 * Acciones: navega 3 niveles, gestiona modal, añade al carrito con modificadores
 * Salidas: estado de navegación, items filtrados, carrito, handlers
 * Errores: ORDER_V2_FAILED
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BLOQUES_MOCK, MENU_MOCK_V2 } from '../api/menuMockV2';
import { useOrderStoreV2 } from '../state/orderStoreV2';
import { useTablesStore } from '@/features/tables/state/tablesStore';
import { handleError } from '@/core/errors/errorHandler';
import type { Bloque, MenuItemV2, ModificadorSeleccionado, Subcategoria } from '../types/OrderTypesV2';

type Nivel = 'bloques' | 'subcategorias' | 'items';

export function useOrderFlowV2(mesaId: string) {
  // S — Setup
  const [nivel, setNivel] = useState<Nivel>('bloques');
  const [bloqueActivo, setBloqueActivo] = useState<Bloque | null>(null);
  const [subcatActiva, setSubcatActiva] = useState<Subcategoria | null>(null);
  const [itemModal, setItemModal] = useState<MenuItemV2 | null>(null);
  const [carritoVisible, setCarritoVisible] = useState(false);
  const navigate = useNavigate();

  const { addLineaV2, getCarritoV2, getTotalV2, getTotalItemsV2, clearCarritoV2 } = useOrderStoreV2();
  const abrirMesa = useTablesStore(s => s.abrirMesa);
  const setMesaEstado = useTablesStore(s => s.setMesaEstado);

  const carrito = getCarritoV2(mesaId);
  const total = getTotalV2(mesaId);
  const totalItems = getTotalItemsV2(mesaId);

  // M — Manage
  const itemsSubcat = subcatActiva
    ? MENU_MOCK_V2.filter(i => i.subcategoria === subcatActiva.id)
    : [];

  // U — Use
  const handleSelectBloque = (bloque: Bloque) => {
    setBloqueActivo(bloque);
    setNivel('subcategorias');
  };

  const handleSelectSubcat = (subcat: Subcategoria) => {
    setSubcatActiva(subcat);
    setNivel('items');
  };

  const handleBack = () => {
    if (nivel === 'items') { setNivel('subcategorias'); setSubcatActiva(null); }
    else if (nivel === 'subcategorias') { setNivel('bloques'); setBloqueActivo(null); }
    else { navigate('/mesas'); }
  };

  const handleTapItem = (item: MenuItemV2) => {
    if (item.modificadores.length === 0) {
      addLineaV2(mesaId, item, [], '');
    } else {
      setItemModal(item);
    }
  };

  const handleConfirmModal = (mods: ModificadorSeleccionado[], nota: string) => {
    if (!itemModal) return;
    addLineaV2(mesaId, itemModal, mods, nota);
    setItemModal(null);
  };

  const handleMarchar = () => {
    try {
      if (carrito.length === 0) return;
      abrirMesa(mesaId);
      setMesaEstado(mesaId, 'OCUPADA', { totalCuenta: total });
      clearCarritoV2(mesaId);
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'ORDER_V2_FAILED');
    }
  };

  return {
    nivel, bloques: BLOQUES_MOCK, bloqueActivo, subcatActiva,
    itemsSubcat, carrito, total, totalItems,
    carritoVisible, setCarritoVisible,
    itemModal, setItemModal,
    handleSelectBloque, handleSelectSubcat, handleBack,
    handleTapItem, handleConfirmModal, handleMarchar,
  };
}
```

**Step 2: Crear OrderPageV2.tsx**

```tsx
// src/features/order/ui/OrderPageV2.tsx
import { useParams } from 'react-router-dom';
import { useOrderFlowV2 } from '../logic/useOrderFlowV2';
import { ItemModal } from './ItemModal';

export function OrderPageV2() {
  const { mesaId = '01' } = useParams<{ mesaId: string }>();
  const {
    nivel, bloques, bloqueActivo, subcatActiva,
    itemsSubcat, carrito, total, totalItems,
    carritoVisible, setCarritoVisible,
    itemModal, handleSelectBloque, handleSelectSubcat,
    handleBack, handleTapItem, handleConfirmModal, handleMarchar,
  } = useOrderFlowV2(mesaId);

  return (
    <div className="min-h-screen bg-[#f5f8f8] font-[Manrope,system-ui,sans-serif] flex flex-col">

      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[#07d5a1] font-semibold text-sm"
          >
            ← {nivel === 'bloques' ? 'Mesas' : nivel === 'subcategorias' ? 'Menú' : bloqueActivo?.nombre}
          </button>
          <div className="text-center">
            <p className="font-extrabold text-slate-800 text-sm">Mesa {mesaId}</p>
            <p className="text-xs text-slate-400">
              {nivel === 'bloques' ? 'Selecciona categoría' : nivel === 'subcategorias' ? bloqueActivo?.nombre : subcatActiva?.nombre}
            </p>
          </div>
          <button
            onClick={() => setCarritoVisible(!carritoVisible)}
            className="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl"
          >
            🛒
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#F04770] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* NIVEL 1 — BLOQUES */}
      {nivel === 'bloques' && (
        <div className="p-4 grid grid-cols-2 gap-4 flex-1">
          {bloques.map(bloque => (
            <button
              key={bloque.id}
              onClick={() => handleSelectBloque(bloque)}
              className={`${bloque.colorClass} border-2 rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-sm`}
            >
              <span className="text-5xl">{bloque.emoji}</span>
              <span className="font-extrabold text-slate-800 text-base">{bloque.nombre}</span>
              <span className="text-xs text-slate-500">{bloque.subcategorias.length} categorías</span>
            </button>
          ))}
        </div>
      )}

      {/* NIVEL 2 — SUB-CATEGORÍAS */}
      {nivel === 'subcategorias' && bloqueActivo && (
        <div className="p-4 grid grid-cols-2 gap-4 flex-1">
          {bloqueActivo.subcategorias.map(subcat => {
            const count = itemsSubcat.length; // approximate
            const realCount = require('../api/menuMockV2').MENU_MOCK_V2.filter((i: { subcategoria: string }) => i.subcategoria === subcat.id).length;
            return (
              <button
                key={subcat.id}
                onClick={() => handleSelectSubcat(subcat)}
                className="bg-white border-2 border-slate-200 rounded-2xl p-5 flex flex-col items-center gap-3 active:scale-95 transition-transform shadow-sm hover:border-[#07d5a1]"
              >
                <span className="text-4xl">{subcat.emoji}</span>
                <span className="font-bold text-slate-800 text-sm text-center">{subcat.nombre}</span>
                <span className="text-xs text-[#07d5a1] font-semibold">{realCount} items</span>
              </button>
            );
          })}
        </div>
      )}

      {/* NIVEL 3 — ITEMS */}
      {nivel === 'items' && (
        <div className="p-4 flex-1 space-y-3">
          {itemsSubcat.map(item => (
            <button
              key={item.id}
              onClick={() => handleTapItem(item)}
              className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {item.foto
                  ? <img src={item.foto} alt={item.nombre} className="w-full h-full object-cover rounded-xl" />
                  : item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800 text-sm">{item.nombre}</p>
                <p className="text-xs text-slate-500 truncate">{item.descripcion}</p>
                {item.modificadores.length > 0 && (
                  <p className="text-xs text-[#07d5a1] mt-1">✦ Personalizable</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-extrabold text-slate-800">{item.precio.toFixed(2)}€</p>
                <div className="mt-1 w-8 h-8 rounded-full bg-[#07d5a1] flex items-center justify-center text-white font-bold text-lg ml-auto">+</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* MODAL PERSONALIZACIÓN */}
      {itemModal && (
        <ItemModal
          item={itemModal}
          onConfirm={handleConfirmModal}
          onClose={() => handleTapItem}
        />
      )}

      {/* PANEL CARRITO */}
      {carritoVisible && carrito.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCarritoVisible(false)} />
          <div className="relative w-full bg-white rounded-t-2xl p-5 max-h-[60vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg">Comanda</h3>
              <button onClick={() => setCarritoVisible(false)} className="text-slate-400 text-xl">✕</button>
            </div>
            <div className="space-y-3">
              {carrito.map((linea, i) => (
                <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100">
                  <span className="text-2xl">{linea.item.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{linea.item.nombre}</p>
                    {linea.nota && <p className="text-xs text-slate-400 italic">{linea.nota}</p>}
                  </div>
                  <span className="font-bold text-slate-800">{linea.precioUnitario.toFixed(2)}€</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 font-extrabold text-lg text-slate-800">
              <span>Total</span><span>{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      )}

      {/* FAB MARCHAR */}
      {carrito.length > 0 && !carritoVisible && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
          <button
            onClick={handleMarchar}
            className="w-full py-4 rounded-2xl bg-[#F04770] text-white font-extrabold text-base shadow-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-3"
          >
            🚀 MARCHAR PEDIDO
            <span className="bg-white/20 px-3 py-1 rounded-full">{total.toFixed(2)}€</span>
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Fix the require() — no usar require() en TypeScript ESM**

En OrderPageV2.tsx, la línea con `require()` debe reemplazarse. Importar `MENU_MOCK_V2` al principio del archivo:

```tsx
import { MENU_MOCK_V2 } from '../api/menuMockV2';
```

Y en el JSX reemplazar la variable `realCount`:
```tsx
const realCount = MENU_MOCK_V2.filter(i => i.subcategoria === subcat.id).length;
```

**Step 4: Fix el onClose del ItemModal**

En `handleTapItem` del modal `onClose` debe ser:
```tsx
onClose={() => setItemModal(null)}
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add OrderPageV2 with 3-level nav and item customization modal"
```

---

### Task 6: Actualizar router para usar OrderPageV2

**Files:**
- Modify: `src/app/router.tsx`

**Step 1: Actualizar router.tsx**

```tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { TablesPage } from '@/features/tables/ui/TablesPage';
import { OrderPageV2 } from '@/features/order/ui/OrderPageV2';
import { CheckoutPage } from '@/features/checkout/ui/CheckoutPage';
import { MenuIngestPage } from '@/features/menu-ingest/ui/MenuIngestPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mesas" replace /> },
  { path: '/mesas', element: <TablesPage /> },
  { path: '/comanda/:mesaId', element: <OrderPageV2 /> },
  { path: '/cobro/:mesaId', element: <CheckoutPage /> },
  { path: '/admin/carta', element: <MenuIngestPage /> },
  { path: '/comandas', element: <TablesPage /> },
  { path: '/historial', element: <TablesPage /> },
  { path: '*', element: <Navigate to="/mesas" replace /> },
]);
```

**Step 2: Build y verificar**

```bash
npm run build
```

Expected: Build limpio, 0 errores TypeScript.

**Step 3: Commit final**

```bash
git add -A
git commit -m "feat: wire OrderPageV2 to router — menu jerarquico completo"
```

---

## Verificación Final

```bash
npm run dev
```

Flujo a probar:
1. `/mesas` → tap mesa → aparece pantalla con **5 bloques grandes** (Bebidas, Comidas, Snacks, Ingredientes, Menú Niño)
2. Tap "Comidas" → aparecen **sub-categorías** (Carnes, Pescados, Sopas...)
3. Tap "Hamburguesas" (en Snacks) → aparece **lista de items** con foto/emoji + descripción + precio
4. Tap "Hamburguesa Clásica" → se abre **modal de personalización** (punto carne, extras, ración, notas)
5. "Confirmar y Añadir" → item añadido con precio calculado → badge en carrito
6. "MARCHAR PEDIDO" → vuelve a mesas, mesa marcada OCUPADA
