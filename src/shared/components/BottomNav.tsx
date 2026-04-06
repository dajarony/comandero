/**
 * @module BottomNav
 * @description Barra de navegación inferior — pill flotante estilizada.
 *              Se oculta en rutas de flujo y se auto-oculta al hacer scroll hacia abajo.
 * @sume v2.0
 */
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../features/auth/state/authStore';
import { useState, useEffect, useRef } from 'react';
import styles from './BottomNav.module.css';

function IconMesas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconComandas() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function IconCocina() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2c0 0-4 4-4 8a4 4 0 0 0 8 0c0-4-4-8-4-8z" />
      <path d="M12 12c0 0-2 2-2 4a2 2 0 0 0 4 0c0-2-2-4-2-4z" />
      <path d="M6 20h12" />
    </svg>
  );
}

function IconAjustes() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconIA() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const RUTAS_SIN_NAV = ['/comanda/', '/cobro/', '/ticket/', '/login', '/registro'];

const allTabs = [
  { path: '/mesas',         Icon: IconMesas,    label: 'Mesas',    roles: ['ADMIN', 'CAMARERO'] },
  { path: '/comandas',      Icon: IconComandas, label: 'Comandas', roles: ['ADMIN', 'CAMARERO'] },
  { path: '/cocina',        Icon: IconCocina,   label: 'Cocina',   roles: ['ADMIN', 'COCINA'] },
  { path: '/asistente',     Icon: IconIA,       label: 'IA',       roles: ['ADMIN'] },
  { path: '/configuracion', Icon: IconAjustes,  label: 'Ajustes',  roles: ['ADMIN'] },
];

export function BottomNav() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { usuario } = useAuthStore();
  const [oculta, setOculta] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY.current + 8)      setOculta(true);
      else if (y < lastY.current - 4) setOculta(false);
      lastY.current = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const ocultarNav = RUTAS_SIN_NAV.some(r => location.pathname.startsWith(r));
  if (ocultarNav) return null;

  const filteredTabs = allTabs.filter(tab => usuario?.rol && tab.roles.includes(usuario.rol));

  return (
    <>
      <div className={`${styles.navSpacer} ${oculta ? styles.navSpacerHidden : ''}`} />
      <nav className={`${styles.bottomNav} ${oculta ? styles.bottomNavHidden : ''}`}>
        {filteredTabs.map(tab => {
          const isActive = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              className={`${styles.navItem} ${isActive ? styles.navActive : ''}`}
              onClick={() => navigate(tab.path)}
            >
              <tab.Icon />
              <span className={styles.navLabel}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
