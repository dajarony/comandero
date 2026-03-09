# Comandero Digital – Fase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Construir las 4 pantallas core del comandero (Mesas, Comanda, Checkout, Ingesta Carta) con datos mock y navegación completa.

**Architecture:** Feature-Driven + SUME Blocks (Dajarony V1). Cada feature tiene su propio ui/, logic/, api/, state/, types/. Zustand para estado global. React Router v6 para navegación.

**Tech Stack:** React 19, TypeScript, Vite, Zustand v5, React Router v6, CSS Modules

---

### Task 1: Instalar react-router-dom

**Files:**
- Modify: `package.json`

**Step 1: Instalar dependencia**

```bash
cd "fronted/app"
npm install react-router-dom
npm install --save-dev @types/react-router-dom
```

Expected: `package.json` tiene `"react-router-dom"` en dependencies.

---

### Task 2: Setup Router y Entry Point

**Files:**
- Create: `src/app/router.tsx`
- Modify: `src/main.tsx`

**Step 1: Crear router.tsx (placeholder — se actualizará en Task 14)**

```tsx
// src/app/router.tsx
import { createBrowserRouter } from 'react-router-dom';

// Placeholder — las rutas reales se añaden en Task 14
export const router = createBrowserRouter([
  { path: '*', element: <div>Cargando...</div> },
]);
```

**Step 2: Actualizar src/main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

**Step 3: Verificar que compila**

```bash
npm run build
```

Expected: Build sin errores.

---

### Task 3: Shared – BottomNav Component

**Files:**
- Create: `src/shared/components/BottomNav.tsx`
- Create: `src/shared/components/BottomNav.module.css`

**Step 1: Crear BottomNav.tsx**

