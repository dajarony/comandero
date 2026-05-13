/**
 * @module useSettingsFlow
 * @description Hook de lógica para configuración del restaurante
 * SUME Docblock v2.0
 */
import { useState, useEffect } from 'react';
import { settingsApi } from '../api/settingsApi';
import { handleError } from '@/core/errors/errorHandler';
import toast from 'react-hot-toast';

export function useSettingsFlow() {
  const [nombre, setNombre] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    settingsApi.getConfig()
      .then(data => setNombre(data.nombre))
      .catch(err => {
        handleError(err, 'SETTINGS_LOAD');
        setError('No se pudo cargar la configuración');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await settingsApi.updateConfig({ nombre });
      toast.success('Configuración guardada');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Error al guardar');
      handleError(err, 'SETTINGS_SAVE');
    } finally {
      setSaving(false);
    }
  };

  return { nombre, setNombre, loading, saving, error, handleSave };
}
