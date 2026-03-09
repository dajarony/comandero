import React, { useState } from "react";
import styles from "./Dashboard.module.css";

// Mock Data para las mesas
const inicialMesas = [
  { id: "01", estado: "LIBRE" },
  { id: "02", estado: "OCUPADA" },
  { id: "03", estado: "LIBRE" },
  { id: "04", estado: "OCUPADA" },
  { id: "05", estado: "LIBRE" },
  { id: "06", estado: "LIBRE" },
  { id: "07", estado: "LIBRE" },
  { id: "08", estado: "OCUPADA" },
  { id: "09", estado: "LIBRE" },
  { id: "10", estado: "LIBRE" },
  { id: "11", estado: "LIBRE" },
  { id: "12", estado: "OCUPADA" },
];

export const DashboardPage: React.FC = () => {
  const [mesas] = useState(inicialMesas);
  const [filtro, setFiltro] = useState("TODAS"); // TODAS, LIBRES, OCUPADAS
  const [busqueda, setBusqueda] = useState("");

  const mesasFiltradas = mesas.filter((mesa) => {
    const coincideFiltro =
      filtro === "TODAS" ||
      (filtro === "LIBRES" && mesa.estado === "LIBRE") ||
      (filtro === "OCUPADAS" && mesa.estado === "OCUPADA");
    const coincideBusqueda = mesa.id.includes(busqueda);
    return coincideFiltro && coincideBusqueda;
  });

  const contarLibres = mesas.filter((m) => m.estado === "LIBRE").length;
  const contarOcupadas = mesas.filter((m) => m.estado === "OCUPADA").length;

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>🍴</div>
          <h1 className={styles.brandName}>Comandero Digital</h1>
        </div>
        <div className={styles.avatar}>👤</div>
      </header>

      {/* Búsqueda y Filtros */}
      <section className={styles.controlsSection}>
        <div className={styles.searchBar}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar mesa por número..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className={styles.filtersWrapper}>
          <button
            className={`${styles.filterPill} ${filtro === "TODAS" ? styles.active : ""}`}
            onClick={() => setFiltro("TODAS")}
          >
            Todas las mesas
          </button>
          <button
            className={`${styles.filterPill} ${filtro === "LIBRES" ? styles.active : ""}`}
            onClick={() => setFiltro("LIBRES")}
          >
            Libres ({contarLibres})
          </button>
          <button
            className={`${styles.filterPill} ${filtro === "OCUPADAS" ? styles.active : ""}`}
            onClick={() => setFiltro("OCUPADAS")}
          >
            Ocupadas ({contarOcupadas})
          </button>
        </div>
      </section>

      {/* Grid de Mesas */}
      <section className={styles.tablesGrid}>
        {mesasFiltradas.map((mesa) => (
          <button
            key={mesa.id}
            className={`${styles.tableCard} ${mesa.estado === "LIBRE" ? styles.libre : styles.ocupada}`}
          >
            <span className={styles.tableNumber}>{mesa.id}</span>
            <span className={styles.tableStatus}>{mesa.estado}</span>
          </button>
        ))}
      </section>

      {/* FAB CTA (Call to Action Flotante o Abajo) */}
      <div className={styles.fabContainer}>
        <button className={styles.btnCrearComanda}>
          <span className={styles.plusIcon}>+</span> CREAR NUEVA COMANDA
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className={styles.bottomNav}>
        <button className={`${styles.navItem} ${styles.navActive}`}>
          <span className={styles.navIcon}>🪟</span>
          <span className={styles.navLabel}>Mesas</span>
        </button>
        <button className={styles.navItem}>
          <span className={styles.navIcon}>📋</span>
          <span className={styles.navLabel}>Comandas</span>
        </button>
        <button className={styles.navItem}>
          <span className={styles.navIcon}>🕒</span>
          <span className={styles.navLabel}>Historial</span>
        </button>
        <button className={styles.navItem}>
          <span className={styles.navIcon}>⚙️</span>
          <span className={styles.navLabel}>Ajustes</span>
        </button>
      </nav>
    </div>
  );
};

export default DashboardPage;