```tsx
// src/shared/components/BottomNav.tsx
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNav.module.css';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/mesas', icon: '🪟', label: 'Mesas' },
    { path: '/comandas', icon: '📋', label: 'Comandas' },
    { path: '/historial', icon: '🕒', label: 'Historial' },
    { path: '/admin/carta', icon: '⚙️', label: 'Ajustes' },
  ];

  return (
    <nav className={styles.bottomNav}>
      {tabs.map(tab => (
        <button
          key={tab.path}
          className={`${styles.navItem} ${location.pathname === tab.path ? styles.navActive : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className={styles.navIcon}>{tab.icon}</span>
          <span className={styles.navLabel}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

**Step 2: Crear BottomNav.module.css**

```css
/* src/shared/components/BottomNav.module.css */
.bottomNav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--color-surface);
  display: flex;
  justify-content: space-around;
  padding: 12px 0 20px 0;
  box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05);
  border-top: 1px solid var(--color-border);
  z-index: 100;
}

.navItem {
  background: transparent;
  color: #9CA3AF;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 8px;
  box-shadow: none;
  border: none;
}

.navItem:hover,
.navItem:focus {
  border: none;
  background: transparent;
}

.navIcon {
  font-size: 1.25rem;
}

.navActive {
  color: var(--color-secondary);
}

.navActive .navIcon {
  color: var(--color-secondary);
}
```

---

### Task 4: feature/tables – Types y Store

**Files:**
- Create: `src/features/tables/types/TablesTypes.ts`
- Create: `src/features/tables/state/tablesStore.ts`

**Step 1: Crear TablesTypes.ts**

```typescript
// src/features/tables/types/TablesTypes.ts
export type MesaEstado = 'LIBRE' | 'OCUPADA' | 'PENDIENTE_COBRO';

export interface Mesa {
  id: string;
  estado: MesaEstado;
  totalCuenta?: number;
  horaApertura?: string;
  comensales?: number;
}

export type FiltroMesa = 'TODAS' | 'LIBRES' | 'OCUPADAS' | 'PENDIENTE_COBRO';
```

**Step 2: Crear tablesStore.ts**

```typescript
// src/features/tables/state/tablesStore.ts
import { create } from 'zustand';
import { Mesa, MesaEstado } from '../types/TablesTypes';

const MESAS_INICIALES: Mesa[] = [
  { id: '01', estado: 'LIBRE' },
  { id: '02', estado: 'OCUPADA', totalCuenta: 45.50, horaApertura: '13:20', comensales: 3 },
  { id: '03', estado: 'LIBRE' },
  { id: '04', estado: 'PENDIENTE_COBRO', totalCuenta: 78.00, horaApertura: '12:45', comensales: 4 },
  { id: '05', estado: 'LIBRE' },
  { id: '06', estado: 'OCUPADA', totalCuenta: 23.00, horaApertura: '14:10', comensales: 2 },
  { id: '07', estado: 'LIBRE' },
  { id: '08', estado: 'OCUPADA', totalCuenta: 112.50, horaApertura: '12:00', comensales: 6 },
  { id: '09', estado: 'LIBRE' },
  { id: '10', estado: 'LIBRE' },
  { id: '11', estado: 'PENDIENTE_COBRO', totalCuenta: 56.75, horaApertura: '13:00', comensales: 3 },
  { id: '12', estado: 'OCUPADA', totalCuenta: 34.25, horaApertura: '14:30', comensales: 2 },
];

interface TablesState {
  mesas: Mesa[];
  setMesaEstado: (id: string, estado: MesaEstado, extra?: Partial<Mesa>) => void;
  liberarMesa: (id: string) => void;
  abrirMesa: (id: string, comensales?: number) => void;
}

export const useTablesStore = create<TablesState>((set) => ({
  mesas: MESAS_INICIALES,
  setMesaEstado: (id, estado, extra = {}) =>
    set((state) => ({
      mesas: state.mesas.map(m => m.id === id ? { ...m, estado, ...extra } : m),
    })),
  liberarMesa: (id) =>
    set((state) => ({
      mesas: state.mesas.map(m =>
        m.id === id
          ? { id: m.id, estado: 'LIBRE' }
          : m
      ),
    })),
  abrirMesa: (id, comensales = 2) =>
    set((state) => ({
      mesas: state.mesas.map(m =>
        m.id === id
          ? { ...m, estado: 'OCUPADA', horaApertura: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), comensales, totalCuenta: 0 }
          : m
      ),
    })),
}));
```

---

### Task 5: feature/tables – API y Logic

**Files:**
- Create: `src/features/tables/api/tablesApi.ts`
- Create: `src/features/tables/logic/useTablesFlow.ts`
- Create: `src/features/tables/tables.manifest.md`

**Step 1: Crear tablesApi.ts**

```typescript
// src/features/tables/api/tablesApi.ts
// Mock API — en Fase 3 se conectará al backend real
export const tablesApi = {
  fetchMesas: async () => {
    return Promise.resolve([]);
  },
};
```

**Step 2: Crear useTablesFlow.ts**

```typescript
// src/features/tables/logic/useTablesFlow.ts
/**
 * SUME DOCBLOCK
 * Nombre: Tables Flow
 * Tipo: Logic Block
 *
 * Entradas: filtro de mesa, búsqueda por número
 * Acciones: filtra mesas, navega a comanda o cobro según estado
 * Salidas: mesas filtradas, handler de tap
 * Errores: TABLES_NAVIGATE_FAILED
 * Dependencias: tablesStore, react-router-dom
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTablesStore } from '../state/tablesStore';
import { FiltroMesa, Mesa } from '../types/TablesTypes';
import { handleError } from '@/core/errors/errorHandler';

export function useTablesFlow() {
  // S — Setup
  const [filtro, setFiltro] = useState<FiltroMesa>('TODAS');
  const [busqueda, setBusqueda] = useState('');
  const navigate = useNavigate();
  const mesas = useTablesStore(s => s.mesas);

  // M — Manage (filtrado)
  const mesasFiltradas = mesas.filter(m => {
    const coincideFiltro =
      filtro === 'TODAS' ||
      (filtro === 'LIBRES' && m.estado === 'LIBRE') ||
      (filtro === 'OCUPADAS' && m.estado === 'OCUPADA') ||
      (filtro === 'PENDIENTE_COBRO' && m.estado === 'PENDIENTE_COBRO');
    const coincideBusqueda = busqueda === '' || m.id.includes(busqueda);
    return coincideFiltro && coincideBusqueda;
  });

  const conteos = {
    libres: mesas.filter(m => m.estado === 'LIBRE').length,
    ocupadas: mesas.filter(m => m.estado === 'OCUPADA').length,
    pendiente: mesas.filter(m => m.estado === 'PENDIENTE_COBRO').length,
  };

  // U — Use (acción principal)
  const handleTapMesa = (mesa: Mesa) => {
    try {
      if (mesa.estado === 'LIBRE') {
        navigate(`/comanda/${mesa.id}`);
      } else if (mesa.estado === 'OCUPADA') {
        navigate(`/comanda/${mesa.id}`);
      } else if (mesa.estado === 'PENDIENTE_COBRO') {
        navigate(`/cobro/${mesa.id}`);
      }
    } catch (error) {
      handleError(error, 'TABLES_NAVIGATE_FAILED');
    }
  };

  // E — Error (gestionado en handleTapMesa)

  return {
    mesasFiltradas,
    conteos,
    filtro,
    setFiltro,
    busqueda,
    setBusqueda,
    handleTapMesa,
  };
}
```

**Step 3: Crear tables.manifest.md**

```markdown
# FEATURE: TABLES
Responsabilidad: Visualizar y gestionar el estado de las mesas del restaurante.

Estado: useTablesStore (Zustand)

Reglas:
- UI solo renderiza y dispara eventos
- La lógica de navegación vive en useTablesFlow
- El store es la única fuente de verdad del estado de mesas

Errores:
- TABLES_NAVIGATE_FAILED
```

---

### Task 6: feature/tables – UI

**Files:**
- Create: `src/features/tables/ui/TablesPage.tsx`
- Create: `src/features/tables/ui/TablesPage.module.css`

**Step 1: Crear TablesPage.tsx**

```tsx
// src/features/tables/ui/TablesPage.tsx
import { useTablesFlow } from '../logic/useTablesFlow';
import { BottomNav } from '@/shared/components/BottomNav';
import { Mesa } from '../types/TablesTypes';
import styles from './TablesPage.module.css';

export function TablesPage() {
  const { mesasFiltradas, conteos, filtro, setFiltro, busqueda, setBusqueda, handleTapMesa } = useTablesFlow();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>🍴</div>
          <h1 className={styles.brandName}>Comandero</h1>
        </div>
        <div className={styles.avatar}>👤</div>
      </header>

      <section className={styles.controls}>
        <div className={styles.searchBar}>
          <span>🔍</span>
          <input
            type="text"
            placeholder="Buscar mesa..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {[
            { key: 'TODAS', label: `Todas (${conteos.libres + conteos.ocupadas + conteos.pendiente})` },
            { key: 'LIBRES', label: `Libres (${conteos.libres})` },
            { key: 'OCUPADAS', label: `Ocupadas (${conteos.ocupadas})` },
            { key: 'PENDIENTE_COBRO', label: `Cobro (${conteos.pendiente})` },
          ].map(f => (
            <button
              key={f.key}
              className={`${styles.pill} ${filtro === f.key ? styles.pillActive : ''}`}
              onClick={() => setFiltro(f.key as any)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.grid}>
        {mesasFiltradas.map(mesa => (
          <MesaCard key={mesa.id} mesa={mesa} onTap={handleTapMesa} />
        ))}
      </section>

      <BottomNav />
    </div>
  );
}

function MesaCard({ mesa, onTap }: { mesa: Mesa; onTap: (m: Mesa) => void }) {
  const estadoClass = {
    LIBRE: styles.libre,
    OCUPADA: styles.ocupada,
    PENDIENTE_COBRO: styles.pendiente,
  }[mesa.estado];

  const estadoLabel = {
    LIBRE: 'LIBRE',
    OCUPADA: 'ABIERTA',
    PENDIENTE_COBRO: 'COBRAR',
  }[mesa.estado];

  return (
    <button className={`${styles.card} ${estadoClass}`} onClick={() => onTap(mesa)}>
      <span className={styles.cardNum}>{mesa.id}</span>
      <span className={styles.cardStatus}>{estadoLabel}</span>
      {mesa.totalCuenta !== undefined && mesa.totalCuenta > 0 && (
        <span className={styles.cardTotal}>{mesa.totalCuenta.toFixed(2)}€</span>
      )}
      {mesa.horaApertura && (
        <span className={styles.cardHora}>{mesa.horaApertura}</span>
      )}
    </button>
  );
}
```

**Step 2: Crear TablesPage.module.css**

```css
/* src/features/tables/ui/TablesPage.module.css */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 16px 16px 160px 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-top: 8px;
}

.logoArea {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logoIcon {
  background-color: #D1FAE5;
  color: var(--color-secondary);
  font-size: 1.5rem;
  padding: 8px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.brandName {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-main);
}

.avatar {
  background-color: #E5E7EB;
  color: #4B5563;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.controls {
  margin-bottom: 24px;
}

.searchBar {
  display: flex;
  align-items: center;
  gap: 12px;
  background-color: var(--color-surface);
  border-radius: 20px;
  padding: 12px 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  margin-bottom: 16px;
}

.searchBar input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 1rem;
  color: var(--text-main);
  background: transparent;
}

.searchBar input::placeholder { color: #9CA3AF; }

.filters {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}

.filters::-webkit-scrollbar { display: none; }

.pill {
  background-color: var(--color-surface);
  color: var(--text-muted);
  border-radius: 20px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  border: 1px solid transparent;
}

.pillActive {
  background-color: var(--color-secondary);
  color: white;
  box-shadow: 0 4px 6px -1px rgba(6,215,160,0.3);
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.card {
  border-radius: 16px;
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: transform 0.1s, opacity 0.1s;
  min-height: 100px;
}

.card:active { transform: scale(0.95); opacity: 0.9; }

.libre {
  background-color: var(--color-secondary);
  color: white;
}

.ocupada {
  background-color: var(--color-dark);
  color: white;
}

.pendiente {
  background-color: var(--color-primary);
  color: white;
}

.cardNum {
  font-size: 1.75rem;
  font-weight: 800;
}

.cardStatus {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  opacity: 0.85;
}

.cardTotal {
  font-size: 0.9rem;
  font-weight: 700;
  margin-top: 4px;
}

.cardHora {
  font-size: 0.7rem;
  opacity: 0.7;
}
```

---

### Task 7: feature/order – Types, Store y API (mock menú)

**Files:**
- Create: `src/features/order/types/OrderTypes.ts`
- Create: `src/features/order/state/orderStore.ts`
- Create: `src/features/order/api/orderApi.ts`

**Step 1: Crear OrderTypes.ts**

```typescript
// src/features/order/types/OrderTypes.ts
export type Categoria = 'Bebidas' | 'Cervezas' | 'Vinos' | 'Carnes' | 'Postres' | 'Otros';

export interface MenuItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: Categoria;
  emoji: string;
}

export interface LineaPedido {
  item: MenuItem;
  cantidad: number;
  nota: string;
}
```

**Step 2: Crear orderApi.ts (mock data)**

```typescript
// src/features/order/api/orderApi.ts
import { MenuItem, Categoria } from '../types/OrderTypes';

export const CATEGORIAS: Categoria[] = ['Bebidas', 'Cervezas', 'Vinos', 'Carnes', 'Postres', 'Otros'];

export const MENU_MOCK: MenuItem[] = [
  // Bebidas
  { id: 'b1', nombre: 'Agua', precio: 1.50, categoria: 'Bebidas', emoji: '💧' },
  { id: 'b2', nombre: 'Coca Cola', precio: 2.50, categoria: 'Bebidas', emoji: '🥤' },
  { id: 'b3', nombre: 'Zumo Naranja', precio: 2.80, categoria: 'Bebidas', emoji: '🍊' },
  { id: 'b4', nombre: 'Café Solo', precio: 1.50, categoria: 'Bebidas', emoji: '☕' },
  { id: 'b5', nombre: 'Té', precio: 1.80, categoria: 'Bebidas', emoji: '🍵' },
  { id: 'b6', nombre: 'Refresco Limón', precio: 2.20, categoria: 'Bebidas', emoji: '🍋' },
  // Cervezas
  { id: 'c1', nombre: 'Caña', precio: 2.00, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c2', nombre: 'Cerveza 1/3', precio: 2.50, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c3', nombre: 'Cerveza Sin', precio: 2.50, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c4', nombre: 'Jarra', precio: 4.00, categoria: 'Cervezas', emoji: '🍺' },
  { id: 'c5', nombre: 'Radler', precio: 2.80, categoria: 'Cervezas', emoji: '🍺' },
  // Vinos
  { id: 'v1', nombre: 'Vino Tinto', precio: 2.50, categoria: 'Vinos', emoji: '🍷' },
  { id: 'v2', nombre: 'Vino Blanco', precio: 2.50, categoria: 'Vinos', emoji: '🥂' },
  { id: 'v3', nombre: 'Rioja Crianza', precio: 4.50, categoria: 'Vinos', emoji: '🍷' },
  { id: 'v4', nombre: 'Albariño', precio: 4.00, categoria: 'Vinos', emoji: '🥂' },
  { id: 'v5', nombre: 'Cava Brut', precio: 5.00, categoria: 'Vinos', emoji: '🍾' },
  // Carnes
  { id: 'ca1', nombre: 'Hamburguesa', precio: 12.00, categoria: 'Carnes', emoji: '🍔' },
  { id: 'ca2', nombre: 'Entrecot 300g', precio: 18.00, categoria: 'Carnes', emoji: '🥩' },
  { id: 'ca3', nombre: 'Pollo Brasa', precio: 13.50, categoria: 'Carnes', emoji: '🍗' },
  { id: 'ca4', nombre: 'Chuletón 500g', precio: 28.00, categoria: 'Carnes', emoji: '🥩' },
  { id: 'ca5', nombre: 'Costillas BBQ', precio: 16.00, categoria: 'Carnes', emoji: '🍖' },
  // Postres
  { id: 'p1', nombre: 'Tarta Queso', precio: 5.50, categoria: 'Postres', emoji: '🍰' },
  { id: 'p2', nombre: 'Brownie', precio: 4.50, categoria: 'Postres', emoji: '🍫' },
  { id: 'p3', nombre: 'Helado 2 Bolas', precio: 3.50, categoria: 'Postres', emoji: '🍨' },
  { id: 'p4', nombre: 'Tiramisú', precio: 5.00, categoria: 'Postres', emoji: '🍮' },
  { id: 'p5', nombre: 'Flan Casero', precio: 4.00, categoria: 'Postres', emoji: '🍮' },
  // Otros
  { id: 'o1', nombre: 'Patatas Bravas', precio: 6.00, categoria: 'Otros', emoji: '🍟' },
  { id: 'o2', nombre: 'Ensalada César', precio: 9.00, categoria: 'Otros', emoji: '🥗' },
  { id: 'o3', nombre: 'Pan de Ajo', precio: 3.50, categoria: 'Otros', emoji: '🍞' },
  { id: 'o4', nombre: 'Croquetas (6ud)', precio: 7.00, categoria: 'Otros', emoji: '🫓' },
  { id: 'o5', nombre: 'Tabla de Quesos', precio: 12.00, categoria: 'Otros', emoji: '🧀' },
];

export const orderApi = {
  fetchMenu: async (): Promise<MenuItem[]> => Promise.resolve(MENU_MOCK),
};
```

**Step 3: Crear orderStore.ts**

```typescript
// src/features/order/state/orderStore.ts
import { create } from 'zustand';
import { LineaPedido, MenuItem } from '../types/OrderTypes';

interface OrderState {
  carritoPorMesa: Record<string, LineaPedido[]>;
  addItem: (mesaId: string, item: MenuItem) => void;
  removeItem: (mesaId: string, itemId: string) => void;
  clearCarrito: (mesaId: string) => void;
  getCarrito: (mesaId: string) => LineaPedido[];
  getTotal: (mesaId: string) => number;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  carritoPorMesa: {},

  addItem: (mesaId, item) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    const existente = carrito.find(l => l.item.id === item.id);
    const nuevoCarrito = existente
      ? carrito.map(l => l.item.id === item.id ? { ...l, cantidad: l.cantidad + 1 } : l)
      : [...carrito, { item, cantidad: 1, nota: '' }];
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: nuevoCarrito } };
  }),

  removeItem: (mesaId, itemId) => set(state => {
    const carrito = state.carritoPorMesa[mesaId] ?? [];
    const nuevoCarrito = carrito
      .map(l => l.item.id === itemId ? { ...l, cantidad: l.cantidad - 1 } : l)
      .filter(l => l.cantidad > 0);
    return { carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: nuevoCarrito } };
  }),

  clearCarrito: (mesaId) => set(state => ({
    carritoPorMesa: { ...state.carritoPorMesa, [mesaId]: [] },
  })),

  getCarrito: (mesaId) => get().carritoPorMesa[mesaId] ?? [],

  getTotal: (mesaId) => {
    const carrito = get().carritoPorMesa[mesaId] ?? [];
    return carrito.reduce((acc, l) => acc + l.item.precio * l.cantidad, 0);
  },
}));
```

---

### Task 8: feature/order – Logic y Manifest

**Files:**
- Create: `src/features/order/logic/useOrderFlow.ts`
- Create: `src/features/order/order.manifest.md`

**Step 1: Crear useOrderFlow.ts**

```typescript
// src/features/order/logic/useOrderFlow.ts
/**
 * SUME DOCBLOCK
 * Nombre: Order Flow
 * Tipo: Logic Block
 *
 * Entradas: mesaId (params), categoría activa, tap item
 * Acciones: filtra menú por categoría, gestiona carrito, envía pedido
 * Salidas: items filtrados, carrito, total, handlers
 * Errores: ORDER_SEND_FAILED
 * Dependencias: orderStore, tablesStore, orderApi, react-router-dom
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MENU_MOCK, CATEGORIAS } from '../api/orderApi';
import { useOrderStore } from '../state/orderStore';
import { useTablesStore } from '@/features/tables/state/tablesStore';
import { Categoria, MenuItem } from '../types/OrderTypes';
import { handleError } from '@/core/errors/errorHandler';

export function useOrderFlow(mesaId: string) {
  // S — Setup
  const [categoriaActiva, setCategoriaActiva] = useState<Categoria>('Bebidas');
  const [carritoVisible, setCarritoVisible] = useState(false);
  const navigate = useNavigate();

  const { addItem, removeItem, getCarrito, getTotal } = useOrderStore();
  const abrirMesa = useTablesStore(s => s.abrirMesa);
  const setMesaEstado = useTablesStore(s => s.setMesaEstado);

  const carrito = getCarrito(mesaId);
  const total = getTotal(mesaId);
  const itemsCategoria = MENU_MOCK.filter(i => i.categoria === categoriaActiva);

  // U — Use (acción principal: marchar pedido)
  const handleMarcharPedido = () => {
    try {
      if (carrito.length === 0) return;
      abrirMesa(mesaId);
      setMesaEstado(mesaId, 'OCUPADA', { totalCuenta: total });
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'ORDER_SEND_FAILED');
    }
  };

  // M — Manage
  const handleAddItem = (item: MenuItem) => addItem(mesaId, item);
  const handleRemoveItem = (itemId: string) => removeItem(mesaId, itemId);
  const getCantidadItem = (itemId: string) =>
    carrito.find(l => l.item.id === itemId)?.cantidad ?? 0;

  // E — Error (gestionado en handleMarcharPedido)

  return {
    categorias: CATEGORIAS,
    categoriaActiva,
    setCategoriaActiva,
    itemsCategoria,
    carrito,
    total,
    carritoVisible,
    setCarritoVisible,
    handleAddItem,
    handleRemoveItem,
    handleMarcharPedido,
    getCantidadItem,
  };
}
```

**Step 2: Crear order.manifest.md**

```markdown
# FEATURE: ORDER
Responsabilidad: Toma de comandas por mesa. Gestión del carrito y envío a cocina/barra.

Estado: useOrderStore (Zustand) — carrito por mesa

Reglas:
- UI solo renderiza y dispara eventos de addItem/removeItem
- useOrderFlow centraliza la lógica de carrito y navegación
- Al marchar pedido, tablesStore actualiza el estado de la mesa

Errores:
- ORDER_SEND_FAILED
```

---

### Task 9: feature/order – UI

**Files:**
- Create: `src/features/order/ui/OrderPage.tsx`
- Create: `src/features/order/ui/OrderPage.module.css`

**Step 1: Crear OrderPage.tsx**

```tsx
// src/features/order/ui/OrderPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderFlow } from '../logic/useOrderFlow';
import styles from './OrderPage.module.css';

export function OrderPage() {
  const { mesaId = '01' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const {
    categorias, categoriaActiva, setCategoriaActiva,
    itemsCategoria, carrito, total,
    carritoVisible, setCarritoVisible,
    handleAddItem, handleRemoveItem,
    handleMarcharPedido, getCantidadItem,
  } = useOrderFlow(mesaId);

  const totalItems = carrito.reduce((acc, l) => acc + l.cantidad, 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/mesas')}>
          ← Mesas
        </button>
        <h2 className={styles.mesaTitle}>Mesa {mesaId}</h2>
        <button className={styles.cartBtn} onClick={() => setCarritoVisible(!carritoVisible)}>
          🛒
          {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
        </button>
      </header>

      {/* Category Tabs */}
      <nav className={styles.catTabs}>
        {categorias.map(cat => (
          <button
            key={cat}
            className={`${styles.catTab} ${categoriaActiva === cat ? styles.catTabActive : ''}`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Items Grid */}
      <section className={styles.itemsGrid}>
        {itemsCategoria.map(item => {
          const qty = getCantidadItem(item.id);
          return (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemEmoji}>{item.emoji}</div>
              <div className={styles.itemNombre}>{item.nombre}</div>
              <div className={styles.itemPrecio}>{item.precio.toFixed(2)}€</div>
              <div className={styles.itemControls}>
                {qty > 0 ? (
                  <>
                    <button className={styles.qtyBtn} onClick={() => handleRemoveItem(item.id)}>−</button>
                    <span className={styles.qtyNum}>{qty}</span>
                  </>
                ) : null}
                <button className={styles.addBtn} onClick={() => handleAddItem(item)}>+</button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Carrito Panel */}
      {carritoVisible && (
        <div className={styles.carritoPanel}>
          <div className={styles.carritoHeader}>
            <h3>Carrito</h3>
            <button onClick={() => setCarritoVisible(false)}>✕</button>
          </div>
          {carrito.length === 0 ? (
            <p className={styles.carritoVacio}>Sin items</p>
          ) : (
            <>
              {carrito.map(linea => (
                <div key={linea.item.id} className={styles.carritoLinea}>
                  <span className={styles.carritoEmoji}>{linea.item.emoji}</span>
                  <span className={styles.carritoNombre}>{linea.item.nombre}</span>
                  <span className={styles.carritoCantidad}>×{linea.cantidad}</span>
                  <span className={styles.carritoSubtotal}>{(linea.item.precio * linea.cantidad).toFixed(2)}€</span>
                </div>
              ))}
              <div className={styles.carritoTotal}>
                <span>Total</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Marchar */}
      {carrito.length > 0 && (
        <div className={styles.fabContainer}>
          <button className={styles.marchBtn} onClick={handleMarcharPedido}>
            🚀 MARCHAR PEDIDO · {total.toFixed(2)}€
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Crear OrderPage.module.css**

```css
/* src/features/order/ui/OrderPage.module.css */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--color-surface);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.backBtn {
  background: transparent;
  color: var(--color-tertiary);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 8px;
  box-shadow: none;
}

