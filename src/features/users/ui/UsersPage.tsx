/**
 * @module UsersPage
 * @description Pantalla de administración de personal (Camareros/Cocina).
 */
import React, { useEffect, useState } from 'react';
import { useUsersStore } from '../state/usersStore';
import type { User } from '../types';
import { UserForm } from './UserForm';
import { BottomNav } from '@/shared/components/BottomNav';
import styles from './UsersPage.module.css';

export const UsersPage: React.FC = () => {
    const { users, isLoading, error, fetchUsers, updateUser } = useUsersStore();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
    const [filterRol, setFilterRol] = useState<string>('todos');
    const [pendingToggle, setPendingToggle] = useState<User | null>(null);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setSelectedUser(undefined);
        setIsFormOpen(true);
    };

    const toggleStatus = (user: User) => setPendingToggle(user);

    const confirmToggle = async () => {
        if (!pendingToggle) return;
        await updateUser(pendingToggle.id, { activo: !pendingToggle.activo });
        setPendingToggle(null);
    };

    const filteredUsers = users.filter(u => filterRol === 'todos' || u.rol === filterRol);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.titles}>
                    <span className={styles.badge}>ADMIN</span>
                    <h1>GESTIÓN DE PERSONAL</h1>
                    <p>{users.length} miembros en la plantilla</p>
                </div>
                
                <div className={styles.headerActions}>
                    <button className={styles.addBtn} onClick={handleAdd}>
                        <span>+</span> Añadir Miembro
                    </button>
                </div>
            </header>

            <section className={styles.filters}>
                {['todos', 'ADMIN', 'CAMARERO', 'COCINA'].map(rol => (
                    <button 
                        key={rol}
                        className={`${styles.filterBtn} ${filterRol === rol ? styles.active : ''}`}
                        onClick={() => setFilterRol(rol)}
                    >
                        {rol === 'todos' ? 'Todos' : rol}
                    </button>
                ))}
            </section>

            <main className={styles.list}>
                {isLoading && users.length === 0 ? (
                    <div className={styles.loading}>Cargando plantilla...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className={styles.empty}>No se encontraron usuarios</div>
                ) : (
                    <div className={styles.grid}>
                        {filteredUsers.map(user => (
                            <div key={user.id} className={`${styles.card} ${!user.activo ? styles.inactive : ''}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.avatar}>
                                        {user.nombre.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.userRole}>
                                        <span className={`${styles.roleTag} ${styles[user.rol.toLowerCase()]}`}>
                                            {user.rol}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className={styles.cardBody}>
                                    <h3>{user.nombre}</h3>
                                    <p>{user.email}</p>
                                </div>

                                <div className={styles.cardActions}>
                                    <button onClick={() => handleEdit(user)} className={styles.editBtn}>
                                        ✏️ Editar
                                    </button>
                                    <button 
                                        onClick={() => toggleStatus(user)} 
                                        className={user.activo ? styles.deactivateBtn : styles.activateBtn}
                                    >
                                        {user.activo ? '🛑 Desactivar' : '✅ Activar'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {pendingToggle && (
                <div className={styles.confirmOverlay}>
                    <div className={styles.confirmBox}>
                        <p>¿{pendingToggle.activo ? 'Desactivar' : 'Activar'} a <strong>{pendingToggle.nombre}</strong>?</p>
                        <div className={styles.confirmActions}>
                            <button className={styles.confirmYes} onClick={confirmToggle}>Confirmar</button>
                            <button className={styles.confirmNo} onClick={() => setPendingToggle(null)}>Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {isFormOpen && (
                <UserForm
                    user={selectedUser}
                    onClose={() => setIsFormOpen(false)}
                />
            )}

            {error && <div className={styles.errorBanner}>{error}</div>}
            <BottomNav />
        </div>
    );
};
