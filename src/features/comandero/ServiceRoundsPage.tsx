import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { offlineStore, type OutboxRequest } from '@/core/api/offlineStore';
import { useNetworkStore } from '@/core/state/networkStore';
import { tablesApi } from '@/features/tables/api/tablesApi';
import type { Mesa } from '@/features/tables/types/TablesTypes';
import { orderApi, type MenuItemApi, type PedidoApi, type PedidoCreate } from '@/features/order/api/orderApi';
import { comanderoApi, ROUNDS_ENDPOINT } from './api';
import styles from './service.module.css';

type Service = { tables: Mesa[]; rounds: PedidoApi[]; queued: OutboxRequest[] };

function queuedData(item: OutboxRequest) {
  return item.body as unknown as PedidoCreate & { turno: number };
}

export function ServiceRoundsPage() {
  const [service, setService] = useState<Service>();
  const [products, setProducts] = useState<MenuItemApi[]>([]);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState<number>();
  const pending = useNetworkStore(s => s.pendingSyncs);
  const failed = useNetworkStore(s => s.failedSyncs);

  const refresh = useCallback(async () => {
    const queued = (await offlineStore.getOutbox()).filter(item => item.endpoint === ROUNDS_ENDPOINT);
    try {
      const [tables, rounds] = await Promise.all([tablesApi.fetchMesas(), comanderoApi.rondas()]);
      setService({ tables, rounds, queued });
      setError('');
    } catch (err) {
      setService(current => ({ tables: current?.tables ?? [], rounds: current?.rounds ?? [], queued }));
      setError(err instanceof Error ? err.message : 'No se pudieron actualizar las comandas.');
    }
  }, []);

  useEffect(() => {
    const refreshNow = () => { void refresh(); };
    const first = window.setTimeout(refreshNow, 0);
    const timer = window.setInterval(refreshNow, 10_000);
    return () => { window.clearTimeout(first); window.clearInterval(timer); };
  }, [refresh, pending, failed]);

  useEffect(() => { void orderApi.fetchItems().then(setProducts).catch(() => {}); }, []);

  async function close(table: Mesa) {
    if (!window.confirm(`¿Cerrar la mesa ${table.numero}? Sus rondas saldrán de la pantalla de cocina.`)) return;
    setClosing(table.id);
    try {
      await comanderoApi.cerrar(table);
      await refresh();
      toast.success(`Mesa ${table.numero} cerrada`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo cerrar la mesa.');
      void refresh();
    } finally { setClosing(undefined); }
  }

  const activeTables = service?.tables.filter(table => table.estado !== 'LIBRE') ?? [];
  const queued = service?.queued ?? [];

  return <main className={styles.page}>
    <header className={styles.hero}><div><p className={styles.brand}>Comandero</p><h1>Comandas</h1></div>
      <button onClick={() => void refresh()}>Actualizar</button>
    </header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {!service && <p role="status">Cargando comandas…</p>}
    {queued.length > 0 && <section className={styles.stack} aria-label="Envíos sin confirmar">
      {queued.map(item => {
        const data = queuedData(item);
        const table = service?.tables.find(table => table.id === data.mesa_id);
        const failed = item.status === 'failed';
        return <article className={styles.card} key={item.id}>
          <div className={styles.row}><h2>{table ? `Mesa ${table.numero}` : 'Ronda guardada'}</h2>
            <strong className={styles.status} data-state={failed ? 'failed' : 'pending'}>{failed ? 'Envío rechazado' : 'Pendiente de enviar'}</strong></div>
          <ul className={styles.lines}>{data.lineas.map((line, index) => <li key={index}>
            {line.cantidad} × {products.find(product => product.id === line.item_menu_id)?.nombre ?? `Producto ${line.item_menu_id}`}
            {line.nota && <small>{line.nota}</small>}
          </li>)}</ul>
          {failed && <>
            <p>{item.lastError || 'Revisa la ronda antes de volver a enviarla.'}</p>
            {table && <Link className={styles.linkButton} to={`/comanda/${table.id}`} state={{ recover: item.id }}>Revisar y recuperar</Link>}
            <button onClick={async () => {
              if (!window.confirm('¿Quitar esta ronda rechazada del móvil?')) return;
              await offlineStore.removeOutboxItem(item.id);
              await refresh();
            }}>Quitar</button>
          </>}
        </article>;
      })}
    </section>}
    {activeTables.length === 0 && service && queued.length === 0 && !error && <p className={styles.empty}>Todavía no hay comandas abiertas.</p>}
    <section className={styles.stack} aria-label="Mesas en servicio">
      {activeTables.map(table => {
        const rounds = service?.rounds.filter(round => round.mesa_id === table.id) ?? [];
        const hasPending = queued.some(item => item.status === 'pending' && queuedData(item).mesa_id === table.id);
        return <article className={styles.card} key={table.id}>
          <div className={styles.row}><h2>Mesa {table.numero}</h2>
            <Link className={styles.linkButton} to={`/comanda/${table.id}`}>Añadir ronda</Link></div>
          {rounds.map(round => <section className={styles.round} key={round.id}>
            <div className={styles.row}><h3>Ronda #{round.id}</h3>
              <span className={styles.status} data-state={round.estado === 'LISTO' ? 'ready' : 'pending'}>{round.estado === 'LISTO' ? 'Lista' : 'En cocina'}</span></div>
            <ul className={styles.lines}>{round.lineas.map(line => <li key={line.id}>{line.cantidad} × {line.item_nombre}{line.nota && <small>{line.nota}</small>}</li>)}</ul>
          </section>)}
          <button disabled={closing !== undefined || hasPending} onClick={() => void close(table)}>{closing === table.id ? 'Cerrando…' : 'Cerrar mesa'}</button>
          {hasPending && <small>Espera a que se envíen las rondas pendientes.</small>}
        </article>;
      })}
    </section>
  </main>;
}
