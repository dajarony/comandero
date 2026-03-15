/**
 * OrderPageV2 — Comandero con menús agrupados (Bebidas, Comida, Snacks)
 * SUME Docblock v2.0 | Entradas: mesaId (URL) | Salidas: navigate ticket/mesas
 * Navegación: Grupos → Categorías → Items (3 niveles)
 */
import { useParams } from 'react-router-dom';
import { CarritoSheet, PedirCuentaBtn } from './OrderPageV2.helpers';
import { useOrderPageState, FAV_CAT } from './OrderPageV2.hooks';
import styles from './OrderPageV2.module.css';

export function OrderPageV2() {
  const { mesaId = '1' } = useParams<{ mesaId: string }>();
  const s = useOrderPageState(mesaId);

  // Nivel actual: 'grupos' | 'categorias' | 'items'
  const nivel = s.catActiva ? 'items' : s.grupoActivo ? 'categorias' : 'grupos';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={s.handleBack}>
          ← {s.backLabel}
        </button>
        {s.busquedaActiva
          ? <input autoFocus className={styles.searchInput} placeholder="Buscar en el menú..."
              value={s.busqueda} onChange={e => s.setBusqueda(e.target.value)} />
          : <div className={styles.headerCenter}>
              <p className={styles.mesaTitle}>Mesa {mesaId}</p>
              <p className={styles.mesaSubtitle}>{s.subtitulo}</p>
            </div>
        }
        <div className={styles.headerActions}>
          <button className={styles.searchBtn} onClick={() => s.setBusquedaActiva(v => !v)}>🔍</button>
          <button className={styles.cartBtn} onClick={() => s.setCarritoVisible(!s.carritoVisible)}>
            🛒{s.totalItems > 0 && <span className={styles.cartBadge}>{s.totalItems}</span>}
          </button>
        </div>
      </header>

      {(s.loadingCats || s.loadingItems) && <div className={styles.loading}>⏳ Cargando...</div>}

      {s.errorMenu && (
        <p style={{ textAlign: 'center', color: '#ef4444', padding: '1rem', fontWeight: 600 }}>{s.errorMenu}</p>
      )}

      {/* ═══ NIVEL 0: Grupos de menú (Bebidas, Comida, Snacks) ═══ */}
      {!s.loadingCats && !s.busqueda && nivel === 'grupos' && (
        <div className={styles.catGrid}>
          <button className={`${styles.catCard} ${styles.catCardFav}`} onClick={() => s.setCatActiva(FAV_CAT)}>
            <span className={styles.catCardEmoji}>⭐</span>
            <span className={styles.catCardName}>Favoritos</span>
          </button>
          {s.gruposConConteo.map(grupo => (
            <button key={grupo.id}
              className={styles.catCard}
              style={{ background: grupo.color }}
              onClick={() => grupo.count > 0 ? s.setGrupoActivo(grupo) : undefined}
            >
              <span className={styles.catCardEmoji}>{grupo.emoji}</span>
              <span className={styles.catCardName}>{grupo.nombre}</span>
              {grupo.count === 0 && <span className={styles.catCardBadge}>Próximamente</span>}
              {grupo.count > 0 && <span className={styles.catCardCount}>{grupo.count} categorías</span>}
            </button>
          ))}
        </div>
      )}

      {/* ═══ NIVEL 1: Categorías dentro del grupo ═══ */}
      {!s.loadingCats && !s.busqueda && nivel === 'categorias' && (
        <div className={styles.catGrid}>
          {s.categoriasDelGrupo.map(cat => (
            <button key={cat.id} className={styles.catCard} onClick={() => s.setCatActiva(cat)}>
              <span className={styles.catCardEmoji}>{cat.emoji}</span>
              <span className={styles.catCardName}>{cat.nombre}</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══ NIVEL 2: Items de la categoría / Búsqueda / Favoritos ═══ */}
      {(s.busqueda || nivel === 'items') && (
        <div className={styles.itemsList}>
          {s.itemsMostrar.map(item => (
            <div key={item.id} className={styles.itemCard} onClick={() => s.addToCart(item)} role="button" tabIndex={0}>
              <div className={styles.itemEmoji}>{item.emoji}</div>
              <div className={styles.itemInfo}>
                <p className={styles.itemNombre}>{item.nombre}</p>
                {item.descripcion && <p className={styles.itemDesc}>{item.descripcion}</p>}
              </div>
              <div className={styles.itemRight}>
                <span className={styles.itemPrecio}>{item.precio.toFixed(2)}€</span>
                <div className={styles.itemRightBtns}>
                  <button className={styles.favBtn} onClick={e => s.toggleFav(e, item.id)}>
                    {s.favoritos.includes(item.id) ? '⭐' : '☆'}
                  </button>
                  <span className={styles.addBtn}>+</span>
                </div>
              </div>
            </div>
          ))}
          {s.itemsMostrar.length === 0 && <p className={styles.emptyMsg}>No hay resultados</p>}
        </div>
      )}

      {s.carrito.length === 0 && s.tienePedidosActivos && (
        <PedirCuentaBtn onPedir={s.handlePedirCuenta} enviando={s.enviando} />
      )}

      {s.carritoVisible && s.carrito.length > 0 && (
        <CarritoSheet carrito={s.carrito} total={s.total} onClose={() => s.setCarritoVisible(false)}
          onAdd={s.addToCart} onRemove={s.removeFromCart} onUpdateNota={s.updateNota}
          onRepetirRonda={s.repetirRonda} tieneUltimaRonda={s.ultimaRonda.length > 0}
          onMarchar={s.handleMarchar} enviando={s.enviando} />
      )}

      {s.carrito.length > 0 && !s.carritoVisible && (
        <div className={styles.fabContainer}>
          <button className={styles.marchBtn} onClick={s.handleMarchar} disabled={s.enviando}>
            {s.enviando ? '⏳ Enviando...' : '📋 ENVIAR PEDIDO'}
            <span className={styles.marchBtnTotal}>{s.total.toFixed(2)}€</span>
          </button>
        </div>
      )}
    </div>
  );
}
