/**
 * @module GastoFormInline
 * @description Formulario inline para añadir un nuevo gasto.
 * SUME Docblock v2.0
 * Entradas : onSubmit (GastoForm), onCancel (), isLoading
 * Lógica   : Estado local del form, validación básica, llamada a onSubmit
 * Salidas  : JSX con campos nombre, categoría, importe y día de vencimiento
 */

import React, { useState } from 'react';
import type { CategoriaGasto, GastoForm } from '../types';
import styles from './GastosPage.module.css';

const CATEGORIA_LABELS: Record<CategoriaGasto, string> = {
  FIJO_MENSUAL: 'Fijos Mensuales',
  NOMINA: 'Nóminas y SS',
  VARIABLE: 'Variables',
  IRREGULAR: 'Irregulares',
};
const CATEGORIA_ORDER: CategoriaGasto[] = ['FIJO_MENSUAL', 'NOMINA', 'VARIABLE', 'IRREGULAR'];
const INITIAL: GastoForm = { nombre: '', categoria: 'FIJO_MENSUAL', importe: 0, dia_vencimiento: null };

interface Props {
  onSubmit: (data: GastoForm) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const GastoFormInline: React.FC<Props> = ({ onSubmit, onCancel, isLoading }) => {
  const [form, setForm] = useState<GastoForm>(INITIAL);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'importe' ? parseFloat(value) || 0
        : name === 'dia_vencimiento' ? (value ? parseInt(value) : null)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || form.importe <= 0) return;
    await onSubmit(form);
    setForm(INITIAL);
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.formTitle}>Nuevo Gasto</h2>
      <input className={styles.input} name="nombre" placeholder="Nombre del gasto"
        value={form.nombre} onChange={handleChange} required />
      <select className={styles.input} name="categoria" value={form.categoria} onChange={handleChange}>
        {CATEGORIA_ORDER.map(c => <option key={c} value={c}>{CATEGORIA_LABELS[c]}</option>)}
      </select>
      <input className={styles.input} name="importe" type="number" min="0" step="0.01"
        placeholder="Importe (€)" value={form.importe || ''} onChange={handleChange} required />
      <input className={styles.input} name="dia_vencimiento" type="number" min="1" max="31"
        placeholder="Día vencimiento (1-31, opcional)" value={form.dia_vencimiento ?? ''} onChange={handleChange} />
      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={onCancel}>Cancelar</button>
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Gasto'}
        </button>
      </div>
    </form>
  );
};
