import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ApiError } from '@/core/api/apiClient';
import { useAuthStore } from '@/features/auth/state/authStore';
import type { PedidoApi } from '@/features/order/api/orderApi';
import { stationApi, type PrinterStation } from './api';
import { deviceId, kitchenStation, useKitchenStation } from './kitchenStation';
import { printerAvailable, type Printer } from './printer';
import styles from './service.module.css';

const CONNECTION = { online: 'Conectada al servidor', connecting: 'Conectando…', offline: 'Sin conexión · reintentando' } as const;

function roundLabel(round: PedidoApi) {
  return `Mesa ${round.mesa_numero ?? round.mesa_id} · Ronda #${round.id}`;
}

/** Elige qué móvil del local imprime las comandas y, si es este, muestra su estado. */
export function KitchenStationCard({ saved }: { saved: Printer | null }) {
  const user = useAuthStore(state => state.usuario);
  const { activeFor, connection, printerError, failed, recent, notice } = useKitchenStation();
  const [station, setStation] = useState<PrinterStation>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState<number>();
  const restauranteId = user?.restaurante_id ?? null;
  const active = printerAvailable && activeFor != null && activeFor === restauranteId;

  const load = useCallback(async () => {
    try { setStation(await stationApi.estado()); } catch { /* se muestra lo último conocido */ }
  }, []);

  useEffect(() => { void load(); }, [load, activeFor]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try { await action(); await load(); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudo completar la acción.'); }
    finally { setBusy(false); }
  }

  const activate = () => run(async () => {
    if (restauranteId == null) return;
    try {
      await kitchenStation.activate(restauranteId);
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) throw err;
      if (!window.confirm(`${err.message} ¿Quieres que imprima este móvil? El otro dejará de imprimir.`)) return;
      await kitchenStation.activate(restauranteId, true);
    }
    toast.success('Este móvil ya imprime las comandas de todo el local');
  });

  async function reprint(round: PedidoApi) {
    setPrinting(round.id);
    try {
      await kitchenStation.reprint(round);
      toast.success('Copia enviada a la impresora');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo enviar la copia.');
    } finally { setPrinting(undefined); }
  }

  const holder = station?.dispositivo_id;
  return <section className={styles.card} aria-labelledby="estacion-cocina">
    <h2 id="estacion-cocina">Impresora de cocina del local</h2>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error && <p className={styles.error} role="alert">{error}</p>}

    {active ? <>
      <p><strong>Este móvil imprime las comandas de todo el local</strong>, también las que se toman desde la web.
        Déjalo en cocina con la app abierta: la pantalla no se apagará.</p>
      <p><span className={styles.status} data-state={connection === 'online' ? 'ready' : 'pending'}>{CONNECTION[connection]}</span></p>
      {(printerError || failed.length > 0) && <div className={styles.stack}>
        <p className={styles.error} role="alert">{printerError || 'Hay comandas sin imprimir.'} Revisa que la impresora esté encendida, con papel y en la misma red. Se reintenta sola.</p>
        <ul className={styles.lines}>{failed.map(round => <li key={round.id}>{roundLabel(round)}</li>)}</ul>
        <button onClick={() => kitchenStation.retry()}>Reintentar ahora</button>
      </div>}
      {recent.length > 0 && <div className={styles.stack}>
        <h3>Últimas impresas</h3>
        {recent.map(round => <div className={styles.row} key={round.id}>
          <span>{roundLabel(round)}</span>
          <button disabled={printing !== undefined} onClick={() => void reprint(round)}>{printing === round.id ? 'Enviando…' : 'Reimprimir'}</button>
        </div>)}
      </div>}
      <button disabled={busy} onClick={() => {
        if (window.confirm('¿Dejar de imprimir las comandas en este móvil? Ningún móvil las imprimirá hasta que actives otro.')) void run(() => kitchenStation.deactivate());
      }}>Dejar de imprimir en este móvil</button>
    </> : <>
      <p>{holder
        ? <>Ahora imprime las comandas el móvil <strong>«{station?.nombre ?? 'de cocina'}»</strong>.</>
        : 'Ningún móvil imprime las comandas: solo aparecen en la pantalla de cocina.'}</p>
      {printerAvailable && <>
        <button className={styles.primary} disabled={busy || !saved} onClick={() => void activate()}>
          {busy ? 'Activando…' : 'Usar este móvil como impresora de cocina'}
        </button>
        {!saved && <small>Primero guarda una impresora que haya impreso la prueba.</small>}
      </>}
      {holder && user?.rol === 'ADMIN' && <button disabled={busy} onClick={() => {
        if (window.confirm(`¿Desactivar la impresora de cocina en «${station?.nombre ?? 'el otro móvil'}»? Las comandas dejarán de salir en papel.`)) {
          void run(async () => { await stationApi.liberar(deviceId()); });
        }
      }}>Desactivar en ese móvil</button>}
    </>}
  </section>;
}
