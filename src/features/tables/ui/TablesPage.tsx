import { useTablesFlow } from '../logic/useTablesFlow';
import { BottomNav } from '@/shared/components/BottomNav';
import type { Mesa } from '../types/TablesTypes';
import styles from './TablesPage.module.css';

export function TablesPage() {
  const {
    mesasFiltradas, conteos, filtro, setFiltro,
    busqueda, setBusqueda, handleTapMesa,
  } = useTablesFlow();

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
          {([
            { key: 'TODAS', label: `Todas (${conteos.libres + conteos.ocupadas + conteos.pendiente})` },
            { key: 'LIBRES', label: `Libres (${conteos.libres})` },
            { key: 'OCUPADAS', label: `Ocupadas (${conteos.ocupadas})` },
            { key: 'PENDIENTE_COBRO', label: `Cobro (${conteos.pendiente})` },
          ] as const).map(f => (
            <button
              key={f.key}
              className={`${styles.pill} ${filtro === f.key ? styles.pillActive : ''}`}
              onClick={() => setFiltro(f.key)}
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
