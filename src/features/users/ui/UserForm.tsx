/**
 * @module UserForm
 * @description Modal para crear o editar un miembro del personal.
 */
import React, { useState } from 'react';
import { useUsersStore } from '../state/usersStore';
import type { User } from '../types';
import styles from './UserForm.module.css';

interface UserFormProps {
    user?: User;
    onClose: () => void;
}

type UserRole = User['rol'];

export const UserForm: React.FC<UserFormProps> = ({ user, onClose }) => {
    const { createUser, updateUser, resetPassword, isLoading } = useUsersStore();
    const [formData, setFormData] = useState({
        nombre: user?.nombre || '',
        email: user?.email || '',
        password: '',
        rol: user?.rol || 'CAMARERO' as UserRole
    });
    const [newPass, setNewPass] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const isEdit = !!user;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (isEdit) {
                await updateUser(user.id, {
                    nombre: formData.nombre,
                    email: formData.email,
                    rol: formData.rol
                });
            } else {
                await createUser(formData);
            }
            onClose();
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Error al guardar el usuario');
        }
    };

    const handleResetPass = async () => {
        if (!newPass) return;
        try {
            await resetPassword(user!.id, newPass);
            alert('Contraseña actualizada');
            setShowReset(false);
            setNewPass('');
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Error al resetear contraseña');
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h2>{isEdit ? 'Editar Personal' : 'Nuevo Miembro'}</h2>
                    <button className={styles.closeX} onClick={onClose}>&times;</button>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.group}>
                        <label>Nombre Completo</label>
                        <input 
                            type="text" 
                            required 
                            value={formData.nombre} 
                            onChange={e => setFormData({...formData, nombre: e.target.value})}
                            placeholder="Ej. Juan Pérez"
                        />
                    </div>

                    <div className={styles.group}>
                        <label>Email Corporativo</label>
                        <input 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})}
                            placeholder="juan@restaurante.com"
                        />
                    </div>

                    {!isEdit && (
                        <div className={styles.group}>
                            <label>Contraseña Inicial</label>
                            <input 
                                type="password" 
                                required 
                                minLength={8}
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>
                    )}

                    <div className={styles.group}>
                        <label>Rol en el Restaurante</label>
                        <select 
                            value={formData.rol} 
                            onChange={e => setFormData({...formData, rol: e.target.value as UserRole})}
                        >
                            <option value="CAMARERO">Camarero</option>
                            <option value="COCINA">Cocina / KDS</option>
                            <option value="ADMIN">Administrador</option>
                        </select>
                    </div>

                    {formError && (
                        <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: '0 0 8px' }}>
                            {formError}
                        </p>
                    )}

                    <div className={styles.actions}>
                        <button type="button" onClick={onClose} className={styles.cancelBtn}>
                            Cancelar
                        </button>
                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? 'Guardando...' : isEdit ? 'Actualizar Datos' : 'Crear Usuario'}
                        </button>
                    </div>
                </form>

                {isEdit && (
                    <div className={styles.resetSection}>
                        <button 
                            type="button" 
                            className={styles.toggleReset}
                            onClick={() => setShowReset(!showReset)}
                        >
                            {showReset ? '🔼 Ocultar Reset Password' : '🔑 Resetear Contraseña'}
                        </button>
                        
                        {showReset && (
                            <div className={styles.resetForm}>
                                <input 
                                    type="password" 
                                    placeholder="Nueva contraseña temporal" 
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                />
                                <button type="button" onClick={handleResetPass}>
                                    Actualizar Clave
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
