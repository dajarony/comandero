import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { orderApi, type CategoriaApi, type MenuItemApi } from '@/features/order/api/orderApi';
import { comanderoApi } from './api';
import styles from './service.module.css';

export function ServiceMenuPage() {
  const [categories, setCategories] = useState<CategoriaApi[]>([]);
  const [products, setProducts] = useState<MenuItemApi[]>([]);
  const [editing, setEditing] = useState<MenuItemApi>();
  const [newCategory, setNewCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const [categories, products] = await Promise.all([orderApi.fetchCategorias(), orderApi.fetchItems()]);
    setCategories(categories);
    setProducts(products);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh().catch((err: Error) => setError(err.message)); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function save(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError('');
    try { await action(); await refresh(); toast.success(message); }
    catch (err) { setError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios.'); }
    finally { setBusy(false); }
  }

  function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const input = {
      nombre: String(data.get('nombre')).trim(), categoria_id: Number(data.get('categoria')),
      precio: editing?.precio ?? 0, disponible: data.has('disponible'),
    };
    if (!input.nombre) { setError('Escribe un nombre para el producto.'); return; }
    void save(async () => {
      if (editing) await comanderoApi.actualizarProducto(editing.id, input);
      else await comanderoApi.crearProducto(input);
      setEditing(undefined);
      form.reset();
    }, 'Producto guardado');
  }

  return <main className={styles.page}>
    <header className={styles.hero}><div><p className={styles.brand}>Comandero</p><h1>Carta</h1></div></header>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.stack}>
      <form className={styles.card} onSubmit={event => {
        event.preventDefault();
        void save(async () => { await comanderoApi.crearCategoria(newCategory.trim()); setNewCategory(''); }, 'Categoría añadida');
      }}>
        <h2>Nueva categoría</h2>
        <label>Nombre de la categoría<input required maxLength={100} value={newCategory} onChange={event => setNewCategory(event.target.value)} /></label>
        <button disabled={busy || !newCategory.trim()}>Añadir categoría</button>
      </form>
      {categories.length > 0 && <form key={editing?.id ?? 'new'} className={styles.card} onSubmit={submitProduct}>
        <h2>{editing ? 'Editar producto' : 'Nuevo producto'}</h2>
        <label>Nombre del producto<input required name="nombre" maxLength={200} defaultValue={editing?.nombre} /></label>
        <label>Categoría<select name="categoria" defaultValue={editing?.categoria_id ?? categories[0].id}>
          {categories.map(category => <option key={category.id} value={category.id}>{category.nombre}</option>)}
        </select></label>
        <label><input type="checkbox" name="disponible" defaultChecked={editing?.disponible ?? true} /> Visible al tomar comandas</label>
        <div className={styles.row}><button className={styles.primary} disabled={busy}>Guardar producto</button>
          {editing && <button type="button" disabled={busy} onClick={() => setEditing(undefined)}>Cancelar</button>}
        </div>
      </form>}
      {products.map(product => <article key={product.id} className={`${styles.card} ${styles.row}`}>
        <div><strong>{product.nombre}</strong><p>{product.categoria_nombre} · {product.disponible ? 'Disponible' : 'Oculto'}</p></div>
        <button disabled={busy} onClick={() => { setEditing(product); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Editar</button>
      </article>)}
    </div>
  </main>;
}
