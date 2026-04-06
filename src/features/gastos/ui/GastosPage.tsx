/**
 * @module GastosPage
 * @description Pantalla principal de Gastos del Negocio con resumen, vencimientos y lista por categoría.
 * SUME Docblock v2.0
 * Entradas : useGastosStore (gastos, resumen, isLoading, error)
 * Lógica   : Render condicional de resumen, vencimientos, lista agrupada y formulario inline
 * Salidas  : JSX con header, cards de resumen, break-even, lista por categoría y GastoFormInline
 */

import React, { useEffect, useState } from 'react';
import { useGastosStore } from '../state/gastosStore';
import type { CategoriaGasto, GastoForm } from '../types';
import { GastoFormInline } from './GastoFormInline';
import { BottomNav } from '@/shared/components/BottomNav';
import styles from './GastosPage.module.css';

const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  FIJO_MENSUAL: 'Fijos Mensuales',
  NOMINA: 'Nóminas y SS',
  VARIABLE: 'Variables',
  IRREGULAR: 'Irregulares',
};
const CATEGORIA_ORDER: CategoriaGasto[] = ['FIJO_MENSUAL', 'NOMINA', 'VARIABLE', 'IRREGULAR'];

export const GastosPage: React.FC = () => {
  const { gastos, resumen, isLoading, error, fetchGastos, crearGasto, eliminarGasto } = useGastosStore();
  const [showForm, setShowForm] = useState(false);
  const [pendingEliminar, setPendingEliminar] = useState<{ id: number; nombre: string } | null>(null);

  useEffect(() => { fetchGastos(); }, [fetchGastos]);

  const handleEliminar = (id: number, nombre: string) => setPendingEliminar({ id, nombre });

  const confirmEliminar = () => {
    if (!pendingEliminar) return;
    eliminarGasto(pendingEliminar.id);
    setPendingEliminar(null);
  };

  const handleCrear = async (data: GastoForm) => {
    await crearGasto(data);
    setShowForm(false);
  };

  const gastosPorCategoria = CATEGORIA_ORDER
    .map(cat => ({ cat, label: CATEGORIA_LABELS[cat], items: gastos.filter(g => g.categoria === cat && g.activo) }))
    .filter(g => g.items.length > 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titles}>
          <span className={styles.badge}>FINANZAS</span>
          <h1>Gastos del Negocio</h1>
          <p>Control de costes y vencimientos</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowForm(v => !v)}>＋ Añadir</button>
      </header>

      {resumen && (
        <section className={styles.resumenGrid}>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>💰</span>
            <div>
              <p className={styles.statLabel}>Total Mensual</p>
              <p className={styles.statValue}>{resumen.total_mensual.toFixed(2)}€</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statIcon}>📅</span>
            <div>
              <p className={styles.statLabel}>Coste / Día</p>
              <p className={styles.statValue}>{resumen.coste_diario.toFixed(2)}€</p>
            </div>
          </div>
        </section>
      )}

      {resumen && (
        <div className={styles.breakEvenCard}>
          <p className={styles.breakEvenTitle}>Punto de equilibrio diario</p>
          <p className={styles.breakEvenAmount}>{resumen.coste_diario.toFixed(2)}€/día</p>
          <p className={styles.breakEvenMsg}>
            Para cubrir gastos necesitas vender al menos <strong>{resumen.coste_diario.toFixed(2)}€</strong> cada día.
            ¡Cada venta cuenta!
          </p>
        </div>
      )}

      {resumen && resumen.proximos_vencimientos.length > 0 && (
        <section className={styles.vencimientosSection}>
          <h2 className={styles.sectionTitle}>Próximos Vencimientos</h2>
          {resumen.proximos_vencimientos.map(g => (
            <div key={g.id} className={styles.alertCard}>
              <span className={styles.alertIcon}>⚠️</span>
              <div className={styles.alertBody}>
                <strong>{g.nombre}</strong>
                <span>Día {g.dia_vencimiento} — {g.importe.toFixed(2)}€</span>
              </div>
            </div>
          ))}
        </section>
      )}

      {showForm && (
        <GastoFormInline onSubmit={handleCrear} onCancel={() => setShowForm(false)} isLoading={isLoading} />
      )}

      <main className={styles.listaSection}>
        {isLoading && gastos.length === 0 ? (
          <div className={styles.loading}>Cargando gastos...</div>
        ) : gastosPorCategoria.length === 0 ? (
          <div className={styles.empty}>No hay gastos registrados. ¡Añade el primero!</div>
        ) : (
          gastosPorCategoria.map(({ cat, label, items }) => (
            <div key={cat} className={styles.categoriaGroup}>
              <div className={styles.categoriaHeader}>
                <span>{label}</span>
                <span className={styles.categoriaTotal}>
                  {items.reduce((s, g) => s + g.importe, 0).toFixed(2)}€
                </span>
              </div>
              {items.map(g => (
                <div key={g.id} className={styles.gastoRow}>
                  <div className={styles.gastoInfo}>
                    <span className={styles.gastoNombre}>{g.nombre}</span>
                    {g.dia_vencimiento && <span className={styles.gastoDia}>Día {g.dia_vencimiento}</span>}
                  </div>
                  <div className={styles.gastoRight}>
                    <span className={styles.gastoImporte}>{g.importe.toFixed(2)}€</span>
                    <button className={styles.deleteBtn} onClick={() => handleEliminar(g.id, g.nombre)} title="Eliminar">🗑</button>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </main>

      {pendingEliminar && (
        <div className={styles.confirmOverlay}>
          <div className={styles.confirmBox}>
            <p>¿Eliminar <strong>"{pendingEliminar.nombre}"</strong>?</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmYes} onClick={confirmEliminar}>Eliminar</button>
              <button className={styles.confirmNo} onClick={() => setPendingEliminar(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {error && <div className={styles.errorBanner}>{error}</div>}
      <BottomNav />
    </div>
  );
};
