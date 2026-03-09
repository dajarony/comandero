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
