/**
 * @module SettingsPage
 * @description Página de configuración del restaurante (solo ADMIN)
 * SUME Docblock v2.0
 * Entradas : useSettingsFlow
 * Lógica   : Editar nombre del restaurante, links a otras secciones admin
 * Salidas  : JSX página de ajustes
 */
import { useNavigate } from 'react-router-dom';
import { useSettingsFlow } from '../logic/useSettingsFlow';
import { BottomNav } from '@/shared/components/BottomNav';
import { useAuthStore } from '@/features/auth/state/authStore';
import { AddTable } from '@/features/comandero/AddTable';
import serviceStyles from '@/features/comandero/service.module.css';
import styles from './SettingsPage.module.css';

export function SettingsPage() {
  const navigate = useNavigate();
  const service = useAuthStore(state => state.usuario?.modo === 'COMANDERO');
  const { nombre, setNombre, loading, saving, error, handleSave } = useSettingsFlow();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚙️ Configuración</h1>
        <p className={styles.subtitle}>Ajustes de tu restaurante</p>
      </header>

      {loading ? (
        <p className={styles.loading}>⏳ Cargando...</p>
      ) : (
        <form className={styles.card} onSubmit={handleSave}>
          <h2 className={styles.cardTitle}>Datos del restaurante</h2>

          {error && <p className={styles.error}>⚠️ {error}</p>}

          <div className={styles.fieldGroup}>
            <label className={styles.label}>Nombre del restaurante</label>
            <input
              className={styles.input}
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              minLength={2}
              maxLength={100}
            />
          </div>

          <button type="submit" disabled={saving} className={styles.saveBtn}>
            {saving ? '⏳ Guardando...' : '💾 Guardar cambios'}
          </button>
        </form>
      )}

      {/* Accesos rápidos admin */}
      <div className={styles.linksCard}>
        <h2 className={styles.cardTitle}>Administración</h2>
        <button className={styles.linkBtn} onClick={() => navigate('/admin/carta')}>
          <span>🍽️</span>
          <div>
            <p className={styles.linkTitle}>Gestión de carta</p>
            <p className={styles.linkDesc}>{service ? 'Editar productos y categorías' : 'Editar menú, categorías y precios'}</p>
          </div>
          <span className={styles.arrow}>›</span>
        </button>
        <button className={styles.linkBtn} onClick={() => navigate('/usuarios')}>
          <span>👥</span>
          <div>
            <p className={styles.linkTitle}>Personal</p>
            <p className={styles.linkDesc}>Gestionar camareros y cocina</p>
          </div>
          <span className={styles.arrow}>›</span>
        </button>
        {service ? <button className={styles.linkBtn} onClick={() => navigate('/impresora')}>
          <span>🖨️</span><div><p className={styles.linkTitle}>Impresora de cocina</p><p className={styles.linkDesc}>Conectar y compartir por QR</p></div><span className={styles.arrow}>›</span>
        </button> : <>
        <button className={styles.linkBtn} onClick={() => navigate('/stats')}>
          <span>📊</span>
          <div>
            <p className={styles.linkTitle}>Estadísticas</p>
            <p className={styles.linkDesc}>Ver ventas y rendimiento</p>
          </div>
          <span className={styles.arrow}>›</span>
        </button>
        <button className={styles.linkBtn} onClick={() => navigate('/historial')}>
          <span>📋</span>
          <div>
            <p className={styles.linkTitle}>Historial de pedidos</p>
            <p className={styles.linkDesc}>Ver todos los pedidos cerrados</p>
          </div>
          <span className={styles.arrow}>›</span>
        </button>
        <button className={styles.linkBtn} onClick={() => navigate('/gastos')}>
          <span>💰</span>
          <div>
            <p className={styles.linkTitle}>Gastos</p>
            <p className={styles.linkDesc}>Alquiler, sueldos, compras y más</p>
          </div>
          <span className={styles.arrow}>›</span>
        </button>
        </>}
      </div>
      {service ? <div className={serviceStyles.page} style={{ minHeight: 'auto', paddingInline: 0 }}><AddTable /></div> : <BottomNav />}
    </div>
  );
}
