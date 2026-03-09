import { useParams, useNavigate } from 'react-router-dom';
import { useOrderFlow } from '../logic/useOrderFlow';
import styles from './OrderPage.module.css';

export function OrderPage() {
  const { mesaId = '01' } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const {
    categorias, categoriaActiva, setCategoriaActiva,
    itemsCategoria, carrito, total,
    carritoVisible, setCarritoVisible,
    handleAddItem, handleRemoveItem,
    handleMarcharPedido, getCantidadItem,
  } = useOrderFlow(mesaId);

  const totalItems = carrito.reduce((acc, l) => acc + l.cantidad, 0);

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/mesas')}>
          ← Mesas
        </button>
        <h2 className={styles.mesaTitle}>Mesa {mesaId}</h2>
        <button className={styles.cartBtn} onClick={() => setCarritoVisible(!carritoVisible)}>
          🛒
          {totalItems > 0 && <span className={styles.cartBadge}>{totalItems}</span>}
        </button>
      </header>

      {/* Category Tabs */}
      <nav className={styles.catTabs}>
        {categorias.map(cat => (
          <button
            key={cat}
            className={`${styles.catTab} ${categoriaActiva === cat ? styles.catTabActive : ''}`}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Items Grid */}
      <section className={styles.itemsGrid}>
        {itemsCategoria.map(item => {
          const qty = getCantidadItem(item.id);
          return (
            <div key={item.id} className={styles.itemCard}>
              <div className={styles.itemEmoji}>{item.emoji}</div>
              <div className={styles.itemNombre}>{item.nombre}</div>
              <div className={styles.itemPrecio}>{item.precio.toFixed(2)}€</div>
              <div className={styles.itemControls}>
                {qty > 0 && (
                  <>
                    <button className={styles.qtyBtn} onClick={() => handleRemoveItem(item.id)}>−</button>
                    <span className={styles.qtyNum}>{qty}</span>
                  </>
                )}
                <button className={styles.addBtn} onClick={() => handleAddItem(item)}>+</button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Carrito Panel */}
      {carritoVisible && (
        <div className={styles.carritoPanel}>
          <div className={styles.carritoHeader}>
            <h3>Carrito</h3>
            <button onClick={() => setCarritoVisible(false)}>✕</button>
          </div>
          {carrito.length === 0 ? (
            <p className={styles.carritoVacio}>Sin items</p>
          ) : (
            <>
              {carrito.map(linea => (
                <div key={linea.item.id} className={styles.carritoLinea}>
                  <span className={styles.carritoEmoji}>{linea.item.emoji}</span>
                  <span className={styles.carritoNombre}>{linea.item.nombre}</span>
                  <span className={styles.carritoCantidad}>×{linea.cantidad}</span>
                  <span className={styles.carritoSubtotal}>{(linea.item.precio * linea.cantidad).toFixed(2)}€</span>
                </div>
              ))}
              <div className={styles.carritoTotal}>
                <span>Total</span>
                <span>{total.toFixed(2)}€</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB Marchar */}
      {carrito.length > 0 && (
        <div className={styles.fabContainer}>
          <button className={styles.marchBtn} onClick={handleMarcharPedido}>
            🚀 MARCHAR PEDIDO · {total.toFixed(2)}€
          </button>
        </div>
      )}
    </div>
  );
}
