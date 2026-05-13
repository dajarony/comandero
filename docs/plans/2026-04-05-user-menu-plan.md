# UserMenu — Avatar con Logout — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reemplazar el `<div>👤</div>` vacío del header por un componente `UserMenu` que muestra la inicial del usuario y al pulsar abre un panel con nombre, rol y botón de cerrar sesión.

**Architecture:** Componente compartido en `src/shared/components/UserMenu.tsx` que lee `useAuthStore` directamente. Al pulsar fuera del panel se cierra via `useRef` + `useEffect`. Al cerrar sesión llama `logout()` y navega a `/login`. Se integra en `TablesPage.tsx` reemplazando el avatar estático.

**Tech Stack:** React 18, TypeScript, CSS Modules, Zustand (`useAuthStore`), React Router (`useNavigate`)

---

### Task 1: Crear `UserMenu.tsx`

**Files:**
- Create: `fronted/app/src/shared/components/UserMenu.tsx`

**Step 1: Crear el archivo con este contenido exacto**

```tsx
/**
 * @module UserMenu
 * @description Avatar de usuario con menú desplegable — nombre, rol y logout.
 * SUME Docblock v2.0
 * Entradas : useAuthStore (usuario, logout)
 * Lógica   : Abre/cierra panel al pulsar avatar; cierra al pulsar fuera
 * Salidas  : JSX del avatar + panel flotante
 */
import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/state/authStore';
import styles from './UserMenu.module.css';

const ROL_COLORS: Record<string, string> = {
  ADMIN:    '#22c55e',
  CAMARERO: '#3b82f6',
  COCINA:   '#f97316',
};

export function UserMenu() {
  const { usuario, logout } = useAuthStore();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [abierto]);

  if (!usuario) return null;

  const inicial = usuario.nombre.charAt(0).toUpperCase();
  const color   = ROL_COLORS[usuario.rol] ?? '#6b7280';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.avatar}
        onClick={() => setAbierto(v => !v)}
        aria-label="Menú de usuario"
        style={{ background: color }}
      >
        {inicial}
      </button>

      {abierto && (
        <div className={styles.panel}>
          <div className={styles.info}>
            <span className={styles.nombre}>{usuario.nombre}</span>
            <span className={styles.badge} style={{ background: color }}>
              {usuario.rol}
            </span>
          </div>
          <hr className={styles.divider} />
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verificar que TypeScript no da errores**

```bash
cd "C:\Users\gatak\Desktop\tpv movil comandero dijital universal\fronted\app"
npx tsc --noEmit 2>&1 | head -20
```
Resultado esperado: sin errores relacionados con `UserMenu`.

---

### Task 2: Crear `UserMenu.module.css`

**Files:**
- Create: `fronted/app/src/shared/components/UserMenu.module.css`

**Step 1: Crear el archivo con este contenido exacto**

```css
/* UserMenu — Avatar + panel flotante */

.wrapper {
  position: relative;
  display: inline-block;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  color: #fff;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.avatar:active {
  opacity: 0.8;
}

.panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 1rem;
  min-width: 180px;
  z-index: 1000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 0.5rem;
}

.nombre {
  font-weight: 600;
  font-size: 0.95rem;
  color: #1f2937;
}

.badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.05em;
  width: fit-content;
}

.divider {
  border: none;
  border-top: 1px solid #f3f4f6;
  margin: 0.5rem 0;
}

.logoutBtn {
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 0.5rem 0.25rem;
  font-size: 0.9rem;
  color: #ef4444;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}

.logoutBtn:hover {
  background: #fef2f2;
}
```

---

### Task 3: Integrar en `TablesPage.tsx`

**Files:**
- Modify: `fronted/app/src/features/tables/ui/TablesPage.tsx`

**Step 1: Añadir el import de UserMenu**

En la línea de imports (tras el import de `styles`), añadir:
```tsx
import { UserMenu } from '@/shared/components/UserMenu';
```

**Step 2: Reemplazar el avatar estático**

Buscar:
```tsx
<div className={styles.avatar}>👤</div>
```

Reemplazar por:
```tsx
<UserMenu />
```

**Step 3: Eliminar el estilo `.avatar` de `TablesPage.module.css` si existe**

Verificar si en `TablesPage.module.css` hay una clase `.avatar`. Si existe y es solo para el `👤` estático, eliminarla — ya no se usa.

**Step 4: Verificar que compila**

```bash
cd "C:\Users\gatak\Desktop\tpv movil comandero dijital universal\fronted\app"
npm run build 2>&1 | tail -10
```
Resultado esperado: `✓ built in X.XXs` sin errores.

**Step 5: Commit**

```bash
cd "C:\Users\gatak\Desktop\tpv movil comandero dijital universal\fronted\app"
git add src/shared/components/UserMenu.tsx src/shared/components/UserMenu.module.css src/features/tables/ui/TablesPage.tsx
git commit -m "feat: UserMenu — avatar con nombre, rol y logout en TablesPage"
```

---

### Task 4: Build APK

**Step 1: Sync Capacitor**

```bash
cd "C:\Users\gatak\Desktop\tpv movil comandero dijital universal\fronted\app"
npx cap sync android
```

**Step 2: Build APK**

```bash
powershell -Command "Set-Location 'C:\Users\gatak\Desktop\tpv movil comandero dijital universal\fronted\app\android'; .\gradlew.bat assembleDebug 2>&1"
```
Resultado esperado: `BUILD SUCCESSFUL`

APK en: `android/app/build/outputs/apk/debug/app-debug.apk`
