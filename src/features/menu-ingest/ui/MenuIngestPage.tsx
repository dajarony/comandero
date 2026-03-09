import { useRef } from 'react';
import type React from 'react';
import { useMenuIngestFlow } from '../logic/useMenuIngestFlow';
import { BottomNav } from '@/shared/components/BottomNav';
import styles from './MenuIngestPage.module.css';

export function MenuIngestPage() {
  const { items, estado, handleArchivoCSV, handleGuardar, handleDrop, clear } = useMenuIngestFlow();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (archivo) handleArchivoCSV(archivo);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>⚙️ Carta del restaurante</h1>
        <p className={styles.subtitle}>Importa tu menú desde un CSV</p>
      </header>

      {/* Drop Zone */}
      {estado === 'IDLE' && (
        <div
          className={styles.dropZone}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <span className={styles.dropIcon}>📄</span>
          <p className={styles.dropText}>Arrastra tu CSV aquí</p>
          <p className={styles.dropSub}>o toca para seleccionar archivo</p>
          <p className={styles.dropFormat}>Formato: nombre, precio</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Procesando */}
      {estado === 'PROCESANDO' && (
        <div className={styles.procesando}>
          <div className={styles.spinner}>⏳</div>
          <p>Procesando con IA...</p>
        </div>
      )}

      {/* Preview tabla */}
      {(estado === 'REVISANDO' || estado === 'GUARDADO') && (
        <section className={styles.previewSection}>
          <div className={styles.previewHeader}>
            <span className={styles.previewCount}>{items.length} items detectados</span>
            {estado !== 'GUARDADO' && (
              <button className={styles.resetBtn} onClick={clear}>✕ Cancelar</button>
            )}
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th></th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td className={styles.tdEmoji}>{item.emoji}</td>
                    <td className={styles.tdNombre}>{item.nombre}</td>
                    <td>
                      <span className={styles.catBadge}>{item.categoriaDetectada}</span>
                    </td>
                    <td className={styles.tdPrecio}>{item.precio.toFixed(2)}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Guardado OK */}
      {estado === 'GUARDADO' && (
        <div className={styles.guardadoOk}>
          ✅ Carta guardada correctamente
        </div>
      )}

      {/* FAB Guardar */}
      {estado === 'REVISANDO' && (
        <div className={styles.fabContainer}>
          <button className={styles.guardarBtn} onClick={handleGuardar}>
            💾 GUARDAR EN SISTEMA ({items.length} items)
          </button>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
