import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/state/authStore';
import { kitchenStation, useKitchenStation } from './kitchenStation';
import { printerAvailable } from './printer';
import styles from './service.module.css';

const CONNECTION = { online: 'Conectada', connecting: 'Conectando…', offline: 'Sin conexión · reintentando' } as const;

/**
 * Mantiene este móvil imprimiendo mientras la app esté abierta, en cualquier pantalla,
 * y deja claro con una barra fija que es la impresora de cocina del local.
 */
export function KitchenStationBar() {
  const user = useAuthStore(state => state.usuario);
  const { activeFor, connection, printerError, failed } = useKitchenStation();
  const enabled = printerAvailable && user?.modo === 'COMANDERO' && activeFor != null && activeFor === user.restaurante_id;

  useEffect(() => {
    if (!enabled) return;
    kitchenStation.start();
    return () => kitchenStation.stop();
  }, [enabled]);

  if (!enabled) return null;
  const state = printerError || failed.length ? 'failed' : connection === 'online' ? 'ready' : 'pending';
  return <Link to="/impresora" className={styles.stationBar} data-state={state} aria-live="polite">
    <strong>🖨️ Impresora de cocina</strong>
    <span>{CONNECTION[connection]}</span>
    {failed.length > 0 && <span>{failed.length} sin imprimir</span>}
    {printerError && !failed.length && <span>Revisa la impresora</span>}
  </Link>;
}