.mesaTitle {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0;
}

.cartBtn {
  position: relative;
  background: var(--color-bg);
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
  padding: 0;
}

.cartBadge {
  position: absolute;
  top: -4px;
  right: -4px;
  background-color: var(--color-primary);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.catTabs {
  display: flex;
  overflow-x: auto;
  gap: 0;
  background-color: var(--color-surface);
  border-bottom: 2px solid var(--color-border);
  padding: 0 8px;
  scrollbar-width: none;
}

.catTabs::-webkit-scrollbar { display: none; }

.catTab {
  background: transparent;
  color: var(--text-muted);
  font-size: 0.88rem;
  font-weight: 600;
  padding: 14px 16px;
  white-space: nowrap;
  border-radius: 0;
  box-shadow: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
}

.catTabActive {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.itemsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 16px;
}

.itemCard {
  background: var(--color-surface);
  border-radius: 16px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.06);
}

.itemEmoji { font-size: 2rem; }

.itemNombre {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-main);
  text-align: center;
}

.itemPrecio {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-primary);
}

.itemControls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.qtyBtn {
  background: var(--color-bg);
  color: var(--text-main);
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.qtyNum {
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-dark);
  min-width: 20px;
  text-align: center;
}

.addBtn {
  background-color: var(--color-secondary);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  font-size: 1.3rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 6px rgba(6,215,160,0.4);
}

