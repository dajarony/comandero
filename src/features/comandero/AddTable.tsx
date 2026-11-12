import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { comanderoApi } from './api';
import styles from './service.module.css';

export function AddTable() {
  const [number, setNumber] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try { await comanderoApi.crearMesa(number.trim()); setNumber(''); toast.success('Mesa añadida'); }
    catch (err) { toast.error(err instanceof Error ? err.message : 'No se pudo añadir la mesa.'); }
    finally { setBusy(false); }
  }

  return <form className={styles.card} onSubmit={submit}>
    <h2>Nueva mesa</h2>
    <label>Nombre o número<input value={number} maxLength={10} required onChange={event => setNumber(event.target.value)} /></label>
    <button disabled={busy || !number.trim()}>Añadir mesa</button>
  </form>;
}
