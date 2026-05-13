/**
 * @module PublicMenuPage
 * @description Vista pública de la carta (solo lectura) para clientes que escanean el QR.
 * SUME Docblock v2.0 | sin BottomNav — pantalla pública
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { MenuItem, Categoria } from '../../order/types/OrderTypes';
import styles from './PublicMenuPage.module.css';

const CATEGORIAS: (Categoria | 'Todos')[] = [
  'Todos', 'Bebidas', 'Cervezas', 'Vinos', 'Carnes', 'Postres', 'Otros',
];

export const PublicMenuPage: React.FC = () => {
  const { restauranteId } = useParams<{ restauranteId: string }>();
  const [menu, setMenu]               = useState<MenuItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<Categoria | 'Todos'>('Todos');

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || '/api/v1';
    fetch(`${base}/menu/public/${restauranteId || '1'}`)
      .then(r => { if (!r.ok) throw new Error('No se pudo cargar la carta'); return r.json(); })
      .then(setMenu)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [restauranteId]);

  if (loading) return (
    <div className={styles.stateBox}>
      <div className={styles.spinner} />
    </div>
  );

  if (error) return (
    <div className={styles.stateBox}>
      <span className={styles.errorIcon}>⚠️</span>
      <h2 className={styles.errorTitle}>Ups, algo salió mal</h2>
      <p className={styles.errorMsg}>{error}</p>
    </div>
  );

  const filteredMenu = activeCategory === 'Todos'
    ? menu
    : menu.filter(item => item.categoria === activeCategory);

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1 className={styles.heroTitle}>Nuestra Carta</h1>
        <p className={styles.heroSub}>Digital &amp; Contactless</p>
      </header>

      <main className={styles.main}>
        {/* Chips categorías */}
        <div className={styles.chips}>
          {CATEGORIAS.map(cat => (
            <button
              key={cat}
              className={`${styles.chip} ${activeCategory === cat ? styles.chipActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Listado */}
        <div className={styles.list}>
          {filteredMenu.length === 0 ? (
            <p className={styles.emptyMsg}>No hay productos en esta categoría.</p>
          ) : (
            filteredMenu.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardEmoji}>{item.emoji}</div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardName}>{item.nombre}</h3>
                  <span className={styles.cardCat}>{item.categoria}</span>
                </div>
                <span className={styles.cardPrice}>{item.precio.toFixed(2)}€</span>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerText}>Powered by Antigravity POS</p>
      </footer>
    </div>
  );
};
