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
          {usuario.modo === 'COMANDERO' && usuario.rol !== 'COCINA' && (
            <button className={styles.logoutBtn} onClick={() => { setAbierto(false); navigate('/impresora'); }}>Impresora</button>
          )}
          <button className={styles.logoutBtn} onClick={handleLogout}>
            🚪 Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
