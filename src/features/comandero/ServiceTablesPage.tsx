import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tablesApi } from '@/features/tables/api/tablesApi';
import type { Mesa } from '@/features/tables/types/TablesTypes';
import { UserMenu } from '@/shared/components/UserMenu';
import styles from './service.module.css';

export function ServiceTablesPage() {
  const [tables, setTables] = useState<Mesa[]>();
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'free'>('all');

  useEffect(() => {
    let active = true;
    const refresh = () => tablesApi.fetchMesas().then(data => {
      if (active) { setTables(data); setError(''); }
    }).catch((err: Error) => { if (active) setError(err.message); });
    void refresh();
    const timer = window.setInterval(refresh, 12_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  const occupied = tables?.filter(table => table.estado !== 'LIBRE').length ?? 0;
  const visible = tables?.filter(table => filter === 'all' || (table.estado === 'LIBRE') === (filter === 'free')) ?? [];
  visible.sort((a, b) => a.numero.localeCompare(b.numero, 'es', { numeric: true }));

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div><p className={styles.brand}>Comandero</p><h1>Mesas</h1></div><UserMenu />
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!tables && !error && <p role="status">Cargando mesas…</p>}
    {tables && <>
      <div className={styles.categories} aria-label="Filtrar mesas">
        <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas ({tables.length})</button>
        <button aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>Ocupadas ({occupied})</button>
        <button aria-pressed={filter === 'free'} onClick={() => setFilter('free')}>Libres ({tables.length - occupied})</button>
      </div>
      <div className={styles.tables}>
        {visible.map(table => <Link className={styles.table} key={table.id} to={`/comanda/${table.id}`} data-active={table.estado !== 'LIBRE'}>
          <span>Mesa</span><strong>{table.numero}</strong><span>{table.estado === 'LIBRE' ? 'Libre' : 'Ocupada'}</span>
        </Link>)}
      </div>
      {visible.length === 0 && <p className={styles.empty}>No hay mesas en esta vista.</p>}
    </>}
  </main>;
}