/* Carrito Panel */
.carritoPanel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 20px 16px;
  box-shadow: 0 -8px 20px rgba(0,0,0,0.12);
  z-index: 50;
  max-height: 60vh;
  overflow-y: auto;
}

.carritoHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.carritoHeader h3 { font-size: 1.1rem; font-weight: 700; color: var(--color-dark); margin: 0; }
.carritoHeader button { background: transparent; color: var(--text-muted); font-size: 1.2rem; box-shadow: none; padding: 4px; }

.carritoVacio { color: var(--text-muted); text-align: center; padding: 16px; }

.carritoLinea {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.carritoEmoji { font-size: 1.3rem; }
.carritoNombre { flex: 1; font-size: 0.9rem; font-weight: 500; color: var(--text-main); }
.carritoCantidad { font-size: 0.9rem; color: var(--text-muted); }
.carritoSubtotal { font-size: 0.95rem; font-weight: 700; color: var(--color-dark); }

.carritoTotal {
  display: flex;
  justify-content: space-between;
  padding: 14px 0 4px 0;
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-dark);
}

/* FAB */
.fabContainer {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
}

.marchBtn {
  width: 100%;
  background-color: var(--color-primary);
  color: white;
  border-radius: 30px;
  padding: 18px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 10px 15px -3px rgba(240,71,112,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
```

---

### Task 10: feature/checkout – Types, Store, API

**Files:**
- Create: `src/features/checkout/types/CheckoutTypes.ts`
- Create: `src/features/checkout/state/checkoutStore.ts`
- Create: `src/features/checkout/api/checkoutApi.ts`

**Step 1: Crear CheckoutTypes.ts**

```typescript
// src/features/checkout/types/CheckoutTypes.ts
export type MetodoPago = 'EFECTIVO' | 'TARJETA' | 'QR';

export interface ItemResumen {
  nombre: string;
  cantidad: number;
  precioUnit: number;
  emoji: string;
}

export interface CuentaSeparada {
  id: number;
  items: ItemResumen[];
}
```

**Step 2: Crear checkoutStore.ts**

```typescript
// src/features/checkout/state/checkoutStore.ts
import { create } from 'zustand';

interface CheckoutState {
  pagado: Record<string, boolean>;
  setPagado: (mesaId: string) => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  pagado: {},
  setPagado: (mesaId) => set(state => ({
    pagado: { ...state.pagado, [mesaId]: true },
  })),
}));
```

**Step 3: Crear checkoutApi.ts**

```typescript
// src/features/checkout/api/checkoutApi.ts
// Mock — en Fase 3 enviará la factura al backend
export const checkoutApi = {
  cerrarCuenta: async (_mesaId: string) => Promise.resolve({ ok: true }),
};
```

---

### Task 11: feature/checkout – Logic y Manifest

**Files:**
- Create: `src/features/checkout/logic/useCheckoutFlow.ts`
- Create: `src/features/checkout/checkout.manifest.md`

**Step 1: Crear useCheckoutFlow.ts**

```typescript
// src/features/checkout/logic/useCheckoutFlow.ts
/**
 * SUME DOCBLOCK
 * Nombre: Checkout Flow
 * Tipo: Logic Block
 *
 * Entradas: mesaId, número de personas para split
 * Acciones: calcula total, divide por personas, cierra mesa
 * Salidas: items resumen, total, cuotaPorPersona, handler cobrar
 * Errores: CHECKOUT_CLOSE_FAILED
 * Dependencias: orderStore, tablesStore, checkoutStore, react-router-dom
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderStore } from '@/features/order/state/orderStore';
import { useTablesStore } from '@/features/tables/state/tablesStore';
import { handleError } from '@/core/errors/errorHandler';
import { MetodoPago } from '../types/CheckoutTypes';

export function useCheckoutFlow(mesaId: string) {
  // S — Setup
  const [numPersonas, setNumPersonas] = useState(1);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('EFECTIVO');
  const navigate = useNavigate();

  const carrito = useOrderStore(s => s.getCarrito(mesaId));
  const total = useOrderStore(s => s.getTotal(mesaId));
  const clearCarrito = useOrderStore(s => s.clearCarrito);
  const liberarMesa = useTablesStore(s => s.liberarMesa);

  // M — Manage
  const cuotaPorPersona = numPersonas > 0 ? total / numPersonas : total;

  // Agrupar líneas por item (consolidar si hay duplicados)
  const itemsResumen = carrito.map(l => ({
    nombre: l.item.nombre,
    cantidad: l.cantidad,
    precioUnit: l.item.precio,
    emoji: l.item.emoji,
    subtotal: l.item.precio * l.cantidad,
  }));

  // U — Use (acción principal: cobrar)
  const handleCobrar = () => {
    try {
      clearCarrito(mesaId);
      liberarMesa(mesaId);
      navigate('/mesas');
    } catch (error) {
      handleError(error, 'CHECKOUT_CLOSE_FAILED');
    }
  };

  // E — Error (gestionado en handleCobrar)

  return {
    itemsResumen,
    total,
    numPersonas,
    setNumPersonas,
    cuotaPorPersona,
    metodoPago,
    setMetodoPago,
    handleCobrar,
    mesaInfo: useTablesStore.getState().mesas.find(m => m.id === mesaId),
  };
}
```

**Step 2: Crear checkout.manifest.md**

```markdown
# FEATURE: CHECKOUT
Responsabilidad: Cobro de cuenta y cierre de mesa. Split bill por personas.

Estado: useCheckoutStore (Zustand), lee de useOrderStore

Reglas:
- Al cobrar: limpia carrito de la mesa y libera la mesa en tablesStore
- UI solo renderiza y dispara handleCobrar
- Split bill es cálculo local, no requiere estado global

Errores:
- CHECKOUT_CLOSE_FAILED
```

---

### Task 12: feature/checkout – UI

**Files:**
- Create: `src/features/checkout/ui/CheckoutPage.tsx`
- Create: `src/features/checkout/ui/CheckoutPage.module.css`

**Step 1: Crear CheckoutPage.tsx**

```tsx
// src/features/checkout/ui/CheckoutPage.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useCheckoutFlow } from '../logic/useCheckoutFlow';
import styles from './CheckoutPage.module.css';
import { MetodoPago } from '../types/CheckoutTypes';

export function CheckoutPage() {
  const { mesaId = '01' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const {
    itemsResumen, total, numPersonas, setNumPersonas,
    cuotaPorPersona, metodoPago, setMetodoPago, handleCobrar,
  } = useCheckoutFlow(mesaId);

  const metodos: { key: MetodoPago; emoji: string; label: string }[] = [
    { key: 'EFECTIVO', emoji: '💵', label: 'Efectivo' },
    { key: 'TARJETA', emoji: '💳', label: 'Tarjeta' },
    { key: 'QR', emoji: '📱', label: 'QR/Bizum' },
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/mesas')}>
          ← Mesas
        </button>
        <h2 className={styles.title}>Cobro · Mesa {mesaId}</h2>
        <div style={{ width: 60 }} />
      </header>

      {/* Items resumen */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Resumen de cuenta</h3>
        {itemsResumen.length === 0 ? (
          <p className={styles.empty}>Sin items en la comanda</p>
        ) : (
          itemsResumen.map((item, i) => (
            <div key={i} className={styles.lineaItem}>
              <span className={styles.itemEmoji}>{item.emoji}</span>
              <span className={styles.itemNombre}>{item.nombre}</span>
              <span className={styles.itemQty}>×{item.cantidad}</span>
              <span className={styles.itemSubtotal}>{item.subtotal.toFixed(2)}€</span>
            </div>
          ))
        )}
        <div className={styles.totalRow}>
          <span>TOTAL</span>
          <span className={styles.totalAmount}>{total.toFixed(2)}€</span>
        </div>
      </section>

      {/* Split Bill */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Dividir cuenta</h3>
        <div className={styles.splitControls}>
          <button
            className={styles.splitBtn}
            onClick={() => setNumPersonas(Math.max(1, numPersonas - 1))}
          >−</button>
          <div className={styles.splitInfo}>
            <span className={styles.splitNum}>{numPersonas}</span>
            <span className={styles.splitLabel}>persona{numPersonas > 1 ? 's' : ''}</span>
          </div>
          <button
            className={styles.splitBtn}
            onClick={() => setNumPersonas(numPersonas + 1)}
          >+</button>
        </div>
        {numPersonas > 1 && (
          <div className={styles.cuotaBox}>
            <span className={styles.cuotaLabel}>Cada persona paga</span>
            <span className={styles.cuotaAmount}>{cuotaPorPersona.toFixed(2)}€</span>
          </div>
        )}
      </section>

      {/* Método de pago */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Método de pago</h3>
        <div className={styles.metodosGrid}>
          {metodos.map(m => (
            <button
              key={m.key}
              className={`${styles.metodoBtn} ${metodoPago === m.key ? styles.metodoBtnActive : ''}`}
              onClick={() => setMetodoPago(m.key)}
            >
              <span className={styles.metodoEmoji}>{m.emoji}</span>
              <span className={styles.metodoLabel}>{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Botón cobrar */}
      <div className={styles.fabContainer}>
        <button className={styles.cobrarBtn} onClick={handleCobrar}>
          ✅ COBRAR {total.toFixed(2)}€ · {metodoPago}
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Crear CheckoutPage.module.css**

```css
/* src/features/checkout/ui/CheckoutPage.module.css */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: var(--color-surface);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 10;
}

.backBtn {
  background: transparent;
  color: var(--color-tertiary);
  font-weight: 600;
  font-size: 0.95rem;
  padding: 8px;
  box-shadow: none;
}

.title {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0;
}

.section {
  background: var(--color-surface);
  margin: 12px 16px 0 16px;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.sectionTitle {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin: 0 0 12px 0;
}

.empty { color: var(--text-muted); font-size: 0.9rem; }

.lineaItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.itemEmoji { font-size: 1.2rem; }
.itemNombre { flex: 1; font-size: 0.9rem; color: var(--text-main); }
.itemQty { color: var(--text-muted); font-size: 0.85rem; }
.itemSubtotal { font-weight: 700; font-size: 0.95rem; color: var(--color-dark); }

.totalRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-main);
}

.totalAmount {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--color-dark);
}

/* Split Bill */
.splitControls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
}

.splitBtn {
  background: var(--color-bg);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  color: var(--color-dark);
}

.splitInfo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.splitNum {
  font-size: 2.5rem;
  font-weight: 900;
  color: var(--color-dark);
  line-height: 1;
}

.splitLabel { font-size: 0.8rem; color: var(--text-muted); }

.cuotaBox {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, var(--color-secondary), #04b887);
  color: white;
  border-radius: 12px;
  padding: 14px 16px;
  margin-top: 16px;
}

.cuotaLabel { font-size: 0.9rem; font-weight: 600; }
.cuotaAmount { font-size: 1.4rem; font-weight: 900; }

/* Métodos de pago */
.metodosGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.metodoBtn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border-radius: 12px;
  background: var(--color-bg);
  color: var(--text-muted);
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  border: 2px solid transparent;
}

.metodoEmoji { font-size: 1.6rem; }

.metodoBtnActive {
  background: white;
  color: var(--color-dark);
  border-color: var(--color-secondary);
  box-shadow: 0 4px 6px rgba(6,215,160,0.2);
}

/* FAB */
.fabContainer {
  position: fixed;
  bottom: 16px;
  left: 16px;
  right: 16px;
}

.cobrarBtn {
  width: 100%;
  background: linear-gradient(135deg, var(--color-secondary), #04b887);
  color: white;
  border-radius: 30px;
  padding: 18px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 10px 15px -3px rgba(6,215,160,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
```

---

### Task 13: feature/menu-ingest – Todo

**Files:**
- Create: `src/features/menu-ingest/types/MenuIngestTypes.ts`
- Create: `src/features/menu-ingest/state/menuIngestStore.ts`
- Create: `src/features/menu-ingest/api/menuIngestApi.ts`
- Create: `src/features/menu-ingest/logic/useMenuIngestFlow.ts`
- Create: `src/features/menu-ingest/ui/MenuIngestPage.tsx`
- Create: `src/features/menu-ingest/ui/MenuIngestPage.module.css`
- Create: `src/features/menu-ingest/menu-ingest.manifest.md`

**Step 1: Crear MenuIngestTypes.ts**

```typescript
// src/features/menu-ingest/types/MenuIngestTypes.ts
export interface ItemImportado {
  nombre: string;
  precio: number;
  categoriaDetectada: string;
  emoji: string;
}

export type EstadoIngesta = 'IDLE' | 'PROCESANDO' | 'REVISANDO' | 'GUARDADO';
```

**Step 2: Crear menuIngestStore.ts**

```typescript
// src/features/menu-ingest/state/menuIngestStore.ts
import { create } from 'zustand';
import { ItemImportado, EstadoIngesta } from '../types/MenuIngestTypes';

interface MenuIngestState {
  items: ItemImportado[];
  estado: EstadoIngesta;
  setItems: (items: ItemImportado[]) => void;
  setEstado: (estado: EstadoIngesta) => void;
  clear: () => void;
}

export const useMenuIngestStore = create<MenuIngestState>((set) => ({
  items: [],
  estado: 'IDLE',
  setItems: (items) => set({ items }),
  setEstado: (estado) => set({ estado }),
  clear: () => set({ items: [], estado: 'IDLE' }),
}));
```

**Step 3: Crear menuIngestApi.ts**

```typescript
// src/features/menu-ingest/api/menuIngestApi.ts
import { ItemImportado } from '../types/MenuIngestTypes';

const CATEGORIAS_KEYWORDS: Record<string, string[]> = {
  Bebidas: ['agua', 'café', 'té', 'zumo', 'refresco', 'cola', 'fanta'],
  Cervezas: ['caña', 'cerveza', 'jarra', 'radler', 'stout', 'ipa'],
  Vinos: ['vino', 'rioja', 'albariño', 'cava', 'champán', 'rosado'],
  Carnes: ['hamburguesa', 'entrecot', 'pollo', 'chuletón', 'costilla', 'ternera', 'cerdo'],
  Postres: ['tarta', 'brownie', 'helado', 'tiramisú', 'flan', 'mousse', 'crepe'],
  Otros: [],
};

const CATEGORIA_EMOJIS: Record<string, string> = {
  Bebidas: '🥤', Cervezas: '🍺', Vinos: '🍷',
  Carnes: '🥩', Postres: '🍰', Otros: '🍽️',
};

function categorizarItem(nombre: string): { categoria: string; emoji: string } {
  const nombreLower = nombre.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORIAS_KEYWORDS)) {
    if (cat === 'Otros') continue;
    if (keywords.some(k => nombreLower.includes(k))) {
      return { categoria: cat, emoji: CATEGORIA_EMOJIS[cat] };
    }
  }
  return { categoria: 'Otros', emoji: '🍽️' };
}

export const menuIngestApi = {
  procesarCSV: async (csvText: string): Promise<ItemImportado[]> => {
    const lineas = csvText.trim().split('\n').slice(1); // skip header
    return lineas.map(linea => {
      const [nombre, precioRaw] = linea.split(',').map(s => s.trim());
      const precio = parseFloat(precioRaw?.replace(',', '.') ?? '0') || 0;
      const { categoria, emoji } = categorizarItem(nombre ?? '');
      return { nombre: nombre ?? '', precio, categoriaDetectada: categoria, emoji };
    }).filter(i => i.nombre);
  },

  guardarMenu: async (_items: ItemImportado[]) => Promise.resolve({ ok: true }),
};
```

**Step 4: Crear useMenuIngestFlow.ts**

```typescript
// src/features/menu-ingest/logic/useMenuIngestFlow.ts
/**
 * SUME DOCBLOCK
 * Nombre: Menu Ingest Flow
 * Tipo: Logic Block
 *
 * Entradas: archivo CSV
 * Acciones: parsea CSV, categoriza items (mock IA), muestra preview
 * Salidas: items importados, estado de proceso
 * Errores: MENU_INGEST_PARSE_FAILED, MENU_INGEST_SAVE_FAILED
 * Dependencias: menuIngestStore, menuIngestApi
 */
import { useMenuIngestStore } from '../state/menuIngestStore';
import { menuIngestApi } from '../api/menuIngestApi';
import { handleError } from '@/core/errors/errorHandler';

export function useMenuIngestFlow() {
  // S — Setup
  const { items, estado, setItems, setEstado, clear } = useMenuIngestStore();

  // U — Use
  const handleArchivoCSV = async (archivo: File) => {
    try {
      setEstado('PROCESANDO');
      const texto = await archivo.text();
      const itemsImportados = await menuIngestApi.procesarCSV(texto);
      setItems(itemsImportados);
      setEstado('REVISANDO');
    } catch (error) {
      handleError(error, 'MENU_INGEST_PARSE_FAILED');
      setEstado('IDLE');
    }
  };

  const handleGuardar = async () => {
    try {
      setEstado('PROCESANDO');
      await menuIngestApi.guardarMenu(items);
      setEstado('GUARDADO');
    } catch (error) {
      handleError(error, 'MENU_INGEST_SAVE_FAILED');
      setEstado('REVISANDO');
    }
  };

  // M — Manage
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const archivo = e.dataTransfer.files[0];
    if (archivo?.name.endsWith('.csv')) handleArchivoCSV(archivo);
  };

  // E — Error (gestionado en cada handler)

  return { items, estado, handleArchivoCSV, handleGuardar, handleDrop, clear };
}
```

**Step 5: Crear MenuIngestPage.tsx**

```tsx
// src/features/menu-ingest/ui/MenuIngestPage.tsx
import React, { useRef } from 'react';
import { useMenuIngestFlow } from '../logic/useMenuIngestFlow';
import { BottomNav } from '@/shared/components/BottomNav';
import styles from './MenuIngestPage.module.css';

export function MenuIngestPage() {
  const { items, estado, handleArchivoCSV, handleGuardar, handleDrop, clear } = useMenuIngestFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) handleArchivoCSV(archivo);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚙️ Carta del restaurante</h1>
        <p className={styles.subtitle}>Importa tu menú desde un CSV</p>
      </header>

      {/* Drop Zone */}
      {estado === 'IDLE' && (
        <div
          className={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
        >
          <span className={styles.dropIcon}>📄</span>
          <p className={styles.dropText}>Arrastra tu CSV aquí</p>
          <p className={styles.dropSub}>o toca para seleccionar archivo</p>
          <p className={styles.dropFormat}>Formato: nombre, precio</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Procesando */}
      {estado === 'PROCESANDO' && (
        <div className={styles.procesando}>
          <div className={styles.spinner}>⏳</div>
          <p>Procesando con IA...</p>
        </div>
      )}

      {/* Preview tabla */}
      {(estado === 'REVISANDO' || estado === 'GUARDADO') && (
        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <span className={styles.previewCount}>{items.length} items detectados</span>
            {estado !== 'GUARDADO' && (
              <button className={styles.resetBtn} onClick={clear}>✕ Cancelar</button>
            )}
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className={styles.tdEmoji}>{item.emoji}</td>
                    <td className={styles.tdNombre}>{item.nombre}</td>
                    <td>
                      <span className={styles.catBadge}>{item.categoriaDetectada}</span>
                    </td>
                    <td className={styles.tdPrecio}>{item.precio.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Guardado OK */}
      {estado === 'GUARDADO' && (
        <div className={styles.guardadoOk}>
          ✅ Carta guardada correctamente
        </div>
      )}

      {/* FAB Guardar */}
      {estado === 'REVISANDO' && (
        <div className={styles.fabContainer}>
          <button className={styles.guardarBtn} onClick={handleGuardar}>
            💾 GUARDAR EN SISTEMA ({items.length} items)
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
```

**Step 6: Crear MenuIngestPage.module.css**

```css
/* src/features/menu-ingest/ui/MenuIngestPage.module.css */
.container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg);
  padding: 16px 16px 160px 16px;
}

.header {
  margin-bottom: 24px;
  padding-top: 8px;
}

.title {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--color-dark);
  margin: 0 0 4px 0;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin: 0;
}

.dropZone {
  background: var(--color-surface);
  border: 2px dashed var(--color-border);
  border-radius: 20px;
  padding: 48px 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.dropZone:hover, .dropZone:active {
  border-color: var(--color-tertiary);
  background: #f0f9ff;
}

.dropIcon { font-size: 3rem; }
.dropText { font-size: 1.1rem; font-weight: 700; color: var(--color-dark); margin: 0; }
.dropSub { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
.dropFormat {
  font-size: 0.78rem;
  color: var(--text-muted);
  background: var(--color-bg);
  padding: 4px 12px;
  border-radius: 20px;
  margin-top: 8px;
  font-family: monospace;
}

.procesando {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  color: var(--text-muted);
}

.spinner { font-size: 3rem; animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.previewSection {
  background: var(--color-surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
}

.previewHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border);
}

.previewCount { font-size: 0.9rem; font-weight: 700; color: var(--color-dark); }
.resetBtn {
  background: transparent;
  color: var(--text-muted);
  font-size: 0.85rem;
  box-shadow: none;
  padding: 4px 8px;
}

.tableWrapper { overflow-x: auto; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
}

.table th {
  background: var(--color-bg);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 10px 12px;
  text-align: left;
}

.table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border);
  color: var(--text-main);
  vertical-align: middle;
}

.tdEmoji { font-size: 1.2rem; width: 40px; }
.tdNombre { font-weight: 500; }
.tdPrecio { font-weight: 700; color: var(--color-primary); }

.catBadge {
  background: #EEF2FF;
  color: var(--color-tertiary);
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.guardadoOk {
  background: #D1FAE5;
  color: #065F46;
  border-radius: 12px;
  padding: 14px 16px;
  font-weight: 600;
  text-align: center;
  margin-top: 16px;
}

.fabContainer {
  position: fixed;
  bottom: 80px;
  left: 16px;
  right: 16px;
}

.guardarBtn {
  width: 100%;
  background-color: var(--color-tertiary);
  color: white;
  border-radius: 30px;
  padding: 18px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 10px 15px -3px rgba(16,138,177,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
```

**Step 7: Crear menu-ingest.manifest.md**

```markdown
# FEATURE: MENU-INGEST
Responsabilidad: Importación y categorización automática de carta desde CSV.

Estado: useMenuIngestStore (Zustand) — items importados y estado de proceso

Reglas:
- La categorización mock vive en menuIngestApi.procesarCSV
- En Fase 3 se reemplaza por llamada real a LLM
- UI solo dispara handleArchivoCSV y handleGuardar

Errores:
- MENU_INGEST_PARSE_FAILED
- MENU_INGEST_SAVE_FAILED
```

---

### Task 14: Conectar Router con todas las features

**Files:**
- Modify: `src/app/router.tsx`
- Modify: `src/App.tsx`

**Step 1: Actualizar src/app/router.tsx**

```tsx
// src/app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { TablesPage } from '@/features/tables/ui/TablesPage';
import { OrderPage } from '@/features/order/ui/OrderPage';
import { CheckoutPage } from '@/features/checkout/ui/CheckoutPage';
import { MenuIngestPage } from '@/features/menu-ingest/ui/MenuIngestPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mesas" replace /> },
  { path: '/mesas', element: <TablesPage /> },
  { path: '/comanda/:mesaId', element: <OrderPage /> },
  { path: '/cobro/:mesaId', element: <CheckoutPage /> },
  { path: '/admin/carta', element: <MenuIngestPage /> },
  { path: '/comandas', element: <TablesPage /> },
  { path: '/historial', element: <TablesPage /> },
]);
```

**Step 2: Actualizar src/App.tsx**

```tsx
// src/App.tsx
// Entry point delegado al RouterProvider en main.tsx
// Este archivo queda vacío — la app se monta desde main.tsx
export {};
```

**Step 3: Verificar que compila y arranca**

```bash
npm run dev
```

Expected: App arranca en localhost, ruta `/` redirige a `/mesas`, todas las pantallas navegables.

---

### Task 15: Actualizar vite.config para alias @

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.app.json`

**Step 1: Actualizar vite.config.ts**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Step 2: Actualizar tsconfig.app.json**

Añadir en `compilerOptions`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 3: Build final**

```bash
npm run build
```

Expected: Build limpio sin errores TypeScript.

---

### Task 16: Eliminar DashboardPage obsoleto

**Files:**
- Delete lógica obsoleta: `src/features/dashboard/` (opcional — no rompe nada si se deja)
- Verify: `src/App.tsx` no importa DashboardPage

**Step 1: Verificar que App.tsx ya no importa DashboardPage**

Comprobar que `src/App.tsx` no tiene imports del dashboard antiguo. Si los tiene, reemplazar por `export {};`.

---

## Verificación Final

```bash
# Desde fronted/app/
npm run build   # Sin errores TypeScript
npm run dev     # App arranca
```

Flujo completo a verificar manualmente:
1. `/mesas` — Ver grid de 12 mesas con colores correctos
2. Tap mesa LIBRE → `/comanda/XX` — Ver categorías y items
3. Añadir items → Ver badge en carrito → Tap carrito → Ver panel
4. "MARCHAR PEDIDO" → Volver a `/mesas`, mesa ahora OCUPADA
5. Tap mesa OCUPADA → `/comanda/XX` — Añadir más items
6. Tap mesa PENDIENTE_COBRO → `/cobro/XX` — Ver resumen
7. Cambiar personas → Ver split
8. "COBRAR" → Mesa vuelve a LIBRE
9. `/admin/carta` desde bottom nav → Upload CSV mock

---
